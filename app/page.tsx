"use client";

import { useState, useEffect, useRef } from "react";
import {
  Download, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2, Globe, Github, X, Menu,
  Video, Instagram, Youtube, Twitter, MessageSquare, Music, Headphones, Tv, Ghost, Facebook,
  MessageCircle, Image, Linkedin, Play, Share2, Film, Disc, Smile, FileText, Gitlab, Clipboard,
  Server, Volume2, VolumeX, ArrowDownToLine, Package, ShieldCheck,
  Zap, Clock, Anchor,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { forceDownload } from "@/lib/utils";

const REPO_URL = "https://github.com/dezzorigin/dez-download";

const platforms = [
  { name: "TikTok", icon: Video },
  { name: "Instagram", icon: Instagram },
  { name: "YouTube", icon: Youtube },
  { name: "X (Twitter)", icon: Twitter },
  { name: "Reddit", icon: MessageSquare },
  { name: "Spotify", icon: Music },
  { name: "SoundCloud", icon: Headphones },
  { name: "Vimeo", icon: Tv },
  { name: "Snapchat", icon: Ghost },
  { name: "Facebook", icon: Facebook },
  { name: "Threads", icon: MessageCircle },
  { name: "Pinterest", icon: Image },
  { name: "LinkedIn", icon: Linkedin },
  { name: "Twitch", icon: Play },
  { name: "Tumblr", icon: Share2 },
  { name: "Imgur", icon: Image },
  { name: "Giphy", icon: Film },
  { name: "Bandcamp", icon: Disc },
  { name: "Mixcloud", icon: Disc },
  { name: "Dailymotion", icon: Video },
  { name: "Bilibili", icon: Video },
  { name: "Douyin", icon: Video },
  { name: "Kuaishou", icon: Video },
  { name: "Xiaohongshu", icon: Image },
  { name: "Weibo", icon: Globe },
  { name: "iFunny", icon: Smile },
  { name: "Bitchute", icon: Video },
  { name: "Rumble", icon: Play },
  { name: "Odysee", icon: Play },
  { name: "Flickr", icon: Image },
  { name: "TED", icon: Video },
  { name: "Redgifs", icon: Video },
  { name: "9GAG", icon: Smile },
  { name: "VK", icon: Globe },
  { name: "OK.ru", icon: Globe },
  { name: "Apple Podcasts", icon: Headphones },
  { name: "Tidal", icon: Music },
  { name: "Deezer", icon: Music },
  { name: "Napster", icon: Music },
  { name: "Amazon Music", icon: Music },
  { name: "Audiomack", icon: Music },
  { name: "Boomplay", icon: Music },
  { name: "Anghami", icon: Music },
  { name: "JioSaavn", icon: Music },
  { name: "Gaana", icon: Music },
  { name: "Wynk", icon: Music },
  { name: "Resso", icon: Music },
  { name: "Quora", icon: MessageSquare },
  { name: "Medium", icon: FileText },
  { name: "Substack", icon: FileText },
  { name: "GitHub", icon: Github },
  { name: "GitLab", icon: Gitlab },
  { name: "Dribbble", icon: Image },
  { name: "Behance", icon: Image },
];

function isUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function gatherLinks(obj: any): { label: string; url: string }[] {
  const links: { label: string; url: string }[] = [];

  if (typeof obj === "string" && isUrl(obj)) {
    links.push({ label: "Media Source", url: obj });
    return links;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      if (typeof item === "string" && isUrl(item)) {
        links.push({ label: `Media Link ${index + 1}`, url: item });
      } else if (typeof item === "object") {
        links.push(...gatherLinks(item));
      }
    });
  } else if (obj && typeof obj === "object") {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === "string" && isUrl(value)) {
        const cleanKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        links.push({ label: cleanKey, url: value });
      } else if (typeof value === "object") {
        const nested = gatherLinks(value);
        nested.forEach((n) => links.push({ label: `${key} - ${n.label}`, url: n.url }));
      }
    });
  }
  return links;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPlatformsDrawerOpen, setIsPlatformsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "info" | "error" | "warning">("success");

  useEffect(() => {
    if (result) {
      setToastType("success");
      setToastMessage("Media berhasil diekstrak.");
      setShowToast(true);
      const toastTimer = setTimeout(() => {
        setShowToast(false);
      }, 4000);

      const scrollTimer = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      return () => {
        clearTimeout(toastTimer);
        clearTimeout(scrollTimer);
      };
    }
  }, [result]);

  useEffect(() => {
    const handleDownloadTriggered = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastType("info");
      setToastMessage(
        customEvent.detail?.message ||
          "Media dibuka langsung. Kalau video terputar, tekan lama atau klik kanan lalu simpan.",
      );
      setShowToast(true);
    };

    window.addEventListener("media-download-triggered", handleDownloadTriggered);
    return () => {
      window.removeEventListener("media-download-triggered", handleDownloadTriggered);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("platforms") === "true") {
        setIsPlatformsDrawerOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (deferredPrompt) {
      const showTimer = setTimeout(() => {
        setShowInstallPopup(true);
      }, 1000);

      const hideTimer = setTimeout(() => {
        setShowInstallPopup(false);
      }, 9500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    setShowInstallPopup(false);
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

  const sanitizeUrl = (inputUrl: string): string => {
    try {
      const trimmed = inputUrl.trim();
      const parsed = new URL(trimmed);
      const params = new URLSearchParams(parsed.search);

      // Strip playlist + tracking params yang membuat Cobalt menolak URL.
      params.delete("list");
      params.delete("si");

      const keysToDelete: string[] = [];
      params.forEach((value, key) => {
        if (!key || value === "" || value === null || value === undefined) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => params.delete(key));

      const searchString = params.toString();
      parsed.search = searchString ? `?${searchString}` : "";
      return parsed.toString();
    } catch (e) {
      return inputUrl.trim();
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    const sanitizedUrl = sanitizeUrl(url);
    setUrl(sanitizedUrl);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/download?url=${encodeURIComponent(sanitizedUrl)}`, {
        method: "GET",
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setError("Gagal mengekstrak media. Periksa URL lalu coba lagi.");
        return;
      }

      if (!data || !data.Status) {
        const errorMsg = data?.Error || "";
        if (
          errorMsg === "user_retry_required" ||
          data?.Code === 403 ||
          errorMsg.includes("user_retry_required") ||
          errorMsg.includes("diterima server")
        ) {
          setError(
            "URL tidak valid atau ditolak server. Pastikan link video bersih dari parameter tambahan (seperti playlist).",
          );
        } else {
          setError(errorMsg || "Gagal mengekstrak media. Periksa URL lalu coba lagi.");
        }
      } else {
        setResult(data.Result);
      }
    } catch (err: any) {
      setError("Gagal mengekstrak media. Periksa URL lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformClick = (platformName: string) => {
    let placeholder = "";
    switch (platformName.toLowerCase()) {
      case "tiktok":
        placeholder = "https://www.tiktok.com/";
        break;
      case "instagram":
        placeholder = "https://www.instagram.com/";
        break;
      case "youtube":
        placeholder = "https://www.youtube.com/watch?v=";
        break;
      case "x (twitter)":
        placeholder = "https://x.com/";
        break;
      case "reddit":
        placeholder = "https://www.reddit.com/r/";
        break;
      case "spotify":
        placeholder = "https://open.spotify.com/track/";
        break;
      default:
        placeholder = `https://${platformName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/`;
    }
    setUrl(placeholder);
    setIsPlatformsDrawerOpen(false);
    inputRef.current?.focus();
  };

  // Group links into video and audio formats
  const mediasList = result?.medias && Array.isArray(result.medias) ? result.medias : [];
  const videos = mediasList.filter((item: any) => {
    const type = (item.type || "").toLowerCase();
    const ext = (item.ext || "").toLowerCase();
    return type === "video" || ext === "mp4" || ext === "webm";
  });
  const audios = mediasList.filter((item: any) => {
    const type = (item.type || "").toLowerCase();
    const ext = (item.ext || "").toLowerCase();
    return type === "audio" || ext === "m4a" || ext === "mp3" || ext === "opus";
  });
  const fallbackLinks = mediasList.length === 0 && result ? gatherLinks(result) : [];

  const getResolution = (item: any) => {
    const quality = (item.quality || item.label || "").toLowerCase();
    if (quality.includes("8k")) return 4320;
    if (quality.includes("4k")) return 2160;
    if (quality.includes("2k")) return 1440;
    const match = quality.match(/(\d+)p?/);
    if (match) return parseInt(match[1], 10);
    if (quality.includes("hd")) return 720;
    if (quality.includes("sd")) return 360;
    return 0;
  };

  const mp4Videos = videos.filter((item: any) => (item.ext || "").toLowerCase() !== "webm");
  const webmVideos = videos.filter((item: any) => (item.ext || "").toLowerCase() === "webm");

  const sortedMp4Videos = [...mp4Videos].sort((a, b) => getResolution(b) - getResolution(a));
  const sortedWebmVideos = [...webmVideos].sort((a, b) => getResolution(b) - getResolution(a));

  const bestMp4WithAudio = sortedMp4Videos.find(
    (item: any) => item.hasAudio !== false && item.audio !== false,
  );
  const bestWebmWithAudio = sortedWebmVideos.find(
    (item: any) => item.hasAudio !== false && item.audio !== false,
  );

  const getAudioQuality = (item: any) => {
    const quality = (item.quality || item.label || "").toLowerCase();
    const match = quality.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
    if (quality.includes("high")) return 320;
    if (quality.includes("medium")) return 192;
    if (quality.includes("low")) return 128;
    return 0;
  };

  const sortedAudios = [...audios].sort((a, b) => {
    return getAudioQuality(b) - getAudioQuality(a);
  });

  const getMediaLabel = (item: any) => {
    const type = (item.type || "video").toLowerCase();
    const ext = (item.ext || "").toUpperCase();
    const quality = item.quality || item.label || "";

    if (type === "audio") {
      return `${ext}${quality ? ` · ${quality}` : ""}`;
    }

    const isWatermark =
      quality.toLowerCase().includes("watermark") && !quality.toLowerCase().includes("no");

    let label = `${ext}`;
    if (quality) {
      label += ` · ${quality}`;
    }
    if (isWatermark) {
      label += ` · watermark`;
    }
    return label;
  };

  const downloadMedia = (item: any, idx: number, kind: "video" | "audio" | "link", linkUrl?: string) => {
    const title = result.title || "extracted_media";
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    if (kind === "link" && linkUrl) {
      const urlObj = new URL(linkUrl);
      const match = urlObj.pathname.match(/\.([a-zA-Z0-9]+)$/);
      const ext = match ? match[1] : "mp4";
      forceDownload(linkUrl, `${cleanTitle}_link_${idx + 1}.${ext}`);
      return;
    }
    const ext = item.ext || (kind === "audio" ? "mp3" : "mp4");
    const quality = item.quality || item.label || "";
    const filename =
      kind === "audio"
        ? `${cleanTitle}_audio_${quality ? `${quality}_` : ""}${idx + 1}.${ext}`
        : `${cleanTitle}_${quality ? `${quality}_` : ""}${idx + 1}.${ext}`;
    forceDownload(item.url, filename);
  };

  const renderFormatButton = (item: any, idx: number, kind: "video" | "audio", isBest: boolean) => {
    const hasAudio = item.hasAudio !== false && item.audio !== false;
    return (
      <button
        key={`${kind}-${idx}`}
        onClick={(e) => {
          e.preventDefault();
          downloadMedia(item, idx, kind);
        }}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[4px] border border-[var(--garis-kuat)] bg-[var(--busa)] px-4 py-2.5 font-mono text-xs font-semibold text-[#0c1f22] transition-all duration-150 hover:bg-white active:scale-[0.97] cursor-pointer"
      >
        <span className="flex min-w-0 items-center gap-2 truncate text-left">
          <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          <span className="truncate">{getMediaLabel(item)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {!hasAudio && (
            <span className="flex items-center gap-1 rounded-[4px] border border-[#7a2e12] bg-[#fbe9e2] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#7a2e12]">
              <VolumeX className="h-3 w-3" /> VIDEO ONLY
            </span>
          )}
          {isBest && (
            <span className="flex items-center gap-1 rounded-[4px] border border-[#7a5b00] bg-[#fdf3cf] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#7a5b00]">
              <Volume2 className="h-3 w-3" /> BEST WITH AUDIO
            </span>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[var(--air)] text-[var(--busa)] selection:bg-[var(--pelampung)] selection:text-white">
      {/* ── Sticky navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--garis)] bg-[var(--air)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <a href="#" className="flex shrink-0 items-center gap-2.5" aria-label="DezDownload — beranda">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--pelampung)]">
              <Anchor className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-base font-bold tracking-tight">DezDownload</span>
            <span className="hidden font-mono text-[10px] font-medium tracking-wider text-[var(--kabut)] sm:inline">
              v0.2.0
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            <a
              href="#cara-kerja"
              className="rounded-[4px] px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Cara kerja
            </a>
            <a
              href="#platform"
              className="rounded-[4px] px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Platform
            </a>
            <a
              href="#fitur"
              className="rounded-[4px] px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Fitur
            </a>
            <a
              href="/docs/"
              className="rounded-[4px] px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Dokumen
            </a>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="cursor-pointer rounded-[4px] px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Legal
            </button>
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
                  href="#cara-kerja"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-[4px] px-3 py-2.5 text-sm font-medium hover:bg-white/5"
                >
                  Cara kerja
                </a>
                <a
                  href="#platform"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-[4px] px-3 py-2.5 text-sm font-medium hover:bg-white/5"
                >
                  Platform
                </a>
                <a
                  href="#fitur"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-[4px] px-3 py-2.5 text-sm font-medium hover:bg-white/5"
                >
                  Fitur
                </a>
                <a
                  href="/docs/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-[4px] px-3 py-2.5 text-sm font-medium hover:bg-white/5"
                >
                  Dokumen
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
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="w-full flex-1">
        {/* ── Hero dua kolom: alat di kiri, manifest contoh di kanan ── */}
        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 pt-12 pb-10 md:px-6 md:pt-16 lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-3">
            <p className="mb-5 font-mono text-xs font-semibold tracking-[0.18em] text-[var(--rambu)]">
              DERMAGA UNDUH MEDIA · 54 PLATFORM
            </p>
            <h1 className="text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Tempel tautan.
              <br />
              Ambil medianya.
            </h1>
            <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-[var(--kabut)] md:text-lg">
              DezDownload mengekstrak video, audio, dan gambar dari tautan
              media sosial lewat Cobalt API — kualitas tertinggi dulu, audio
              terpisah bila ada. Tanpa akun, tanpa iklan, dan tanpa satu byte
              pun file Anda disimpan.
            </p>

            <form
              onSubmit={handleDownload}
              className="mt-8 flex h-14 w-full max-w-2xl items-center gap-2 rounded-full border border-[var(--garis-kuat)] bg-[var(--dermaga)] p-1.5 pl-5 transition-colors focus-within:border-[var(--rambu)] md:h-16"
            >
              <LinkIcon className="h-4 w-4 shrink-0 text-[var(--kabut)]" />
              <input
                ref={inputRef}
                type="url"
                placeholder="Tempel tautan video di sini…"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--busa)] outline-none placeholder:text-[var(--kabut)] md:text-base"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                required
                aria-label="Tautan media yang akan diunduh"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setUrl(text);
                  } catch (err) {
                    console.error("Failed to read clipboard:", err);
                  }
                }}
                className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)] active:scale-95"
                title="Tempel dari clipboard"
                aria-label="Tempel dari clipboard"
              >
                <Clipboard className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                type="submit"
                disabled={loading || !url}
                className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--pelampung)] px-5 text-xs font-bold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#3a3f3e] disabled:text-[var(--kabut)] active:scale-[0.97] md:h-12 md:px-7 md:text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Memproses
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Ekstrak Media
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 max-w-[60ch] text-xs leading-relaxed text-[var(--kabut)]">
              Dengan mengekstrak media, Anda menyetujui{" "}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="cursor-pointer font-medium text-[var(--busa)] underline underline-offset-2 hover:text-white"
              >
                Legal &amp; Terms
              </button>{" "}
              — unduh hanya media publik yang memang berhak Anda simpan.
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt className="font-mono text-[10px] tracking-wider text-[var(--kabut)]">PLATFORM DIKENALI</dt>
                <dd className="font-mono text-lg font-semibold">54</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-wider text-[var(--kabut)]">PANGGILAN COBALT</dt>
                <dd className="font-mono text-lg font-semibold">2 paralel</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-wider text-[var(--kabut)]">CACHE URL SAMA</dt>
                <dd className="font-mono text-lg font-semibold">10 menit</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-wider text-[var(--kabut)]">FILE DISIMPAN</dt>
                <dd className="font-mono text-lg font-semibold">0 byte</dd>
              </div>
            </dl>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-6 flex max-w-2xl items-start gap-2 rounded-[8px] border border-[#7a2e12] bg-[#2a1712] px-4 py-3 text-sm font-medium text-[#ffb59d]"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Kartu manifest contoh ── */}
          <div className="lg:col-span-2">
            <div className="dock-panel relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--garis)] px-5 py-3.5">
                <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--kabut)]">
                  MANIFEST — CONTOH
                </span>
                <span className="rounded-[4px] border border-[var(--rambu)] px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-[var(--rambu)]">
                  CONTOH
                </span>
              </div>
              <div className="px-5 pt-5 pb-4">
                <div className="flex aspect-[16/10] w-full items-center justify-center rounded-[8px] border border-[var(--garis)] bg-[var(--air)]">
                  <div className="flex flex-col items-center gap-2 text-[var(--kabut)]">
                    <Film className="h-8 w-8" strokeWidth={1.5} />
                    <span className="font-mono text-[11px]">thumbnail video</span>
                  </div>
                </div>
                <h3 className="mt-4 text-base leading-snug font-bold">
                  Contoh: video TikTok — 1080p (FHD)
                </h3>
                <p className="mt-1 font-mono text-xs text-[var(--kabut)]">
                  oleh @contoh · sumber: Cobalt · 00:42
                </p>
              </div>
              <div className="manifest-perforation space-y-2 px-5 py-4">
                <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--kabut)]">
                  PETI VIDEO — MP4
                </p>
                <div className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[4px] border border-[var(--garis-kuat)] bg-[var(--busa)] px-4 py-2.5 font-mono text-xs font-semibold text-[#0c1f22]">
                  <span>MP4 · 1080p (FHD)</span>
                  <span className="rounded-[4px] border border-[#7a5b00] bg-[#fdf3cf] px-2 py-0.5 text-[10px] font-bold text-[#7a5b00]">
                    BEST WITH AUDIO
                  </span>
                </div>
                <div className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[4px] border border-[var(--garis-kuat)] bg-transparent px-4 py-2.5 font-mono text-xs font-semibold text-[var(--busa)]">
                  <span>MP4 · 720p (HD)</span>
                  <span className="text-[10px] text-[var(--kabut)]">VIDEO ONLY</span>
                </div>
                <div className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[4px] border border-[var(--garis-kuat)] bg-transparent px-4 py-2.5 font-mono text-xs font-semibold text-[var(--busa)]">
                  <span>MP3 · 320kbps</span>
                  <span className="text-[10px] text-[var(--kabut)]">AUDIO</span>
                </div>
              </div>
              <div className="border-t border-[var(--garis)] px-5 py-3.5">
                <button
                  onClick={() => inputRef.current?.focus()}
                  className="cursor-pointer font-mono text-xs font-semibold text-[var(--rambu)] underline-offset-2 hover:underline"
                >
                  Ini hanya contoh — coba sendiri di kolom kiri →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Hasil ekstraksi (manifest nyata) ── */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.section
              ref={resultRef}
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="mx-auto w-full max-w-6xl px-4 pb-4 md:px-6"
              aria-label="Hasil ekstraksi"
            >
              <div className="dock-panel relative overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-[var(--garis)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <div>
                    <h2 className="text-xl font-bold md:text-2xl">Ekstraksi selesai</h2>
                    <p className="mt-0.5 text-xs text-[var(--kabut)]">
                      Pilih peti format di bawah — tautan langsung, tanpa antre.
                    </p>
                  </div>
                  <span className="flex w-fit items-center gap-2 rounded-full border border-[var(--garis-kuat)] bg-white/5 px-4 py-1.5 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--rambu)]" /> Siap diunduh
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-5 md:p-6">
                  <div className="md:col-span-2">
                    {result.thumbnail ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[8px] border border-[var(--garis)] bg-[var(--air)]">
                        <img
                          src={result.thumbnail}
                          alt={result.title || "Thumbnail media"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-[8px] border border-[var(--garis)] bg-[var(--air)]">
                        <Download className="h-12 w-12 text-[#22464a]" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col md:col-span-3">
                    <h3
                      className="text-base leading-snug font-bold md:text-lg"
                      title={result.title}
                    >
                      {result.title || "Extracted Media"}
                    </h3>
                    <div className="mt-2 mb-5 flex flex-wrap items-center gap-2">
                      {result.author && (
                        <span className="text-xs font-medium text-[var(--kabut)]">
                          oleh {result.author}
                        </span>
                      )}
                      {result.source && (
                        <span className="rounded-[4px] border border-[var(--garis)] bg-white/5 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--kabut)] uppercase">
                          {result.source}
                        </span>
                      )}
                      {result.duration && (
                        <span className="rounded-[4px] border border-[var(--garis)] bg-white/5 px-2 py-0.5 font-mono text-xs text-[var(--kabut)]">
                          {Math.floor(result.duration / 60)}:
                          {(result.duration % 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-5">
                      {(sortedMp4Videos.length > 0 || sortedWebmVideos.length > 0) && (
                        <div className="flex flex-col gap-3">
                          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--kabut)]">
                            PETI VIDEO
                          </span>
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                              <span className="font-mono text-[10px] font-bold tracking-wider text-[var(--kabut)]">
                                MP4
                              </span>
                              {sortedMp4Videos.length > 0 ? (
                                sortedMp4Videos.map((item: any, idx: number) =>
                                  renderFormatButton(
                                    item,
                                    idx,
                                    "video",
                                    bestMp4WithAudio ? item === bestMp4WithAudio : false,
                                  ),
                                )
                              ) : (
                                <p className="rounded-[4px] border border-dashed border-[var(--garis-kuat)] px-4 py-3 text-center text-xs text-[var(--kabut)]">
                                  Tidak ada format MP4
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="font-mono text-[10px] font-bold tracking-wider text-[var(--kabut)]">
                                WEBM
                              </span>
                              {sortedWebmVideos.length > 0 ? (
                                sortedWebmVideos.map((item: any, idx: number) =>
                                  renderFormatButton(
                                    item,
                                    idx,
                                    "video",
                                    bestWebmWithAudio ? item === bestWebmWithAudio : false,
                                  ),
                                )
                              ) : (
                                <p className="rounded-[4px] border border-dashed border-[var(--garis-kuat)] px-4 py-3 text-center text-xs text-[var(--kabut)]">
                                  Tidak ada format WEBM
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {sortedAudios.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--kabut)]">
                            PETI AUDIO
                          </span>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {sortedAudios.map((item: any, idx: number) =>
                              renderFormatButton(item, idx, "audio", false),
                            )}
                          </div>
                        </div>
                      )}

                      {fallbackLinks.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--kabut)]">
                            TAUTAN LAIN
                          </span>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {fallbackLinks.map((link: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.preventDefault();
                                  downloadMedia(null, idx, "link", link.url);
                                }}
                                className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-[var(--busa)] px-4 py-2.5 font-mono text-xs font-semibold text-[#0c1f22] transition-all hover:bg-white active:scale-[0.97]"
                              >
                                <Download className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{link.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <details className="group mx-5 mb-5 overflow-hidden rounded-[8px] border border-[var(--garis)] bg-black/20 md:mx-6 md:mb-6">
                  <summary className="cursor-pointer p-4 text-xs font-semibold text-[var(--kabut)] transition-colors select-none hover:bg-white/[0.03] hover:text-[var(--busa)]">
                    Lihat payload teknis
                  </summary>
                  <div className="border-t border-[var(--garis)] p-4">
                    <p className="mb-3 text-xs leading-relaxed text-[var(--kabut)]">
                      Skema payload, routing stream, dan arsitektur ekstraksi
                      didokumentasikan di{" "}
                      <a href="/docs/" className="font-semibold text-[var(--busa)] underline underline-offset-2">
                        Dokumen
                      </a>
                      .
                    </p>
                    <pre className="max-h-72 overflow-auto font-mono text-[11px] whitespace-pre-wrap text-[var(--kabut)]">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Strip konveyor platform ── */}
        <section id="platform" className="border-y border-[var(--garis)] bg-[var(--dermaga)]/40 py-6" aria-label="Platform yang dikenali">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pb-4 md:px-6">
            <h2 className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--kabut)]">
              PLATFORM YANG DIKENALI — KLIK UNTUK MENGISI TAUTAN
            </h2>
            <button
              onClick={() => setIsPlatformsDrawerOpen(true)}
              className="shrink-0 cursor-pointer font-mono text-xs font-semibold text-[var(--rambu)] underline-offset-2 hover:underline"
            >
              Lihat semua 54 →
            </button>
          </div>
          <div className="relative overflow-hidden" aria-hidden="true">
            <div className="animate-conveyor gap-2 pr-2">
              {[...platforms, ...platforms].map((plat, idx) => {
                const IconComponent = plat.icon;
                return (
                  <span
                    key={`${plat.name}-${idx}`}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--garis)] bg-[var(--dermaga)] px-3.5 py-2 font-mono text-xs font-medium text-[var(--kabut)]"
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    {plat.name}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="mx-auto w-full max-w-6xl px-4 pt-4 text-xs leading-relaxed text-[var(--kabut)] md:px-6">
            Daftar ini adalah platform yang dikenali mesin ekstraksi Cobalt —
            bukan janji bahwa setiap tautan dari tiap platform pasti berhasil.
            Kalau satu platform menolak, worker menjawab jujur kenapa.
          </p>
        </section>

        {/* ── Fitur sebagai baris manifest ── */}
        <section id="fitur" className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Yang dikerjakan dermaga ini</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-[var(--kabut)] md:text-base">
            Empat kemampuan, semuanya bisa dicek di kode dan di hasil
            ekstraksi — bukan klaim pemasaran.
          </p>

          <div className="mt-8 flex flex-col">
            <article className="flex flex-col gap-3 border-t border-[var(--garis)] py-6 sm:flex-row sm:items-start sm:gap-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[var(--garis-kuat)] bg-[var(--dermaga)]">
                <Zap className="h-5 w-5 text-[var(--rambu)]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold">Video kualitas tertinggi, dulu</h3>
                <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-[var(--kabut)]">
                  Worker meminta Cobalt dengan <code className="font-mono text-[13px] text-[var(--busa)]">videoQuality: max</code>{" "}
                  lalu mengurutkan hasil 8K → 144p. Peti dengan audio terbaik
                  dicap <span className="font-semibold text-[var(--busa)]">BEST WITH AUDIO</span> supaya
                  tidak perlu menebak.
                </p>
              </div>
              <span className="shrink-0 rounded-[4px] border border-[var(--garis)] bg-white/5 px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--kabut)]">
                MP4 · WEBM
              </span>
            </article>

            <article className="flex flex-col gap-3 border-t border-[var(--garis)] py-6 sm:flex-row sm:items-start sm:gap-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[var(--garis-kuat)] bg-[var(--dermaga)]">
                <Headphones className="h-5 w-5 text-[var(--rambu)]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold">Audio dipisah, paralel</h3>
                <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-[var(--kabut)]">
                  Bersamaan dengan video, worker meminta mode audio ke Cobalt.
                  Hasilnya peti audio sendiri (MP3/M4A, sampai 320kbps) —
                  cocok untuk lagu, podcast, dan ceramah tanpa gambar.
                </p>
              </div>
              <span className="shrink-0 rounded-[4px] border border-[var(--garis)] bg-white/5 px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--kabut)]">
                MP3 · M4A · 320KBPS
              </span>
            </article>

            <article className="flex flex-col gap-3 border-t border-[var(--garis)] py-6 sm:flex-row sm:items-start sm:gap-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[var(--garis-kuat)] bg-[var(--dermaga)]">
                <Clock className="h-5 w-5 text-[var(--rambu)]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold">Tautan yang sama tidak ditanya dua kali</h3>
                <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-[var(--kabut)]">
                  Hasil ekstraksi di-cache 10 menit dan permintaan bersamaan
                  untuk URL yang sama digabung jadi satu panggilan ke Cobalt —
                  supaya tautan viral tidak membanjiri instance.
                </p>
              </div>
              <span className="shrink-0 rounded-[4px] border border-[var(--garis)] bg-white/5 px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--kabut)]">
                CACHE 10 MENIT
              </span>
            </article>

            <article className="flex flex-col gap-3 border-t border-b border-[var(--garis)] py-6 sm:flex-row sm:items-start sm:gap-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[var(--garis-kuat)] bg-[var(--dermaga)]">
                <ShieldCheck className="h-5 w-5 text-[var(--rambu)]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold">Tidak menyimpan apa pun</h3>
                <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-[var(--kabut)]">
                  Worker hanya merelay: tautan masuk, tautan media keluar.
                  Tidak ada media, tidak ada riwayat unduhan, tidak ada akun
                  yang disimpan di server.
                </p>
              </div>
              <span className="shrink-0 rounded-[4px] border border-[var(--garis)] bg-white/5 px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--kabut)]">
                0 BYTE DISIMPAN
              </span>
            </article>
          </div>
        </section>

        {/* ── Cara kerja: tiga langkah dermaga ── */}
        <section id="cara-kerja" className="mx-auto w-full max-w-6xl px-4 pb-14 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Cara kerja</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="dock-panel-flat p-5">
              <p className="font-mono text-xs font-semibold text-[var(--rambu)]">LANGKAH 1</p>
              <h3 className="mt-3 flex items-center gap-2 text-base font-bold">
                <Clipboard className="h-4 w-4 text-[var(--kabut)]" /> Tempel tautan
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--kabut)]">
                Salin tautan video dari aplikasi apa pun, tempel di kolom
                intake. Parameter playlist dan pelacak dibersihkan otomatis
                sebelum dikirim.
              </p>
            </article>
            <article className="dock-panel-flat p-5">
              <p className="font-mono text-xs font-semibold text-[var(--rambu)]">LANGKAH 2</p>
              <h3 className="mt-3 flex items-center gap-2 text-base font-bold">
                <Server className="h-4 w-4 text-[var(--kabut)]" /> Worker bertanya ke Cobalt
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--kabut)]">
                Pages Worker menanyakan video dan audio secara paralel ke
                instance Cobalt, lalu menyusun jawabannya jadi satu manifest
                berlabel kualitas.
              </p>
            </article>
            <article className="dock-panel-flat p-5">
              <p className="font-mono text-xs font-semibold text-[var(--rambu)]">LANGKAH 3</p>
              <h3 className="mt-3 flex items-center gap-2 text-base font-bold">
                <Package className="h-4 w-4 text-[var(--kabut)]" /> Pilih peti, unduh
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--kabut)]">
                Klik label peti format yang diinginkan. File terbuka langsung
                dari sumbernya — simpan dengan klik kanan atau tekan lama bila
                video terputar.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* ── Footer label pengiriman ── */}
      <footer className="w-full border-t border-[var(--garis)] bg-[#0a1a1d] px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-xs text-[var(--kabut)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            DezDownload © {new Date().getFullYear()} · dezzorigin · Dibangun di
            atas{" "}
            <a
              href="https://cobalt.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--busa)] underline underline-offset-2"
            >
              Cobalt API
            </a>
          </p>
          <div className="flex items-center gap-5">
            <a
              href="/docs/"
              className="font-medium transition-colors hover:text-[var(--busa)]"
            >
              Dokumen
            </a>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="cursor-pointer font-medium transition-colors hover:text-[var(--busa)]"
            >
              Legal &amp; Terms
            </button>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium transition-colors hover:text-[var(--busa)]"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          </div>
        </div>
        <p className="mx-auto mt-4 w-full max-w-6xl text-[11px] leading-relaxed text-[var(--kabut)]/70">
          Hanya untuk media publik yang berhak Anda unduh. Hormati hak cipta
          pembuatnya — alat ini tidak menyimpan, tidak me-host, dan tidak
          mengubah media apa pun.
        </p>
      </footer>

      {/* ── Drawer Legal & Terms ── */}
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
                    Next.js dan Cobalt API. Dibuat oleh dezzorigin untuk
                    mengekstrak media publik dari berbagai platform dengan
                    latensi rendah.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">Ketentuan Layanan</h4>
                  <p>
                    DezDownload adalah utilitas edukasi untuk mengekstrak
                    media yang tersedia secara publik. Dengan memakai layanan
                    ini, Anda setuju mengakses konten hanya untuk penggunaan
                    pribadi dan non-komersial. Pengguna bertanggung jawab penuh
                    secara hukum atas media yang diakses dan diunduh.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">Privasi</h4>
                  <p>
                    DezDownload berfungsi sebagai perantara. Kami tidak
                    menyimpan, me-host, mengumpulkan, atau meng-cache file
                    media hasil ekstraksi maupun data pribadi pengguna di
                    server kami.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">DMCA &amp; Hak Cipta</h4>
                  <p>
                    Kami melarang keras pemakaian alat ini untuk pelanggaran
                    hak cipta. DezDownload tidak me-host atau menyimpan materi
                    berhak cipta di servernya. Pemilik hak cipta yang ingin
                    membatasi ekstraksi dari suatu platform silakan menghubungi
                    platform asal tersebut.
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

      {/* ── Drawer Platform ── */}
      <AnimatePresence>
        {isPlatformsDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlatformsDrawerOpen(false)}
              className="fixed inset-0 z-40 cursor-pointer bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex h-full w-full max-w-md flex-col border-r border-[var(--garis)] bg-[#0e2427] shadow-2xl"
              role="dialog"
              aria-label="Daftar platform"
            >
              <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-[var(--garis)] bg-[#0e2427] p-6 md:p-8">
                <div>
                  <h3 className="text-lg font-bold">Mesin Ekstraksi Universal</h3>
                  <p className="mt-1 font-mono text-[10px] font-semibold tracking-wider text-[var(--kabut)] uppercase">
                    Status: Operasional · 54 platform
                  </p>
                </div>
                <button
                  onClick={() => setIsPlatformsDrawerOpen(false)}
                  className="cursor-pointer rounded-[8px] p-2 text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
                  aria-label="Tutup daftar platform"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-8">
                <div className="shrink-0 rounded-[12px] border border-[var(--garis)] bg-white/[0.02] p-4">
                  <p className="text-xs leading-relaxed text-[var(--kabut)]">
                    Kalau ada URL-nya, kami bisa mengekstraknya. Klik sebuah
                    platform untuk mengisi kolom tautan dengan alamat awalnya.
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 pb-6">
                  {platforms.map((plat) => {
                    const IconComponent = plat.icon;
                    return (
                      <button
                        key={plat.name}
                        onClick={() => handlePlatformClick(plat.name)}
                        className="group flex cursor-pointer flex-col items-center justify-center rounded-[8px] border border-[var(--garis)] bg-white/[0.01] p-3 transition-all duration-150 hover:border-[var(--garis-kuat)] hover:bg-white/5 active:scale-95"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--garis)] bg-[var(--dermaga)] transition-colors group-hover:border-[var(--garis-kuat)]">
                          <IconComponent className="h-4 w-4 text-[var(--kabut)] transition-colors group-hover:text-[var(--busa)]" />
                        </span>
                        <span className="mt-2 w-full truncate text-center text-[10px] font-medium tracking-tight text-[var(--kabut)] transition-colors group-hover:text-[var(--busa)]">
                          {plat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="shrink-0 border-t border-[var(--garis)] bg-[#0e2427] p-6 md:p-8">
                <button
                  onClick={() => setIsPlatformsDrawerOpen(false)}
                  className="w-full cursor-pointer rounded-full bg-[var(--busa)] py-3 text-xs font-bold text-[#0c1f22] transition-colors hover:bg-white"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Popup Install App ── */}
      <AnimatePresence>
        {showInstallPopup && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-6 right-0 left-0 z-[100] flex justify-center px-4"
          >
            <div className="dock-panel flex w-full max-w-sm items-start gap-4 p-5 shadow-2xl">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--busa)]">
                <Download className="h-5 w-5 text-[#0c1f22]" />
              </span>
              <div className="flex-1">
                <h4 className="text-sm font-bold">Install DezDownload</h4>
                <p className="mt-1 text-xs text-[var(--kabut)]">
                  Tambahkan ke layar utama untuk akses instan.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleInstallClick}
                    className="cursor-pointer rounded-full bg-[var(--busa)] px-4 py-2 text-xs font-bold text-[#0c1f22] transition-colors hover:bg-white"
                  >
                    Install App
                  </button>
                  <button
                    onClick={() => setShowInstallPopup(false)}
                    className="cursor-pointer rounded-full border border-[var(--garis-kuat)] px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
                  >
                    Nanti
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ── Toast ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-[100] w-[92%] max-w-md -translate-x-1/2"
            role="status"
          >
            <div
              className={`flex items-start gap-2 rounded-[8px] border px-4 py-3 text-sm font-medium shadow-2xl ${
                toastType === "success"
                  ? "border-[var(--garis-kuat)] bg-[var(--dermaga)] text-[var(--busa)]"
                  : toastType === "error"
                    ? "border-[#7a2e12] bg-[#2a1712] text-[#ffb59d]"
                    : toastType === "warning"
                      ? "border-[#7a5b00] bg-[#2a230c] text-[#ffe9a8]"
                      : "border-[var(--garis-kuat)] bg-[var(--dermaga)] text-[var(--busa)]"
              }`}
            >
              {toastType === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rambu)]" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
