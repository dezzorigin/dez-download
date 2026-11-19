"use client";

import { useState, useEffect, useRef } from "react";
import {
  Download, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2, Globe, Github, X, Menu,
  Video, Instagram, Youtube, Twitter, MessageSquare, Music, Headphones, Tv, Ghost, Facebook,
  MessageCircle, Image, Linkedin, Play, Share2, Film, Disc, Smile, FileText, Gitlab, Clipboard,
  Volume2, VolumeX, ArrowDownToLine, Anchor,
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

  // Timer penghilang toast + scroll ke hasil — tanpa setState sinkron
  // di badan effect (react-hooks/set-state-in-effect); toast-nya sendiri
  // di-set di handleDownload (event handler).
  useEffect(() => {
    if (!result) return;
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
  }, [result]);

  useEffect(() => {
    const handleDownloadTriggered = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastType("info");
      setToastMessage(
        customEvent.detail?.message ||
          "Media opens directly. If a video starts playing, long-press or right-click to save it.",
      );
      setShowToast(true);
    };

    window.addEventListener("media-download-triggered", handleDownloadTriggered);
    return () => {
      window.removeEventListener("media-download-triggered", handleDownloadTriggered);
    };
  }, []);

  // Buka drawer platform bila URL membawa ?platforms=true. setState
  // di-defer ke macrotask supaya tidak sinkron di badan effect
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    const timer = setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("platforms") === "true") {
        setIsPlatformsDrawerOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }, 0);
    return () => clearTimeout(timer);
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
        setError("Failed to extract media. Check the URL and try again.");
        return;
      }

      if (!data || !data.Status) {
        const errorMsg = data?.Error || "";
        if (
          errorMsg === "user_retry_required" ||
          data?.Code === 403 ||
          errorMsg.includes("user_retry_required") ||
          errorMsg.includes("rejected by the server")
        ) {
          setError(
            "Invalid URL or rejected by the server. Make sure the video link is clean of extra parameters (like playlists).",
          );
        } else {
          setError(errorMsg || "Failed to extract media. Check the URL and try again.");
        }
      } else {
        setResult(data.Result);
        setToastType("success");
        setToastMessage("Media extracted successfully.");
        setShowToast(true);
      }
    } catch (err: any) {
      setError("Failed to extract media. Check the URL and try again.");
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
      {/* ── Header pil melayang (struktur asli repo) ─────────────── */}
      <header className="fixed top-6 left-1/2 z-40 w-[92%] max-w-xl -translate-x-1/2 md:max-w-3xl">
        <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--garis)] bg-[var(--dermaga)]/95 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur md:px-6 md:py-3">
          <a href="#" className="flex shrink-0 items-center gap-2.5" aria-label="DezDownload — home">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pelampung)]">
              <Anchor className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-sm font-bold tracking-tight md:text-base">DezDownload</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <button
              onClick={() => setIsPlatformsDrawerOpen(true)}
              className="cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Platforms
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Legal &amp; Terms
            </button>
            <button
              onClick={handleInstallClick}
              className="cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
            >
              Install App
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--garis-kuat)] text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
              aria-label="DezDownload GitHub repository"
            >
              <Github className="h-4.5 w-4.5" />
            </a>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--garis-kuat)] text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)] md:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="mt-2 overflow-hidden rounded-[12px] border border-[var(--garis)] bg-[var(--dermaga)] shadow-2xl md:hidden"
              aria-label="Mobile menu"
            >
              <div className="flex flex-col gap-1 p-3">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsPlatformsDrawerOpen(true);
                  }}
                  className="cursor-pointer rounded-[4px] px-3 py-2.5 text-left text-sm font-medium hover:bg-white/5"
                >
                  Platforms
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsDrawerOpen(true);
                  }}
                  className="cursor-pointer rounded-[4px] px-3 py-2.5 text-left text-sm font-medium hover:bg-white/5"
                >
                  Legal &amp; Terms
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleInstallClick();
                  }}
                  className="cursor-pointer rounded-[4px] px-3 py-2.5 text-left text-sm font-medium hover:bg-white/5"
                >
                  Install App
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="w-full flex-1">
        {/* ── Hero: alatnya sendiri, satu kolom terpusat ── */}
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pt-28 pb-10 text-center sm:px-6 md:pt-36">
          <div>
            <p className="mb-5 font-mono text-xs font-semibold tracking-[0.18em] text-[var(--rambu)]">
              54 PLATFORMS · POWERED BY COBALT
            </p>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              DezDownload
            </h1>
            <p className="mx-auto mt-5 max-w-[60ch] text-base leading-relaxed text-[var(--kabut)] md:text-lg">
              Extract high-quality video, audio, and images from any social
              platform instantly. No account, no ads, nothing stored.
            </p>

            <form
              onSubmit={handleDownload}
              className="mt-8 flex h-14 w-full max-w-2xl items-center gap-2 rounded-full border border-[var(--garis-kuat)] bg-[var(--dermaga)] p-1.5 pl-5 transition-colors focus-within:border-[var(--rambu)] md:h-16"
            >
              <LinkIcon className="h-4 w-4 shrink-0 text-[var(--kabut)]" />
              <input
                ref={inputRef}
                type="url"
                placeholder="Paste URL here..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--busa)] outline-none placeholder:text-[var(--kabut)] md:text-base"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                required
                aria-label="Media link"
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
                title="Paste from clipboard"
                aria-label="Paste from clipboard"
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Extract Media
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 max-w-[60ch] text-xs leading-relaxed text-[var(--kabut)]">
              By extracting media, you agree to our{" "}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="cursor-pointer font-medium text-[var(--busa)] underline underline-offset-2 hover:text-white"
              >
                Legal &amp; Terms
              </button>{" "}
              — download only public media you have the right to save.
            </p>

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

            {/* Space divider (asli repo) */}
            <div className="mt-10 w-full" />
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
              aria-label="Extraction results"
            >
              <div className="dock-panel relative overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-[var(--garis)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <div>
                    <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--kabut)]">
                      MANIFEST
                    </p>
                    <h2 className="mt-1 text-xl font-bold md:text-2xl">Extraction Complete</h2>
                    <p className="mt-0.5 text-xs text-[var(--kabut)]">
                      Pick a format crate below — direct links, no queue.
                    </p>
                  </div>
                  <span className="flex w-fit items-center gap-2 rounded-full border border-[var(--garis-kuat)] bg-white/5 px-4 py-1.5 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--rambu)]" /> Ready
                  </span>
                </div>

                <div className="manifest-perforation grid grid-cols-1 gap-6 p-5 md:grid-cols-5 md:p-6">
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
                          by {result.author}
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
                            VIDEO CRATE
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
                                  No MP4 formats
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
                                  No WEBM formats
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {sortedAudios.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--kabut)]">
                            AUDIO CRATE
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
                            OTHER LINKS
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
                    View technical payload
                  </summary>
                  <div className="border-t border-[var(--garis)] p-4">
                    <p className="mb-3 text-xs leading-relaxed text-[var(--kabut)]">
                      Payload schema, stream routing, and the extraction
                      architecture are documented in the{" "}
                      <a href="/docs/" className="font-semibold text-[var(--busa)] underline underline-offset-2">
                        Docs
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

      </main>

      {/* ── Footer (asli repo) ── */}
      <footer className="mt-auto w-full border-t border-[var(--garis)] bg-[#0a1a1d] px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 text-xs text-[var(--kabut)] sm:flex-row">
          <p>DezDownload © {new Date().getFullYear()} • Designed by DezReacher</p>
          <div className="flex items-center gap-5">
            <a href="/docs/" className="font-medium transition-colors hover:text-[var(--busa)]">
              Docs
            </a>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="cursor-pointer font-medium transition-colors hover:text-[var(--busa)]"
            >
              Legal &amp; Terms
            </button>
          </div>
        </div>
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
              aria-label="Legal and Terms"
            >
              <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-[var(--garis)] bg-[#0e2427] p-6 md:p-8">
                <h3 className="text-lg font-bold">Legal &amp; Terms</h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="cursor-pointer rounded-[8px] p-2 text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
                  aria-label="Close legal panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-6 text-xs leading-relaxed text-[var(--kabut)] md:p-8">
                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">About DezDownload</h4>
                  <p>
                    DezDownload is a web utility built on Next.js and the
                    Cobalt API. It was created by dezzorigin to extract public
                    media from many platforms, with low latency.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">Terms of Service</h4>
                  <p>
                    DezDownload is an educational utility for extracting
                    publicly available media. By using this service, you agree
                    to access content only for personal, non-commercial use.
                    Users assume full legal responsibility for the media they
                    access and download.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">Privacy</h4>
                  <p>
                    DezDownload acts only as a relay. We do not store, host,
                    collect, or cache extracted media files or users&apos;
                    personal data on our servers.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-[var(--busa)]">DMCA &amp; Copyright</h4>
                  <p>
                    We strictly prohibit using this tool for copyright
                    infringement. DezDownload does not host or store
                    copyrighted material on its servers. Copyright owners who
                    wish to restrict extraction from a particular source
                    platform should contact the originating platform directly.
                  </p>
                </div>
              </div>

              <div className="shrink-0 border-t border-[var(--garis)] bg-[#0e2427] p-6 md:p-8">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full cursor-pointer rounded-full bg-[var(--busa)] py-3 text-xs font-bold text-[#0c1f22] transition-colors hover:bg-white"
                >
                  Close Panel
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
              aria-label="Supported platforms"
            >
              <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-[var(--garis)] bg-[#0e2427] p-6 md:p-8">
                <div>
                  <h3 className="text-lg font-bold">Universal Extraction Engine</h3>
                  <p className="mt-1 font-mono text-[10px] font-semibold tracking-wider text-[var(--kabut)] uppercase">
                    Status: Operational · 54 platforms
                  </p>
                </div>
                <button
                  onClick={() => setIsPlatformsDrawerOpen(false)}
                  className="cursor-pointer rounded-[8px] p-2 text-[var(--kabut)] transition-colors hover:bg-white/5 hover:text-[var(--busa)]"
                  aria-label="Close platforms list"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-8">
                <div className="shrink-0 rounded-[12px] border border-[var(--garis)] bg-white/[0.02] p-4">
                  <p className="text-xs leading-relaxed text-[var(--kabut)]">
                    If it has a URL, we can probably extract it. Click a
                    platform to fill the link box with its starting address.
                    Being listed does not guarantee every link from that
                    platform will succeed — the worker answers honestly when
                    one refuses.
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
                  Close
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
                  Add it to your home screen for instant access.
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
                    Later
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
              aria-label="How to install"
            >
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--garis-kuat)] bg-white/5">
                <ArrowDownToLine className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold tracking-wide">How to Install</h3>
              <p className="mt-2 mb-6 text-xs leading-relaxed text-[var(--kabut)]">
                For the best experience, add DezDownload to your home screen:
                <br />
                <br />
                <span className="font-semibold text-[var(--busa)]">Safari (iOS):</span>{" "}
                Tap the{" "}
                <span className="font-bold text-[var(--busa)] underline">Share</span> button,
                scroll down, then choose{" "}
                <span className="font-semibold text-[var(--busa)]">“Add to Home Screen”</span>.
                <br />
                <br />
                <span className="font-semibold text-[var(--busa)]">Chrome / Firefox:</span>{" "}
                Click the install button in the address bar or menu.
              </p>
              <button
                onClick={() => setShowInstallInstructions(false)}
                className="w-full cursor-pointer rounded-full bg-[var(--busa)] py-3 text-xs font-bold text-[#0c1f22] transition-colors hover:bg-white"
              >
                Got it
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
