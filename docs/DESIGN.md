# DESIGN.md — DezDownload (landing + tool)

Kontrak arah desain — ditulis SEBELUM coding, mengikuti
`~/workspace/github-actions/ui-anti-slop.md`. Berlaku untuk landing dan
halaman `/docs`. Desain lama (monokrom catur `#050505` + Inter + headline
gradient + hero tengah) diganti total: melanggar P0 (font Inter, teks
headline gradient) dan tidak menjelaskan produk apa pun dalam sekali
lihat.

## Referensi (tour 19 Nov 2026)

Kebutuhan: alat unduh media — satu aksi (tempel tautan), satu hasil
(daftar format yang bisa diunduh). Bukan dashboard, bukan SaaS generik:
halaman ini adalah **dermaga bongkar-muat**: tautan masuk seperti kargo,
keluar sebagai peti-peti format (MP4, WebM, MP3) yang tercatat di sebuah
manifest.

Keyword: `download manager queue UI`, `file converter tool UI`,
`media downloader landing`.

Kandidat:
1. **VERT — vert.sh** (https://ricardorosero.com/posts/vert-the-free-local-file-converter/)
   — konverter file open-source: alatnya di depan, tanpa basa-basi
   marketing; pengguna menjatuhkan file, memilih format, selesai.
   Struktur paling dekat: satu aksi utama di hero, pilihan format
   sebagai interaksi inti, copy jujur soal apa yang terjadi dengan
   file pengguna.
2. **Hurtle / IDM-style download manager** (https://www.arafays.com/blog/building-hurtle/)
   — antrean unduhan sebagai daftar: tiap item punya nama, format, dan
   kualitasnya sendiri; unduhan "ditangkap" lalu dicatat. Pelajaran:
   hasil ekstraksi harus tampil sebagai baris antrean/manifest, bukan
   kartu-kartu hias.
3. **File Download Manager** (https://filedownloadmanager.com/en/)
   — landing alat unduh: fitur dijelaskan per kemampuan nyata
   (YouTube + 1000 situs, 4K/MP3, torrent). Pelajaran: tiap klaim
   fitur harus bisa dicek di produk; tanpa angka vanity.

**Pemenang: #1 VERT, dipadu #2 (antrean/manifest).** Yang di-clone
strukturnya: hero = alatnya sendiri (judul + form tempel tautan, satu
kolom terpusat, seperti VERT); hasil = baris-baris manifest dengan label
peti per format. Yang TIDAK di-clone: seksi fitur/cara-kerja ala landing
— produk ini satu halaman alat, bukan landing tentang alat. Yang diubah
dan kenapa: VERT terang dan minimal; di sini dermaga gelap (bekerja
malam, layar alat), dengan aksen pelampung vermilion untuk satu-satunya
aksi utama dan kuning rambu untuk kualitas terbaik — supaya dalam sekali
lihat ketahuan ini alat unduh, bukan landing SaaS generik.

## Palet (6 warna bernama)

| Nama | Hex | Peran |
|---|---|---|
| Air Dermaga | `#0C1F22` | latar utama — air dermaga malam (teal-ink dalam, bukan slate biru) |
| Dermaga | `#122E31` | panel/kartu — permukaan dermaga |
| Busa | `#E9F1EC` | teks utama — buih (putih kehijauan) |
| Abu Kabut | `#93A8A4` | teks sekunder, metadata |
| Pelampung | `#E4572E` | aksen — CTA "Extract Media", stempel kualitas terbaik (vermilion) |
| Kuning Rambu | `#F2C230` | sorot — chip kualitas, peringatan ringan, label peti |

Tidak ada gradient (P0). Palet bukan satu hue (teal dalam + putih hijau
+ vermilion + kuning rambu). Bukan klise orde-kedua: bukan krim +
terracotta (latar gelap), bukan near-black + lime asam, bukan
espresso + oranye (cokelat tidak ada di palet), bukan dark blue/slate
(hue-nya teal-hijau, bukan biru). Border memakai Busa 8–10% opacity,
bukan warna ketujuh.

## Tipografi (2 keluarga)

- Display + body: **Space Grotesk** — judul, teks penjelasan, tombol
  (grotesque teknis, rasa alat).
- Data: **IBM Plex Mono** — URL, kualitas (`1080p`, `320kbps`), label
  peti, nomor langkah (angka tabular, rasa manifest).
- Body ≤ 75ch. Tidak ada Inter / Roboto / system font.

## Layout (satu kalimat)

Satu kolom terpusat — header pil melayang; hero alat (judul + form +
teks persetujuan singkat); manifest hasil di bawah (bila ada); drawer
platform/legal dari samping; footer satu baris asli repo.

## Detail khas (signature)

**Manifest kargo** — kartu hasil bermodel lembar manifest: tepi atas
ber-perforasi (garis putus-putus), stempel miring berbingkai ganda
`BEST WITH AUDIO`, tombol format berupa label peti mono
(`MP4 · 1080p`). Radius: kartu 12px, chip 4px, input pil penuh. Tidak
ada kartu 3-simetris, tidak ada emoji (ikon = SVG Lucide stroke
1.5–2px), tidak ada statistik vanity — angka yang tampil hanya yang
bisa dicek di repo: 54 platform, cache 10 menit, 2 panggilan paralel
(video + audio).

## Beda dari repo sebelumnya (#47 monitor-kuliah-dezz)

| Sumbu | #47 | #50 ini |
|---|---|---|
| Palet | kertas arsip terang `#F2F0E6` | air dermaga gelap `#0C1F22` + vermilion |
| Tipografi | Special Elite + Libre Franklin | Space Grotesk + IBM Plex Mono |
| Layout | satu kolom linimasa buku log | satu kolom alat terpusat + manifest hasil |
| Radius/spacing | radius 0 di semua permukaan | kartu 12px, chip 4px, input pil penuh |
| Detail khas | jilid ledger + stempel HADIR | manifest kargo + perforasi + stempel BEST WITH AUDIO |

Beda di 5 dari 5 sumbu.

## Catatan produk (jujur)

- Mode perawatan (`MAINTENANCE_MODE`) dihapus: alat harus bisa dipakai,
  bukan memajang banner "server down". Bila instance Cobalt butuh
  autentikasi, worker menjawab dengan pesan error yang jujur
  (lihat `docs/ARCHITECTURE.md`).
- Ikon platform memakai ikon generik Lucide (bukan logo merek) — daftar
  54 platform adalah daftar yang dikenali Cobalt, bukan janji dukungan
  per platform.
- Contoh manifest di hero dilabeli "contoh" — bukan hasil ekstraksi
  nyata.
