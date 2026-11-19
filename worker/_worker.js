// Cloudflare Pages _worker.js — DezDownload.
//
// The Next.js app is a static export (`output: 'export'`), so it cannot ship
// API routes: `next build` refuses any dynamic route handler with static
// export. This worker is therefore the production server for the API routes
// the frontend calls, and serves everything else from the static export via
// the ASSETS binding.
//
// What the app actually does (honest version): it takes a media URL, asks a
// Cobalt v10 instance (POST /) for the best video (downloadMode "auto") and
// the best audio (downloadMode "audio") in parallel, and returns the direct
// media links grouped by format. It does NOT host, store, or transcode any
// media. Cobalt does the extraction; this worker only relays and shapes the
// response. If the Cobalt instance requires auth (public api.cobalt.tools
// does since 2025), extraction fails with an honest error message — set
// COBALT_API_URL to an instance you control, or COBALT_API_KEY, as a Pages
// environment variable (see docs/DEPLOYMENT.md).
//
// Copy rule: `npm run build` copies this file to out/_worker.js, and
// cf_pages.py deploys it as the _worker.bundle of the Pages project.

const DEFAULT_COBALT_BASE = "https://api.cobalt.tools";
const COBALT_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes per URL

// In-memory cache per isolate (same behaviour as the old lib/downr.ts).
const cache = new Map(); // url -> { data, expiresAt }
const pendingRequests = new Map(); // url -> Promise

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested in worker/_worker.test.mjs)
// ---------------------------------------------------------------------------

