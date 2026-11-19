# DEPLOYMENT.md — DezDownload

## Tujuan

- Situs live: **https://dez-download.pages.dev**
- Repo: **https://github.com/dezzorigin/dez-download**
- Metode: Cloudflare Pages **direct upload** via
  `~/workspace/github-actions/cf_pages.py` (API token via vault —
  jangan minta kredensial, jangan tempel token di chat).

## Prasyarat

- `npm run build` sukses lokal/CI (menghasilkan `out/` + `out/_worker.js`).
- Nama proyek pilihan pertama: `dez-download`. Fallback bila nama
  dipakai akun lain (create mengembalikan nama bersufiks):
  `dezdownload`, lalu `unduh-dez`.

## Langkah deploy

```bash
# 1. Build (static export + copy worker)
npm run build

# 2. Buat proyek Pages (sekali saja; bila sudah ada, lewati)
python3 ~/workspace/github-actions/cf_pages.py create-project dez-download

# 3. Deploy direktori out/ (production)
python3 ~/workspace/github-actions/cf_pages.py deploy dez-download out/
```

`cf_pages.py` mengunggah aset, lalu melampirkan `out/_worker.js`
sebagai `_worker.bundle` (paritas wrangler: file `_worker.js`
dikecualikan dari manifest aset dan dikirim sebagai bundle worker).
Worker mendapat binding `ASSETS` otomatis dari Pages.

## Verifikasi live (wajib sebelum merge)

```bash
# pakai python urllib dengan UA browser (UA default python kena 403 Cloudflare)
python3 - <<'EOF'
import urllib.request
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"}
def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.headers.get_content_type(), r.read().decode("utf-8", "replace")
s, _, html = get("https://dez-download.pages.dev/")
assert s == 200 and "Tempel tautan" in html, s
assert 'property="og:title"' in html and "twitter:card" in html
assert "dez-download.pages.dev/og-image.png" in html
s, ct, _ = get("https://dez-download.pages.dev/og-image.png")
assert s == 200 and ct.startswith("image/"), (s, ct)
print("LIVE OK: root 200 + marker + og tags + og-image image/*")
EOF
```

Tambahan (curl):

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://dez-download.pages.dev/api/download"
# harus 400 (tanpa url) — membuktikan worker hidup
```

## Environment variables (Pages dashboard)

Atur di Cloudflare Dashboard → Pages → dez-download → Settings →
Environment Variables (Production). **Bukan** di repo, **bukan** di
`.env.local` yang ter-commit.

| Variabel | Wajib? | Keterangan |
|---|---|---|
| `COBALT_API_URL` | Tidak | Default `https://api.cobalt.tools`. Isi bila memakai instance sendiri. |
| `COBALT_API_KEY` | Bila instance butuh auth | Header `Api-Key` ke Cobalt. Instance publik kini meminta auth — tanpa ini ekstraksi gagal dengan pesan jujur. |

Setelah mengubah env var: **redeploy** (env var hanya dibaca worker
saat request, jadi deploy ulang tidak wajib untuk nilai baru — tapi
lakukan redeploy bila ragu).

## Alur rilis (branch → PR → merge)

1. Kerjakan di branch `feat/proper` (dibuat dari `main`).
2. Push via `gh_push_tree.py` (Git Data API — menangani penghapusan
   file yang tidak ada lagi secara lokal).
3. Buat PR ke `main` via `gh_write.py` (atau `gh` CLI bila tersedia).
4. Merge HANYA setelah CI hijau penuh (build, worker-test,
   advisory-sweep, static-checks, playwright-e2e, smoke).
5. Deploy `out/` dari `main` ke Pages, verifikasi live (di atas).
6. Set homepage repo ke `https://dez-download.pages.dev`
   (`gh_set_homepage.py`), hapus branch, verifikasi 404.

## Batas verifikasi dari VM (jujur)

- **POST dari VM menggantung** (terbukti 18 Nov 2026, docsumm): POST
  via exec curl maupun headless Chrome ke endpoint live menggantung
  tanpa respons — GET ke host yang sama 200 normal. Artinya ekstraksi
  nyata (`POST /api/download` dengan URL media) TIDAK BISA diverifikasi
  end-to-end dari VM ini. Verifikasi live yang dilakukan dari VM:
  root 200 + marker + OG + og-image + validasi 400 worker.
- Ekstraksi end-to-end dengan URL media nyata adalah **follow-up
  browser live** (atau CI `live-smoke` bila ditambah panggilan Cobalt
  asli — saat ini tidak, karena instance publik butuh auth).
- **Screenshot + video demo** juga follow-up browser live — Chrome
  lokal tidak bisa start di VM.
