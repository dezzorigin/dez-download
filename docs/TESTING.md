# TESTING.md — DezDownload

## Ringkasan strategi

| Lapisan | Alat | Perintah | Di mana |
|---|---|---|---|
| Unit worker (pure) | node:test | `npm test` | Lokal + CI (`worker-test`) |
| Typecheck | tsc | `npm run typecheck` | CI (`build`) |
| Lint | eslint | `npm run lint` | CI (`build`) |
| Advisory sweep | OSV | `python3 scripts/advisory-sweep.py` | CI (`advisory-sweep`) |
| Gate statis P0 + OG | Python | `python3 scripts/check-static.py` | CI (`static-checks`) |
| E2E | Playwright | `npm run e2e` | CI saja (`playwright-e2e`) |
| Smoke out/ + worker | Node + curl | `node scripts/smoke.mjs` + curl | CI (`smoke`) |
| Live smoke | curl | (lihat ci.yml `live-smoke`) | CI main saja, non-gating |

Chromium lokal TIDAK BISA start di VM dev (mmap memfd ditolak) — e2e
dan play-test headless hanya di CI. Screenshot + video demo adalah
follow-up browser live, bukan gate merge.

## Unit test worker — `worker/_worker.test.mjs` (9 tes)

Fungsi pure yang diuji (tanpa network): `sanitizeUrl`,
`isCobaltOk`, `getError`, `getExtension`, `getTitle`,
`getQualityFromFilename`, `buildResult`.

- Sanitasi menghapus `list`/`si`/param kosong, mempertahankan param lain.
- `isCobaltOk` menerima `tunnel`/`redirect`/`picker`, menolak `error`
  dan HTTP non-2xx.
- `getError` menjelaskan kebutuhan auth Cobalt tanpa membocorkan nilai
  kunci (asersi: tidak ada string token ≥ 32 karakter).
- `buildResult` menggabungkan video tunnel + audio tunnel, menguraikan
  `picker` (photo/video/gif), dan `ok: false` bila keduanya gagal.

Jalankan: `npm test` (9/9 hijau lokal, 19 Nov 2026).

## E2E Playwright — `e2e/landing.spec.ts` (6 tes × 2 proyek)

Proyek: `desktop` (Desktop Chrome) + `mobile` (Pixel 7 — JANGAN iPhone,
WebKit tidak ter-install di CI). `webServer` menjalankan
`npm run build && PORT=8500 node scripts/serve-worker.mjs`.

1. **Tool page** — judul, hero satu kolom, form, header pil, footer;
   tag OG/Twitter ada; og-image 200 `image/*`.
2. **Ekstraksi (mock API)** — route `/api/download*` di-mock dengan
   fixture sukses; manifest hasil tampil (BEST WITH AUDIO, VIDEO ONLY,
   VIDEO CRATE, AUDIO CRATE).
3. **Ekstraksi gagal (mock API)** — fixture `Status: false`; pesan error
   tampil di `role="alert"`; tidak ada manifest.
4. **Drawer platform** — klik TikTok mengisi kolom tautan.
5. **API worker 400** — `/api/download` dan `/api/proxy` tanpa `url`
   menjawab 400 (tanpa memanggil Cobalt).
6. **Mobile 390px** — tanpa scroll horizontal; tombol Extract Media terlihat.

Mock dipakai supaya e2e deterministik: panggilan Cobalt asli bergantung
pada layanan upstream (auth, rate limit) dan tidak boleh membuat CI
merah acak. Perilaku worker terhadap Cobalt asli ditutup oleh smoke
live (batas: POST dari VM menggantung — lihat DEPLOYMENT.md).

## Gate statis — `scripts/check-static.py`

- P0: tanpa gradient, tanpa `bg-clip-text`, tanpa font Inter, tanpa
  emoji fungsional, tanpa maintenance mode, tanpa copy vanity, tanpa URL
  GitHub lama.
- OG/Twitter: kunci metadata di `app/layout.tsx` lengkap + og-image
  absolut ke `dez-download.pages.dev`.
- `public/og-image.png` ada, ≥ 10 KB, 1200×630 (dicek via Pillow).
- Data asli: jumlah platform di kode == 54 dan kicker hero menyebut 54;
  worker berisi rute `/api/download` + `/api/proxy`; tanpa file `.env`
  ter-commit; `.env.example` tanpa nilai kunci.

## Advisory sweep — `scripts/advisory-sweep.py`

Satu POST `querybatch` ke `api.osv.dev` untuk semua dependensi produksi
dari `package-lock.json` (entri `dev != true`). HIGH/CRITICAL = gagal.
Bukan `npm audit` (melaporkan advisory dev-only).

Catatan: `axios` di lock sudah 1.18.1 (patched untuk CVE-2025-27152) —
range `^1.7.9` di `package.json` mengizinkannya.

## Smoke — `scripts/smoke.mjs` + curl (job `smoke`)

- Marker di `out/`: `index.html`, `docs/index.html`, `_worker.js`,
  `404.html`, `og-image.png` ≥ 10 KB; "Extract Media", "MANIFEST",
  "54 PLATFORMS", "Universal Extraction Engine" ada di bundle;
  tanpa `MAINTENANCE_MODE`; worker berisi kedua rute API.
- Serve + curl: landing 200 + marker + `og:title` + og-image absolut;
  `/api/download` dan `/api/proxy` tanpa url → 400; og-image
  `content-type: image/*`; `/docs/` 200; path tak dikenal 404.

## Yang TIDAK diuji (batas jujur)

- Ekstraksi nyata terhadap Cobalt publik dari CI: tidak diuji sebagai
  gate — instance publik butuh auth dan responsnya di luar kendali repo.
  Verifikasi manual: isi `COBALT_API_KEY` di Pages env var, lalu coba
  satu tautan TikTok/YouTube dari browser live.
- Screenshot desktop/mobile + video demo: follow-up (browser live),
  bukan gate merge.
