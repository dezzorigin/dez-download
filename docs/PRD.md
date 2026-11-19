# PRD — DezDownload

## 1. Informasi Proyek

| Field | Nilai |
|---|---|
| Nama Proyek | DezDownload |
| Tech Stack | Next.js 15 (static export) + Cloudflare Pages Worker |
| Status | Proper (v0.2.0) — live di Cloudflare Pages |
| Penanggung Jawab | Nabil Aulia Dika (dezzorigin) |
| Versi Dokumen | 2.0 |
| Tanggal | 19 Nov 2026 |

## 2. Latar Belakang

DezDownload adalah downloader media universal: pengguna menempel tautan
dari media sosial, aplikasi mengekstrak tautan media langsung (video,
audio, gambar) lewat Cobalt API, lalu pengguna mengunduh format yang
diinginkan. Versi 0.1.x (Jul–Nov 2026) adalah Next.js App Router dengan
route handler dinamis — dan sejak 20 Jul 2026 fitur intinya dimatikan
oleh `MAINTENANCE_MODE = true`, sehingga halaman hanya memajang banner
"server down". PRD v2.0 ini mengunci perbaikan total: mode perawatan
dihapus, aplikasi dijadikan static export + Pages Worker, landing
dibangun ulang mengikuti kontrak desain di `DESIGN.md`.

## 3. Masalah yang Diselesaikan

- Mengunduh video/audio dari 54 platform tanpa akun, tanpa iklan, tanpa
  aplikasi tambahan.
- Memilih kualitas: hasil diurutkan (video 8K → 144p, audio bitrate
  tertinggi dulu) dengan penanda mana yang punya audio.
- Tidak ada file pengguna yang disimpan di server mana pun.

## 4. Tujuan & Sasaran

- Ekstraksi berfungsi end-to-end dari halaman live (bukan sekadar form).
- Setiap klaim di landing bisa dicek di kode atau di hasil ekstraksi.
- Deploy deterministik: static export + worker, CI hijau penuh.

## 5. Ruang Lingkup

### In Scope
- Form tempel tautan + hasil manifest (video MP4/WebM, audio, tautan fallback).
- Drawer 54 platform (klik mengisi kolom tautan).
- Drawer Legal & Terms, halaman `/docs`.
- Worker `/api/download` (GET + POST) dan `/api/proxy`.
- Cache 10 menit + penggabungan permintaan duplikat.
- PWA (service worker + manifest + prompt install).
- CI: build, typecheck, lint, worker unit test, advisory sweep OSV,
  gate P0 + OG, Playwright e2e, smoke.

### Out of Scope
- Akun pengguna, riwayat unduhan, antrean unduhan tersimpan.
- Transcoding / konversi format di server.
- Instance Cobalt sendiri (pengguna memakai `COBALT_API_URL` bila perlu).
- Pembayaran / monetisasi.

## 6. Fitur & Persyaratan Fungsional

| ID | Fitur | Kriteria |
|---|---|---|
| F-01 | Tempel tautan + sanitasi | `list`/`si`/param kosong dibersihkan sebelum dikirim; URL tidak valid ditolak dengan pesan jelas |
| F-02 | Ekstraksi video | Panggilan Cobalt `videoQuality: max, downloadMode: auto`; hasil diurutkan resolusi menurun |
| F-03 | Ekstraksi audio | Panggilan paralel `downloadMode: audio`; peti audio sendiri (MP3/M4A, s.d. 320kbps) |
| F-04 | Hasil picker | Respons Cobalt `picker` (galeri foto/video) diuraikan per item |
| F-05 | Label peti | Tiap format berlabel `EXT · kualitas`; terbaik ber-audio dicap BEST WITH AUDIO; tanpa audio dicap VIDEO ONLY |
| F-06 | Proxy unduhan | `GET /api/proxy?url=&filename=` mengembalikan attachment |
| F-07 | Cache | URL sama di-cache 10 menit; permintaan bersamaan digabung |
| F-08 | Error jujur | Auth Cobalt / rate limit / URL invalid / platform tidak didukung — masing-masing punya pesan sendiri |
| F-09 | Drawer platform | 54 platform; klik mengisi kolom + fokus ke input |
| F-10 | Legal & docs | Drawer Legal & Terms + halaman `/docs` dengan arsitektur dan batasan yang jujur |

