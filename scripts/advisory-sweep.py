#!/usr/bin/env python3
"""Sweep dependensi produksi (npm) terhadap OSV (Open Source Vulnerabilities).

Pola repo #24-#49: 1 POST ke api.osv.dev/v1/querybatch untuk semua paket
produksi. JANGAN ganti ke `npm audit` (melaporkan advisory dev-only
sebagai temuan produksi) atau ke GitHub Advisory DB API + GITHUB_TOKEN
(401 deterministik di CI).

Repo ini (Next.js 15 + Pages Worker) punya package-lock.json: paket
produksi = entri `packages` di lock yang TIDAK bertanda `"dev": true`.
Ekosistem npm. HIGH/CRITICAL = gagal (exit 1). Advisory yang ditarik
(withdrawn) diabaikan.

Usage:
    python3 scripts/advisory-sweep.py
No token needed. Exit code 0 = production tree clean, 1 = findings,
2 = API error.
"""
import json
import os
import sys
import urllib.error
import urllib.request

SEVERITIES = ("HIGH", "CRITICAL")
OSV_BATCH_URL = "https://api.osv.dev/v1/querybatch"


def load_prod_packages(lock_path):
    """(name, version) produksi dari package-lock.json (dev != true)."""
    with open(lock_path) as f:
        lock = json.load(f)
    pkgs = {}
    for key, entry in (lock.get("packages") or {}).items():
        if not key.startswith("node_modules/"):
            continue
        if entry.get("dev") is True:
            continue
        # Nested installs: node_modules/a/node_modules/b -> b
        rest = key
        while rest.startswith("node_modules/"):
            rest = rest[len("node_modules/"):]
        if "/node_modules/" in rest:
            rest = rest.rsplit("/node_modules/", 1)[1]
        parts = rest.split("/")
        if rest.startswith("@") and len(parts) >= 2:
            name = "/".join(parts[:2])
        else:
            name = parts[0]
        version = entry.get("version")
        if name and version:
            pkgs.setdefault(name, set()).add(version)
    return {name: sorted(vers) for name, vers in sorted(pkgs.items())}


def severity_of(vuln):
    ds = vuln.get("database_specific") or {}
    sev = (ds.get("severity") or "").upper()
    if sev in ("CRITICAL", "HIGH", "MODERATE", "LOW"):
        return sev
    for entry in vuln.get("severity", []) or []:
        try:
            score = float(entry.get("score", ""))
        except (TypeError, ValueError):
            continue
        if score >= 9.0:
            return "CRITICAL"
        if score >= 7.0:
            return "HIGH"
        if score >= 4.0:
            return "MODERATE"
        return "LOW"
    return "UNKNOWN"


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    lock_path = os.path.join(root, "package-lock.json")
    if not os.path.exists(lock_path):
        print("ERROR: package-lock.json tidak ditemukan", file=sys.stderr)
        return 2
    prod = load_prod_packages(lock_path)
    total = sum(len(v) for v in prod.values())
    print(f"Dependensi produksi: {len(prod)} paket, {total} versi")
    for name, vers in prod.items():
        print(f"  {name}: {', '.join(vers)}")

    queries = []
    for name, vers in prod.items():
        for ver in vers:
            queries.append({"package": {"name": name, "ecosystem": "npm"}, "version": ver})
    payload = json.dumps({"queries": queries}).encode()
    req = urllib.request.Request(
        OSV_BATCH_URL, data=payload, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.build_opener().open(req, timeout=120) as r:
            batch = json.load(r)
    except urllib.error.HTTPError as e:
        print(f"ERROR: OSV {e.code}: {e.read()[:500].decode('utf-8', 'replace')}", file=sys.stderr)
        return 2
    except Exception as e:
        print(f"ERROR: OSV request gagal: {e}", file=sys.stderr)
        return 2

    findings = []
    for query, result in zip(queries, batch.get("results", [])):
        for vuln in result.get("vulns", []):
            if vuln.get("withdrawn"):
                continue
            sev = severity_of(vuln)
            if sev in SEVERITIES:
                vid = vuln.get("id", "?")
                summary = (vuln.get("summary") or "")[:160]
                findings.append(
                    f"{sev} {query['package']['name']}@{query['version']}: {vid} — {summary}"
                )

    if findings:
        print(f"\nGAGAL: {len(findings)} temuan HIGH/CRITICAL di dependensi produksi:")
        for f in findings:
            print(f"  - {f}")
        return 1
    print("\nOK: tidak ada temuan HIGH/CRITICAL di dependensi produksi.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
