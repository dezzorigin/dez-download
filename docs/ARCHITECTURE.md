# ARCHITECTURE.md — DezDownload

## Ringkasan

DezDownload adalah situs statis (Next.js static export) + satu Pages
Worker yang menjadi "server" API-nya. Tidak ada server Node yang
berjalan di produksi; tidak ada database; tidak ada media yang disimpan.

```
Pengguna (browser)
  │  GET /  /docs/  /og-image.png  (situs statis)
  ▼
Cloudflare Pages  ──►  out/  (hasil `next build`, static export)
  │  /api/download  /api/proxy
  ▼
Pages Worker  (worker/_worker.js → out/_worker.js → _worker.bundle)
  │  POST https://api.cobalt.tools/  (x2 paralel: video auto + audio)
  ▼
Cobalt v10 API  ──►  tautan media langsung (CDN sumber)
  │
  └─► Browser mengunduh langsung dari CDN sumber
```

Diagram visual (HTML + inline SVG, bukan Mermaid): `architecture.html`.

## Lapisan

### 1. Frontend — `app/`

Next.js 15 App Router, `output: 'export'`, `trailingSlash: true`.

| File | Peran |
|---|---|
| `app/layout.tsx` | Metadata + OG/Twitter (URL absolut ke `dez-download.pages.dev`), font Space Grotesk + IBM Plex Mono |
| `app/page.tsx` | Halaman utama (produk asli repo, struktur dipulihkan 19 Nov — audit-fix): header pil melayang, hero satu kolom (judul + form), manifest hasil, footer asli, drawer Legal + Platform, modal install, toast |
| `app/docs/page.tsx` | Halaman dokumentasi (konten jujur — tanpa paywall, tanpa klaim palsu) |
| `app/globals.css` | Token dermaga (CSS vars) + utilitas `.dock-panel`, `.manifest-perforation` |
| `lib/utils.ts` | `cn()` + `forceDownload()` (buka tautan media di tab baru) |
| `hooks/` | Dihapus di v0.2.0 (`use-mobile.ts` tak terpakai + melanggar `react-hooks/set-state-in-effect`) |

`next/font/google` mengunduh font saat build (butuh network di CI) dan
menyertakannya di `out/` — halaman live tidak bergantung ke Google Fonts
saat runtime.

### 2. Worker — `worker/_worker.js`

Satu file ES module, tanpa dependensi. Di-copy ke `out/_worker.js` oleh
`npm run build`; `cf_pages.py` mengunggahnya sebagai `_worker.bundle`.
Di luar `/api/*`, semua request diteruskan ke `env.ASSETS` (situs statis).

**Endpoint:**

| Rute | Metode | Perilaku |
|---|---|---|
| `/api/download?url=…` | GET, POST (JSON `{"url"}`) | Ekstrak via `downr()`; sukses di-cache CDN 3 menit (`s-maxage=180, stale-while-revalidate=300`) |
| `/api/proxy?url=…&filename=…` | GET | Fetch media, kembalikan sebagai `attachment` (Content-Disposition + nama file aman) |

**Alur `downr(url, env)`:**

1. Validasi `https?://`; sanitasi URL (hapus `list`, `si`, param kosong).
2. Cache in-memory 10 menit; permintaan bersamaan untuk URL sama
   digabung lewat `pendingRequests` (dog-pile prevention).
3. Dua panggilan Cobalt paralel (timeout 30 detik tiap panggilan):
   - video: `{ url, videoQuality: "max", downloadMode: "auto" }`
   - audio: `{ url, downloadMode: "audio" }`
4. Bentuk hasil lewat `buildResult()` (pure, unit-tested):
   - `tunnel`/`redirect` → satu media video/audio dari `filename`
     (ekstensi + kualitas ditebak dari nama file).
   - `picker` → tiap item jadi media (photo → jpg, gif → gif, video → mp4).
5. Gagal → `{ Status: false, Code, Error }` dengan pesan per jenis
   kegagalan (lihat `getError()`): auth, rate limit, URL invalid,
   YouTube dibatasi, konten terlalu panjang, platform tidak didukung.

**Konfigurasi (Pages environment variables, bukan `.env`):**

| Variabel | Default | Keterangan |
|---|---|---|
| `COBALT_API_URL` | `https://api.cobalt.tools` | Base URL instance Cobalt v10 |
| `COBALT_API_KEY` | (kosong) | Header `Authorization: Api-Key …` bila instance butuh auth |

**Batasan yang jujur:** instance publik `api.cobalt.tools` kini meminta
autentikasi. Tanpa kunci atau instance sendiri, ekstraksi gagal dengan
pesan yang menjelaskan hal itu. Ini bukan bug worker — ini keadaan
layanan upstream (lihat `docs/DEPLOYMENT.md`).

### 3. Deploy — Cloudflare Pages (direct upload)

`npm run build` menghasilkan `out/` (situs statis + `_worker.js`) yang
diunggah lewat `scripts`/`cf_pages.py` (API token via vault). Tidak ada
`wrangler.toml`, tidak ada build di sisi Cloudflare. Nama proyek:
`dez-download` (fallback: `dezdownload`, `unduh-dez`).

## Keputusan yang sengaja dibuat

1. **Static export + worker, bukan `output: 'standalone'`.** Pages
   direct-upload tidak menjalankan server Node. Route handler Next.js
   (`app/api/*`) dihapus dan logikanya dipindah ke worker — satu-satunya
   cara API tetap hidup di Pages.
2. **Worker tanpa dependensi.** `fetch` bawaan Workers menggantikan
   axios (axios 1.18.1 tetap ada di `package.json` sebagai dependensi
   produksi yang kini tak terpakai — utang teknis; menghapusnya butuh
   regenerasi `package-lock.json`, dicatat di bawah).
3. **Mode perawatan dihapus, bukan diperbaiki.** `MAINTENANCE_MODE`
   mematikan fitur inti sejak Jul 2026. Produk "proper" harus bisa
   dipakai; kalau upstream down, error-nya yang bicara.
4. **Paywall dokumentasi dihapus.** Halaman `/docs` lama menyembunyikan
   arsitektur di balik blur + ajakan follow GitHub. Dokumentasi yang
   disembunyikan bukan dokumentasi.
5. **Font via `next/font/google`, bukan CDN runtime.** Halaman live
   tetap jalan walau Google Fonts diblokir.

## Utang teknis (dicatat jujur, bukan disembunyikan)

- `axios`, `@google/genai`, `@hookform/resolvers`, `firebase-tools`
  masih di `package.json` tapi tidak diimpor kode mana pun
  (peninggalan v0.1). Menghapusnya butuh regenerasi lockfile — lakukan
  di mesin dengan npm, lalu pastikan `npm ci` tetap hijau.
- `public/icon-512x512.png` + `apple-touch-icon.png` masing-masing
  4,4 MB (peninggalan v0.1) — sebaiknya dikompresi; tidak disentuh di
  PR ini supaya diff tetap fokus.
- `metadata.json` (AI Studio) dihapus — tidak relevan dengan produk.
- `hooks/use-mobile.ts` dipertahankan walau belum dipakai halaman baru;
  hapus bila tidak terpakai di PR berikutnya.