## 7. Persyaratan Non-Fungsional

- **Performa:** halaman statis dari Pages; ekstraksi dibatasi timeout 30 detik per panggilan Cobalt.
- **Keamanan:** rahasia (`.env.local`, `COBALT_API_KEY`) tidak boleh ter-commit; kunci hanya lewat Pages env var. Tidak ada `npm audit` sebagai gate (dev-only false positive) — advisory sweep OSV untuk dependensi produksi.
- **Aksesibilitas:** label pada input, `aria-label` tombol ikon, `focus-visible`, target sentuh min 44px, `prefers-reduced-motion` dihormati, kontras AA.
- **Mobile:** 390px tanpa scroll horizontal (diuji Playwright Pixel 7).
- **Maintainability:** logika ekstraksi murni di `worker/_worker.js` + unit test `node --test`; frontend hanya render.

## 8. Arsitektur & Tech Stack

Lihat `ARCHITECTURE.md` + `architecture.html`. Ringkas: Next.js 15
`output: 'export'` → `out/` (situs statis) + `worker/_worker.js` di-copy
ke `out/_worker.js` → Cloudflare Pages direct upload (worker jadi
`_worker.bundle`, aset lain via binding `ASSETS`) → Cobalt v10 API.

## 9. Milestone / Roadmap

| Fase | Status |
|---|---|
| Inisialisasi & scaffolding | ✅ (Jul 2026) |
| Pengembangan fitur inti | ✅ (Cobalt v10, Jul 2026) |
| Mode perawatan (fitur dimatikan) | ❌ dihapus (v0.2.0, 19 Nov 2026) |
| Rebuild proper: static export + worker + landing baru | ✅ (19 Nov 2026) |
| Testing & QA (CI + e2e) | ✅ (19 Nov 2026) |
| Deployment (Cloudflare Pages) | ✅ (19 Nov 2026) |
| Dokumentasi | ✅ (README + docs/) |

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Instance publik Cobalt butuh auth | Pesan error jujur + `COBALT_API_KEY` / `COBALT_API_URL` via Pages env var (lihat DEPLOYMENT.md) |
| Platform mengubah format / menolak | Error per-platform; daftar 54 platform disebut sebagai "dikenali", bukan "dijamin" |
| Konfigurasi env bocor | `.gitignore` + `.env.example` + gitleaks di CI |
| Dependency usang / rentan | advisory-sweep OSV tiap PR; lockfile di-commit |
| Build artifact besar | `out/` + `.next/` di `.gitignore`; ikon 4,4 MB dicatat sebagai utang (lihat ARCHITECTURE.md) |

## 11. Kriteria Keberhasilan

- Aplikasi berjalan tanpa error di lingkungan dev (`npm run build && npm run serve`).
- Landing live 200 + marker + tag OG/Twitter + og-image 200 image/*.
- `/api/download` tanpa url menjawab 400; dengan URL menjawab JSON `Status` boolean.
- CI hijau penuh termasuk Playwright e2e (desktop + Pixel 7).
- README & docs lengkap dan up-to-date; tidak ada secret ter-commit.

## 12. Lampiran

- Desain: `DESIGN.md` (+ `docs/DESIGN.md` — kontrak yang sama).
- Arsitektur: `ARCHITECTURE.md` + `architecture.html`.
- Testing: `TESTING.md`. Deploy: `DEPLOYMENT.md`.
- Lisensi: MIT (LICENSE).
