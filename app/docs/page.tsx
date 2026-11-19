"use client";

import { useState, useEffect } from "react";
import {
  Github, Lock, Server, FileCode, ArrowLeft, X, CheckCircle2,
  FileText, Menu, Anchor, ArrowDownToLine, BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const REPO_URL = "https://github.com/dezzorigin/dez-download";

export default function DocsPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt && typeof deferredPrompt.prompt === "function") {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Error triggering install prompt:", err);
        setShowInstallInstructions(true);
      }
    } else {
      setShowInstallInstructions(true);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[var(--air)] text-[var(--busa)]">
      {/* ── Sticky navbar (sama seperti beranda) ── */}
      <header className="sticky top-0 z-40 border-b border-[var(--garis)] bg-[var(--air)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="DezDownload — beranda">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--pelampung)]">
              <Anchor className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-base font-bold tracking-tight">DezDownload</span>
            <span className="hidden font-mono text-[10px] font-medium tracking-wider text-[var(--kabut)] sm:inline">
              DOCS
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            <a
              href="/"
              className="rounded-[4px] px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Beranda
            </a>
            <a
              href="/?platforms=true"
              className="rounded-[4px] px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Platform
            </a>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="cursor-pointer rounded-[4px] px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Legal
            </button>
            <a
              href="/docs/"
              className="rounded-[4px] bg-white/10 px-3 py-2 text-sm font-semibold"
              aria-current="page"
            >
              Dokumen
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="hidden min-h-11 cursor-pointer items-center rounded-full border border-[var(--garis-kuat)] px-4 text-xs font-bold transition-colors hover:bg-white/5 active:scale-[0.97] sm:flex"
            >
              Install App
            </button>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-[8px] border border-[var(--garis-kuat)] text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
              aria-label="Repositori GitHub DezDownload"
            >
              <Github className="h-4.5 w-4.5" />
            </a>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[8px] border border-[var(--garis-kuat)] text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)] md:hidden"
              aria-label="Buka menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden border-t border-[var(--garis)] md:hidden"
              aria-label="Menu seluler"
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                <a
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-[4px] px-3 py-2.5 text-sm font-medium hover:bg-white/5"
                >
                  Beranda
                </a>
                <a
                  href="/?platforms=true"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-[4px] px-3 py-2.5 text-sm font-medium hover:bg-white/5"
                >
                  Platform
                </a>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsDrawerOpen(true);
                  }}
                  className="cursor-pointer rounded-[4px] px-3 py-2.5 text-left text-sm font-medium hover:bg-white/5"
                >
                  Legal
                </button>
                <a
                  href="/docs/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-[4px] bg-white/10 px-3 py-2.5 text-sm font-semibold"
                >
                  Dokumen
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-12 md:px-6 md:py-16">
        <section className="flex flex-col items-start">
          <p className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.18em] text-[var(--rambu)]">
            <FileCode className="h-4 w-4" /> DEVELOPER DOCS
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Dokumentasi DezDownload
          </h1>
          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-[var(--kabut)]">
            Mesin ekstraksi media universal: tempel tautan, worker bertanya ke
            Cobalt API, hasilnya dikembalikan sebagai manifest format. Dokumen
            lengkap (PRD, arsitektur, testing, deploy) ada di folder{" "}
            <code className="font-mono text-sm text-[var(--busa)]">docs/</code>{" "}
            repositori.
          </p>
        </section>

        <section className="dock-panel p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="h-5 w-5 text-[var(--rambu)]" /> Pengantar
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--kabut)]">
            DezDownload adalah utilitas web oleh dezzorigin untuk mengekstrak
            media publik dari 54 platform. Tidak ada akun, tidak ada iklan,
            tidak ada media yang disimpan: worker hanya merelay permintaan ke
            instance Cobalt dan membentuk jawabannya jadi daftar format yang
            bisa diunduh. Kalau instance Cobalt menolak (misalnya butuh
            autentikasi), worker menjawab dengan pesan error yang jujur —
            bukan halaman kosong.
          </p>
        </section>

        <section className="dock-panel p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CheckCircle2 className="h-5 w-5 text-[var(--rambu)]" /> Fitur utama
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <li className="rounded-[8px] border border-[var(--garis)] bg-white/[0.02] p-4">
              <h3 className="text-sm font-bold">Ekstraksi video + audio</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--kabut)]">
                Dua panggilan paralel ke Cobalt: video kualitas tertinggi
                (mode auto) dan audio saja. Hasil diurutkan 8K → 144p untuk
                video, bitrate tertinggi dulu untuk audio.
              </p>
            </li>
            <li className="rounded-[8px] border border-[var(--garis)] bg-white/[0.02] p-4">
              <h3 className="text-sm font-bold">Proxy unduhan</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--kabut)]">
                <code className="font-mono text-[11px] text-[var(--busa)]">GET /api/proxy?url=…&amp;filename=…</code>{" "}
                mengambil media dan mengembalikannya sebagai attachment —
                berguna saat tautan sumber memblokir unduhan lintas origin.
              </p>
            </li>
            <li className="rounded-[8px] border border-[var(--garis)] bg-white/[0.02] p-4">
              <h3 className="text-sm font-bold">Cache + gabung permintaan</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--kabut)]">
                URL yang sama di-cache 10 menit; permintaan bersamaan untuk
                URL yang sama digabung jadi satu panggilan ke Cobalt.
              </p>
            </li>
            <li className="rounded-[8px] border border-[var(--garis)] bg-white/[0.02] p-4">
              <h3 className="text-sm font-bold">PWA</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--kabut)]">
                Service worker + manifest, bisa di-install ke layar utama.
                Pendaftaran service worker tidak mengubah perilaku fetch.
              </p>
            </li>
          </ul>
        </section>

        <section className="dock-panel p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Server className="h-5 w-5 text-[var(--rambu)]" /> Stack teknis
          </h2>
          <div className="mt-4 overflow-x-auto rounded-[8px] border border-[var(--garis)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--garis)] bg-white/[0.02]">
                  <th className="p-3 font-semibold">Lapisan</th>
                  <th className="p-3 font-semibold">Teknologi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--garis)] text-[var(--kabut)]">
                <tr>
                  <td className="p-3 font-medium text-[var(--busa)]">Framework</td>
                  <td className="p-3">Next.js 15 (App Router, static export) &amp; React 19</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--busa)]">Bahasa</td>
                  <td className="p-3 font-mono">TypeScript (strict)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--busa)]">Styling</td>
                  <td className="p-3">Tailwind CSS v4 + token desain dermaga (lihat docs/DESIGN.md)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--busa)]">Animasi &amp; ikon</td>
                  <td className="p-3">motion/react &amp; Lucide</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--busa)]">API produksi</td>
                  <td className="p-3">Cloudflare Pages Worker (worker/_worker.js) + Cobalt v10 API</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--busa)]">PWA</td>
                  <td className="p-3">Service worker, manifest</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="dock-panel space-y-4 p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <FileText className="h-5 w-5 text-[var(--rambu)]" /> Instalasi &amp; setup
          </h2>
          <p className="text-sm text-[var(--kabut)]">
            Menjalankan DezDownload lokal dalam hitungan detik:
          </p>
          <div className="space-y-2">
            <span className="block text-sm font-bold">1. Clone repositori</span>
            <pre className="overflow-x-auto rounded-[8px] border border-[var(--garis)] bg-black/30 p-4 font-mono text-xs text-[var(--kabut)]">
{`git clone https://github.com/dezzorigin/dez-download.git
cd dez-download`}
            </pre>
          </div>
          <div className="space-y-2">
            <span className="block text-sm font-bold">2. Install dependensi</span>
            <pre className="overflow-x-auto rounded-[8px] border border-[var(--garis)] bg-black/30 p-4 font-mono text-xs text-[var(--kabut)]">
{`npm ci`}
            </pre>
          </div>
          <div className="space-y-2">
            <span className="block text-sm font-bold">3. Konfigurasi environment (opsional)</span>
            <p className="text-xs text-[var(--kabut)]">
              Salin <code className="font-mono text-[11px] text-[var(--busa)]">.env.example</code> ke{" "}
              <code className="font-mono text-[11px] text-[var(--busa)]">.env.local</code> bila
              memakai instance Cobalt sendiri:
            </p>
            <pre className="overflow-x-auto rounded-[8px] border border-[var(--garis)] bg-black/30 p-4 font-mono text-xs text-[var(--kabut)]">
{`COBALT_API_URL=https://api.cobalt.tools
# COBALT_API_KEY=isi-bila-instance-butuh-auth`}
            </pre>
          </div>
          <div className="space-y-2">
            <span className="block text-sm font-bold">4. Jalankan (build statis + worker lokal)</span>
            <pre className="overflow-x-auto rounded-[8px] border border-[var(--garis)] bg-black/30 p-4 font-mono text-xs text-[var(--kabut)]">
{`npm run build
npm run serve   # http://127.0.0.1:8500 — sajikan out/ + worker`}
            </pre>
            <p className="text-xs text-[var(--kabut)]">
              <code className="font-mono text-[11px] text-[var(--busa)]">npm run dev</code>{" "}
              hanya menyajikan frontend — rute /api/* hidup lewat worker,
              jadi pakai <code className="font-mono text-[11px] text-[var(--busa)]">npm run serve</code>{" "}
              untuk menguji ekstraksi end-to-end secara lokal.
            </p>
          </div>
        </section>

        <section className="dock-panel p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Server className="h-5 w-5 text-[var(--rambu)]" /> Arsitektur
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--kabut)]">
            Browser → halaman statis (Next.js export di Cloudflare Pages) →
            Pages Worker (<code className="font-mono text-[13px] text-[var(--busa)]">worker/_worker.js</code>) →
            Cobalt API (dua panggilan paralel: video auto + audio) → manifest
            format kembali ke browser. Worker memegang cache 10 menit dan
            menggabungkan permintaan duplikat. Diagram lengkap ada di{" "}
            <code className="font-mono text-[13px] text-[var(--busa)]">docs/architecture.html</code>{" "}
            dan penjelasan per lapisan di{" "}
            <code className="font-mono text-[13px] text-[var(--busa)]">docs/ARCHITECTURE.md</code>.
          </p>
          <h3 className="mt-5 text-sm font-bold tracking-wide uppercase">Endpoint worker</h3>
          <ul className="mt-2 space-y-2 font-mono text-xs text-[var(--kabut)]">
            <li className="rounded-[4px] border border-[var(--garis)] bg-black/30 px-3 py-2">
              GET /api/download?url=… — ekstrak media (juga menerima POST JSON {"{"}"url": …{"}"})
            </li>
            <li className="rounded-[4px] border border-[var(--garis)] bg-black/30 px-3 py-2">
              GET /api/proxy?url=…&amp;filename=… — unduh media sebagai attachment
            </li>
          </ul>
        </section>

        <section className="dock-panel p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Lock className="h-5 w-5 text-[var(--rambu)]" /> Batasan yang jujur
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--kabut)]">
            <li>
              Instance publik Cobalt (<code className="font-mono text-[13px] text-[var(--busa)]">api.cobalt.tools</code>)
              kini meminta autentikasi — tanpa <code className="font-mono text-[13px] text-[var(--busa)]">COBALT_API_KEY</code>{" "}
              atau instance sendiri, ekstraksi akan gagal dengan pesan yang
              menjelaskan hal itu.
            </li>
            <li>
              Tidak semua tautan dari 54 platform pasti berhasil — platform
              bisa menolak, membatasi, atau mengubah formatnya sewaktu-waktu.
            </li>
            <li>
              Worker tidak menyimpan media, riwayat, atau akun apa pun.
            </li>
          </ul>
        </section>
      </main>

      {/* ── Drawer Legal ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 cursor-pointer bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--garis)] bg-[#0e2427] shadow-2xl"
              role="dialog"
              aria-label="Legal dan Terms"
            >
              <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-[var(--garis)] bg-[#0e2427] p-6 md:p-8">
                <h3 className="text-lg font-bold">Legal &amp; Terms</h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="cursor-pointer rounded-[8px] p-2 text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
                  aria-label="Tutup panel legal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto p-6 text-xs leading-relaxed text-[var(--kabut)] md:p-8">
                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">Tentang DezDownload</h4>
                  <p>
                    DezDownload adalah utilitas web yang dibangun di atas
                    Next.js dan Cobalt API oleh dezzorigin untuk mengekstrak
                    media publik dari berbagai platform.
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">Ketentuan Layanan</h4>
                  <p>
                    DezDownload adalah utilitas edukasi untuk mengekstrak media
                    yang tersedia secara publik, hanya untuk penggunaan pribadi
                    dan non-komersial. Pengguna bertanggung jawab penuh secara
                    hukum atas media yang diakses dan diunduh.
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">Privasi</h4>
                  <p>
                    Kami tidak menyimpan, me-host, mengumpulkan, atau
                    meng-cache file media hasil ekstraksi maupun data pribadi
                    pengguna di server kami.
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">DMCA &amp; Hak Cipta</h4>
                  <p>
                    Kami melarang pemakaian alat ini untuk pelanggaran hak
                    cipta. DezDownload tidak me-host materi berhak cipta.
                    Pemilik hak cipta yang ingin membatasi ekstraksi dari suatu
                    platform silakan menghubungi platform asal tersebut.
                  </p>
                </div>
              </div>
              <div className="shrink-0 border-t border-[var(--garis)] bg-[#0e2427] p-6 md:p-8">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full cursor-pointer rounded-full bg-[var(--busa)] py-3 text-xs font-bold text-[#0c1f22] transition-colors hover:bg-white"
                >
                  Tutup Panel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="w-full border-t border-[var(--garis)] bg-[#0a1a1d] px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-4 text-xs text-[var(--kabut)] sm:flex-row">
          <p>DezDownload © {new Date().getFullYear()} · dezzorigin</p>
          <a
            href="/"
            className="flex items-center gap-1 font-medium transition-colors hover:text-[var(--busa)]"
          >
            <ArrowLeft className="h-3 w-3" /> Kembali ke Beranda
          </a>
        </div>
      </footer>

      {/* ── Modal cara install ── */}
      <AnimatePresence>
        {showInstallInstructions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallInstructions(false)}
              className="fixed inset-0 z-50 cursor-pointer bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="dock-panel fixed top-1/2 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 p-6 text-center shadow-2xl"
              role="dialog"
              aria-label="Cara install"
            >
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--garis-kuat)] bg-white/5">
                <ArrowDownToLine className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold tracking-wide">Cara Install</h3>
              <p className="mt-2 mb-6 text-xs leading-relaxed text-[var(--kabut)]">
                Untuk pengalaman terbaik, tambahkan DezDownload ke layar utama:
                <br />
                <br />
                <span className="font-semibold text-[var(--busa)]">Safari (iOS):</span>{" "}
                Ketuk tombol{" "}
                <span className="font-bold text-[var(--busa)] underline">Share</span>, gulir ke
                bawah, lalu pilih{" "}
                <span className="font-semibold text-[var(--busa)]">“Add to Home Screen”</span>.
                <br />
                <br />
                <span className="font-semibold text-[var(--busa)]">Chrome / Firefox:</span>{" "}
                Klik tombol install di address bar atau menu.
              </p>
              <button
                onClick={() => setShowInstallInstructions(false)}
                className="w-full cursor-pointer rounded-full bg-[var(--busa)] py-3 text-xs font-bold text-[#0c1f22] transition-colors hover:bg-white"
              >
                Mengerti
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