export function sanitizeUrl(inputUrl) {
  try {
    const trimmed = inputUrl.trim();
    const parsed = new URL(trimmed);
    const params = new URLSearchParams(parsed.search);
    // Strip playlist/tracking params that make Cobalt reject the URL.
    params.delete("list");
    params.delete("si");
    const keysToDelete = [];
    params.forEach((value, key) => {
      if (!key || value === "" || value === null || value === undefined) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => params.delete(key));
    const searchString = params.toString();
    parsed.search = searchString ? `?${searchString}` : "";
    return parsed.toString();
  } catch {
    return inputUrl.trim();
  }
}

export function isCobaltOk(status, data) {
  if (status < 200 || status >= 300) return false;
  if (!data || typeof data !== "object") return false;
  if (data.status === "error") return false;
  return (
    data.status === "tunnel" ||
    data.status === "redirect" ||
    data.status === "picker"
  );
}

export function getError(data, status) {
  let code = "";
  if (data && typeof data === "object") {
    if (data.status === "error" && data.error && typeof data.error === "object") {
      code = data.error.code || "";
    } else if (typeof data.error === "string") {
      code = data.error;
    }
  }

  if (code) {
    const cleanCode = code.toLowerCase();
    // All public Cobalt instances now require JWT or API key auth.
    if (
      cleanCode.includes("auth.jwt") ||
      cleanCode.includes("auth.apikey") ||
      cleanCode.includes("jwt.missing")
    ) {
      return (
        "This Cobalt instance requires authentication (JWT/API key). " +
        "Set COBALT_API_KEY or point COBALT_API_URL at an instance without auth."
      );
    }
    if (cleanCode.includes("auth")) {
      return "Access denied. The service requires authentication or a valid API key.";
    }
    if (cleanCode.includes("empty") || cleanCode.includes("invalid") || cleanCode.includes("url")) {
      return "Content not found or link invalid. Make sure the URL you entered is correct.";
    }
    if (cleanCode.includes("rate") || status === 429) {
      return "Too many requests (rate limit exceeded). Please wait a moment before trying again.";
    }
    if (cleanCode.includes("youtube")) {
      return "Failed to extract the YouTube video. The server detected restricted access.";
    }
    if (cleanCode.includes("content.too_long") || cleanCode.includes("link.short")) {
      return "Media link not supported or too long. Try a direct link to the video.";
    }
    if (cleanCode.includes("service")) {
      return "This platform is not supported yet or is having trouble. Try another platform.";
    }
    if (cleanCode.includes("fetch") || cleanCode.includes("fail") || cleanCode.includes("critical")) {
      return "The server failed to download media from that link. Please try again later.";
    }
  }

  if (status === 401) {
    return (
      "This Cobalt instance requires authentication. " +
      "Set COBALT_API_KEY or point COBALT_API_URL at an instance without auth."
    );
  }
  if (status === 403) {
    return "Invalid URL or rejected by the server. Make sure the video link is clean of extra parameters (like playlists).";
  }
  if (status === 429) {
    return "Too many requests. Please wait a moment, then try again.";
  }
  return "Failed to extract media. Please check your URL and try again.";
}

export function getExtension(filename) {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function getTitle(filename) {
  if (!filename) return "Extracted Media";
  const parts = filename.split(".");
  if (parts.length > 1) parts.pop();
  return parts.join(".");
}

export function getQualityFromFilename(filename) {
  const lower = (filename || "").toLowerCase();
  if (lower.includes("8k") || lower.includes("4320p")) return "4320p (8K)";
  if (lower.includes("4k") || lower.includes("2160p")) return "2160p (4K)";
  if (lower.includes("2k") || lower.includes("1440p")) return "1440p (2K)";
  if (lower.includes("1080p") || lower.includes("1080")) return "1080p (FHD)";
  if (lower.includes("720p") || lower.includes("720")) return "720p (HD)";
  if (lower.includes("480p") || lower.includes("480")) return "480p";
  if (lower.includes("360p") || lower.includes("360")) return "360p";
  if (lower.includes("240p") || lower.includes("240")) return "240p";
  if (lower.includes("144p") || lower.includes("144")) return "144p";
  return "1080p (FHD)";
}

/** Shape the two Cobalt responses (video + audio) into the frontend's Result. Pure. */
export function buildResult(video, audio) {
  const medias = [];
  let title = "Extracted Media";
  let thumbnail = null;

  if (video && video.ok) {
    const data = video.data;
    if (data.status === "picker" && Array.isArray(data.picker)) {
      data.picker.forEach((item, index) => {
        const ext = item.type === "photo" ? "jpg" : item.type === "gif" ? "gif" : "mp4";
        medias.push({
          url: item.url,
          type: item.type || "photo",
          ext,
          quality: "original",
          label: `${item.type || "photo"} #${index + 1}`,
          hasAudio: item.type === "video",
          audio: item.type === "video",
        });
        if (!thumbnail && item.thumb) thumbnail = item.thumb;
      });
    } else {
      const filename = data.filename || "";
      const ext = getExtension(filename) || "mp4";
      title = getTitle(filename);
      medias.push({
        url: data.url,
        type: "video",
        ext,
        quality: getQualityFromFilename(filename),
        label: getQualityFromFilename(filename),
        hasAudio: true,
        audio: true,
      });
    }
  }

  if (audio && audio.ok) {
    const data = audio.data;
    if (data.status === "tunnel" || data.status === "redirect") {
      const filename = data.filename || "";
      const ext = getExtension(filename) || "mp3";
      if (title === "Extracted Media" && filename) title = getTitle(filename);
      medias.push({
        url: data.url,
        type: "audio",
        ext,
        quality: "320kbps",
        label: "Best Audio",
        hasAudio: true,
        audio: true,
      });
    }
  }

  return { ok: medias.length > 0, title, thumbnail, medias };
}

// ---------------------------------------------------------------------------
// Cobalt call (impure — network)
// ---------------------------------------------------------------------------

function cobaltConfig(env) {
  const base = ((env && env.COBALT_API_URL) || DEFAULT_COBALT_BASE).replace(/\/+$/, "");
  return { base, endpoint: `${base}/`, apiKey: (env && env.COBALT_API_KEY) || "" };
}

function cobaltHeaders(apiKey) {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Api-Key ${apiKey}`;
  return headers;
}

async function callCobalt(endpoint, headers, body) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(COBALT_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data, ok: isCobaltOk(res.status, data) };
  } catch (err) {
    return { status: 0, data: null, ok: false, error: err };
  }
}

export async function downr(url, env) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { Status: false, Code: 400, Input: url || null, Endpoint: null, Result: null, Error: "Invalid URL." };
  }
  const sanitizedUrl = sanitizeUrl(url);
  const { endpoint, apiKey } = cobaltConfig(env);

  const cached = cache.get(sanitizedUrl);
  if (cached && Date.now() < cached.expiresAt) return cached.data;
  if (cached) cache.delete(sanitizedUrl);
  if (pendingRequests.has(sanitizedUrl)) return pendingRequests.get(sanitizedUrl);

  const requestPromise = (async () => {
    const headers = cobaltHeaders(apiKey);
    const [videoResult, audioResult] = await Promise.all([
      callCobalt(endpoint, headers, { url: sanitizedUrl, videoQuality: "max", downloadMode: "auto" }),
      callCobalt(endpoint, headers, { url: sanitizedUrl, downloadMode: "audio" }),
    ]);

    const built = buildResult(videoResult, audioResult);
    if (!built.ok) {
      let errorData = null;
      let errorCode = 500;
      if (videoResult.data) {
        errorData = videoResult.data;
        errorCode = videoResult.status || 500;
      } else if (audioResult.data) {
        errorData = audioResult.data;
        errorCode = audioResult.status || 500;
      } else if (videoResult.error) {
        errorCode = 502;
      }
      return {
        Status: false,
        Code: errorCode,
        Input: sanitizedUrl,
        Endpoint: endpoint,
        Result: null,
        Error: getError(errorData, errorCode),
      };
    }

    const finalOutput = {
      Status: true,
      Code: 200,
      Input: sanitizedUrl,
      Endpoint: endpoint,
      Result: {
        title: built.title,
        thumbnail: built.thumbnail,
        author: null,
        source: "Cobalt",
        duration: null,
        medias: built.medias,
      },
      Error: null,
    };
    cache.set(sanitizedUrl, { data: finalOutput, expiresAt: Date.now() + CACHE_TTL_MS });
    return finalOutput;
  })();

  pendingRequests.set(sanitizedUrl, requestPromise);
  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(sanitizedUrl);
  }
}

// ---------------------------------------------------------------------------
// HTTP routing
// ---------------------------------------------------------------------------

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

async function handleDownload(request, env) {
  let url = null;
  if (request.method === "GET") {
    url = new URL(request.url).searchParams.get("url");
  } else if (request.method === "POST") {
    try {
      const body = await request.json();
      url = body && body.url;
    } catch {
      return json({ Status: false, Error: "Body harus JSON." }, 400);
    }
  } else {
    return json({ Status: false, Error: "Method tidak didukung." }, 405);
  }
  if (!url) return json({ Status: false, Error: "URL is required" }, 400);

  const result = await downr(url, env);
  const headers = result.Status
    ? { "Cache-Control": "s-maxage=180, stale-while-revalidate=300" }
    : {};
  return json(result, 200, headers);
}

async function handleProxy(request) {
  const params = new URL(request.url).searchParams;
  const url = params.get("url");
  const filename = params.get("filename") || "download";
  if (!url) return json({ Status: false, Error: "URL is required" }, 400);
  if (!/^https?:\/\//i.test(url)) return json({ Status: false, Error: "Invalid URL." }, 400);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(COBALT_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Failed to fetch media: ${res.statusText}`);
    const headers = new Headers();
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    headers.set("Content-Disposition", `attachment; filename="${safeFilename}"`);
    const contentType = res.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const contentLen = res.headers.get("content-length");
    if (contentLen) headers.set("Content-Length", contentLen);
    return new Response(res.body, { status: 200, headers });
  } catch (err) {
    return json({ Status: false, Error: err.message || "Failed to download media file" }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/download") return handleDownload(request, env);
    if (url.pathname === "/api/proxy") return handleProxy(request);
    // Everything else: the static export (index.html, /docs/, assets).
    return env.ASSETS.fetch(request);
  },
};
