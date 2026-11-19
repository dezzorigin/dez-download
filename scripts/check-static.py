#!/usr/bin/env python3
"""Gate statis P1 untuk dez-download: larangan P0 anti-slop + tag OG/Twitter
+ data asli repo. Dijalankan CI (job static-checks) SETELAH regenerasi
og-image.png. Tanpa jaringan. Exit 1 bila ada yang gagal.

Yang diperiksa:
  1. P0 di app/: tanpa gradient (bg-gradient-*, bg-clip-text), tanpa font
     Inter, tanpa emoji fungsional, tanpa copy vanity, tanpa URL GitHub
     lama, tanpa sisa maintenance mode.
  2. Tag OG/Twitter lengkap di app/layout.tsx (title, description, type,
     url, image + twitter card summary_large_image).
  3. public/og-image.png ada, >= 10KB, 1200x630.
  4. Data asli: jumlah platform di app/page.tsx == 54 dan kicker hero
     menyebut angka yang sama; tidak ada file .env yang ter-commit.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fails = []


def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f" — {detail}" if detail and not ok else ""))
    if not ok:
        fails.append(name)


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def count_platforms(src):
    return len(re.findall(r'\{\s*name:\s*"[^"]+"\s*,', src))


page = read("app/page.tsx")
layout = read("app/layout.tsx")
docs_page = read("app/docs/page.tsx")
css = read("app/globals.css")
worker = read("worker/_worker.js")

# ── 1. Larangan P0 ──────────────────────────────────────────────────────
for rel, src in [("app/page.tsx", page), ("app/docs/page.tsx", docs_page), ("app/globals.css", css)]:
    check(
        f"{rel}: tanpa gradient",
        not re.search(r"bg-gradient|linear-gradient\(|radial-gradient\(", src),
        rel,
    )
    check(f"{rel}: tanpa bg-clip-text", "bg-clip-text" not in src, rel)
check("layout: tanpa font Inter", "Inter" not in layout, "layout.tsx")
check("page: tanpa emoji fungsional", not re.search(r"[🚀🔥💡📊⚠️🛠️🔇🔊✨🌟🛠📦]", page), "page.tsx")
check("page: tanpa maintenance mode", "MAINTENANCE_MODE" not in page and "maintenance" not in page.lower(), "page.tsx")
check("page: tanpa copy vanity", not re.search(r"10x faster|99\.9% uptime|50k\+ users|Unlock the power|Elevate your", page, re.I), "page.tsx")
check("repo: tanpa URL GitHub lama", "nblauliadka/DezDownload" not in page + layout + docs_page, "github.com/nblauliadka/DezDownload")
check("repo: URL GitHub benar ada", "github.com/dezzorigin/dez-download" in page, "page.tsx")

# ── 2. Tag OG/Twitter di layout (Metadata API Next.js — tag literal
#    baru muncul di HTML hasil build; di sini dicek kunci metadatanya) ──
check("layout: metadataBase ke pages.dev", "metadataBase" in layout and "dez-download.pages.dev" in layout, "layout.tsx")
check("layout: openGraph block", "openGraph: {" in layout, "layout.tsx")
check("layout: openGraph type website", 'type: "website"' in layout, "layout.tsx")
check("layout: openGraph url", "url: SITE_URL" in layout, "layout.tsx")
check("layout: openGraph images 1200x630", "width: 1200" in layout and "height: 630" in layout, "layout.tsx")
check("layout: twitter block", "twitter: {" in layout, "layout.tsx")
check("layout: twitter summary_large_image", 'card: "summary_large_image"' in layout, "layout.tsx")
check(
    "layout: og-image absolut ke dez-download.pages.dev",
    ("https://dez-download.pages.dev/og-image.png" in layout)
    or ('SITE_URL = "https://dez-download.pages.dev"' in layout and "/og-image.png" in layout),
    "layout.tsx",
)

# ── 3. og-image.png ────────────────────────────────────────────────────
og_path = os.path.join(ROOT, "public", "og-image.png")
check("og-image.png ada", os.path.exists(og_path))
if os.path.exists(og_path):
    size = os.path.getsize(og_path)
    check("og-image.png >= 10KB", size >= 10240, f"{size} byte")
    try:
        from PIL import Image

        with Image.open(og_path) as im:
            check("og-image.png 1200x630", im.size == (1200, 630), f"{im.size}")
    except ImportError:
        print("SKIP ukuran og-image: Pillow tidak tersedia")

# ── 4. Data asli repo ──────────────────────────────────────────────────
n = count_platforms(page)
check("platform: jumlah di kode == 54", n == 54, f"terhitung {n}")
check("platform: kicker hero menyebut 54", "54 PLATFORM" in page, "page.tsx")
check("worker: rute /api/download ada", "/api/download" in worker, "worker/_worker.js")
check("worker: rute /api/proxy ada", "/api/proxy" in worker, "worker/_worker.js")
check("worker: tanpa emoji di pesan error", not re.search(r"[⚠️🛠️]", worker), "worker/_worker.js")

# Tidak ada file .env yang ter-commit (hanya .env.example yang boleh ada)
env_files = []
for dirpath, _dirs, files in os.walk(ROOT):
    if ".git" in dirpath or "node_modules" in dirpath:
        continue
    for fn in files:
        if re.match(r"^\.env(\..+)?$", fn) and fn != ".env.example":
            env_files.append(os.path.relpath(os.path.join(dirpath, fn), ROOT))
check("tanpa file .env ter-commit", not env_files, ", ".join(env_files))
check(".env.example ada", os.path.exists(os.path.join(ROOT, ".env.example")))
if os.path.exists(os.path.join(ROOT, ".env.example")):
    ex = read(".env.example")
    check(".env.example: tanpa nilai kunci asli", "COBALT_API_KEY=" not in ex or "isi-bila" in ex or "your-" in ex.lower(), ".env.example")

print()
if fails:
    print(f"STATIC CHECKS GAGAL: {len(fails)} check gagal.")
    sys.exit(1)
print("STATIC CHECKS OK.")
