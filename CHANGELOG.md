# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Catatan: entri sebelum 0.2.0 adalah teks template yang tidak
> terverifikasi terhadap kode (misalnya klaim magnet link / multi-provider
> tidak pernah ada di repo). Entri 0.2.0 ke bawah ditulis dari keadaan
> kode yang sebenarnya.

## [0.2.0] - 2026-11-19

### Added
- Pages Worker (`worker/_worker.js`, tanpa dependensi) sebagai server API produksi: `GET/POST /api/download` dan `GET /api/proxy`
- Unit test worker (9 tes pure, `node --test`)
- CI lengkap: build + typecheck + lint, worker-test, advisory sweep OSV, gate statis P0 + OG, Playwright e2e (desktop + Pixel 7), smoke out/ + worker, live-smoke non-gating
- Docs: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, `docs/DESIGN.md`, `docs/architecture.html` (diagram HTML+SVG)
- `public/og-image.png` 1200x630 (PIL, palet dermaga) + tag OG/Twitter lengkap
- `.env.example` (`COBALT_API_URL`, `COBALT_API_KEY`)
- Drawer platform 54 entri (klik mengisi kolom tautan), halaman `/docs` dengan konten jujur

### Changed
- **Mode perawatan dihapus**: `MAINTENANCE_MODE` yang mematikan fitur inti sejak Jul 2026 dibuang — alat kini bisa dipakai; bila upstream gagal, error-nya yang bicara
- **Static export**: `next.config.ts` `output: 'standalone'` → `output: 'export'` + `trailingSlash: true` untuk Cloudflare Pages direct upload
- **Route handler Next.js dihapus** (`app/api/*`): logika pindah ke worker (port `lib/downr.ts` ke `fetch`, tanpa axios)
- **Landing dibangun ulang total**: sticky navbar, hero 2 kolom (form + manifest contoh), strip konveyor 54 platform, baris manifest fitur, 3 langkah dermaga, footer label pengiriman — palet Air Dermaga + Pelampung, Space Grotesk + IBM Plex Mono (lihat `docs/DESIGN.md`)
- **Halaman `/docs` ditulis ulang**: paywall palsu + klaim "60+ platform" / "token rotation" dihapus, diganti konten jujur
- Metadata OG/Twitter menunjuk `https://dez-download.pages.dev` (dulu tanpa URL absolut)
- `package.json`: nama `ai-studio-applet` → `dez-download`, versi 0.2.0, skrip `build`/`typecheck`/`test`/`e2e`/`serve` ditambah (dependensi tidak diubah — lockfile tetap konsisten untuk `npm ci`)

### Removed
- `lib/downr.ts` (diganti worker), `app/api/download/route.ts`, `app/api/proxy/route.ts`
- `metadata.json` (AI Studio, tidak relevan)
- `.eslintrc.json` (legacy, sudah ada `eslint.config.mjs`)

### Fixed
- Tautan GitHub salah (`nblauliadka/DezDownload`) → `dezzorigin/dez-download` di semua halaman
- Ikon emoji fungsional (🔇/🔊/⚠️) diganti SVG Lucide/teks
- Headline gradient + font Inter (pelanggaran P0) dihapus
- Klaim "60+ social networks" diperbaiki jadi 54 (jumlah sebenarnya di kode)

## [1.0.0] - 2024-11-05

### Added
- Initial Media Downloader setup (Next.js + Cobalt API)

> Entri 1.0.0 diwarisi dari template awal; detail di luar baris ini
> tidak terverifikasi terhadap riwayat kode.
