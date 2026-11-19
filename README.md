# DezDownload

**Paste a link, get the media.** Downloader video, audio, dan gambar
dari 54 platform — TikTok, Instagram, YouTube, X, Spotify, dan lainnya —
lewat Cobalt API. Tanpa akun, tanpa iklan, tanpa menyimpan file Anda.

- **Live:** https://dez-download.pages.dev
- **Repo:** https://github.com/dezzorigin/dez-download
- **Status:** proper v0.2.0 — CI hijau, deploy Cloudflare Pages

> Screenshot isi web + video demo: follow-up (browser live). Belum
> tersedia di PR ini — lihat laporan PR.

## Cara kerja

1. Tempel tautan media di kolom form (parameter playlist/pelacak
   dibersihkan otomatis).
2. Pages Worker bertanya ke instance Cobalt — dua panggilan paralel:
   video kualitas tertinggi (`downloadMode: auto`) dan audio
   (`downloadMode: audio`).
3. Hasil tampil sebagai **manifest format**: peti video MP4/WebM
   diurutkan 8K → 144p, peti audio MP3/M4A sampai 320kbps. Peti
   terbaik ber-audio dicap `BEST WITH AUDIO`. Klik label peti untuk
   mengunduh.

## Tech stack

- **Frontend:** Next.js 15 (App Router, static export) + React 19 +
  Tailwind CSS v4 — Space Grotesk + IBM Plex Mono
- **API produksi:** Cloudflare Pages Worker (`worker/_worker.js`,
  tanpa dependensi) — endpoint `/api/download` dan `/api/proxy`
- **Ekstraksi:** Cobalt v10 API
- **Testing:** node:test (worker), Playwright (e2e, desktop + Pixel 7),
  OSV advisory sweep, gate statis P0 + OG

Arsitektur lengkap: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) +
diagram [`docs/architecture.html`](docs/architecture.html).

## Menjalankan lokal

```bash
npm ci
npm run build        # static export ke out/ + copy worker
npm run serve        # http://127.0.0.1:8500 — sajikan out/ + worker
```

`npm run dev` hanya menyajikan frontend — rute `/api/*` hidup lewat
worker, jadi pakai `npm run serve` untuk menguji ekstraksi end-to-end.

### Environment (opsional)

Salin `.env.example` ke `.env.local` bila memakai instance Cobalt
sendiri:

```bash
COBALT_API_URL=https://api.cobalt.tools
# COBALT_API_KEY=isi-bila-instance-butuh-auth
```

Di produksi, variabel ini diisi sebagai Pages environment variable
(bukan di repo). Instance publik `api.cobalt.tools` kini meminta
autentikasi — tanpa kunci, ekstraksi gagal dengan pesan yang jujur.

## API worker

| Rute | Metode | Keterangan |
|---|---|---|
| `/api/download?url=…` | GET, POST (`{"url": …}`) | Ekstrak media; jawab JSON `{ Status, Code, Result, Error }` |
| `/api/proxy?url=…&filename=…` | GET | Unduh media sebagai attachment |

## Testing

```bash
npm test             # unit test worker (9 tes, tanpa network)
npm run typecheck
npm run lint
python3 scripts/advisory-sweep.py   # OSV, dependensi produksi
python3 scripts/check-static.py     # gate P0 + OG + data asli
npm run e2e          # Playwright — HANYA di CI (Chromium lokal tidak bisa start di VM dev)
node scripts/smoke.mjs              # marker di out/ (setelah build)
```

Detail: [`docs/TESTING.md`](docs/TESTING.md).

## Dokumentasi

- PRD: [`docs/PRD.md`](docs/PRD.md)
- Arsitektur: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Desain (kontrak arah + referensi): [`docs/DESIGN.md`](docs/DESIGN.md)
- Deploy: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Batasan yang jujur

- Tidak semua tautan dari 54 platform pasti berhasil — platform bisa
  menolak atau mengubah formatnya sewaktu-waktu.
- Worker tidak menyimpan media, riwayat, atau akun apa pun.
- Unduh hanya media publik yang berhak Anda simpan; hormati hak cipta.

## Lisensi

MIT — lihat [LICENSE](./LICENSE).

---
Dikembangkan oleh **dezzorigin** (Nabil Aulia Dika).
