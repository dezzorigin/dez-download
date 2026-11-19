// Unit tests for worker/_worker.js — pure helpers only, no network.
// Run: npm test   (node --test worker/_worker.test.mjs)
import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeUrl,
  isCobaltOk,
  getError,
  getExtension,
  getTitle,
  getQualityFromFilename,
  buildResult,
} from "./_worker.js";

test("sanitizeUrl strips playlist + tracking params, keeps the rest", () => {
  const out = sanitizeUrl(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&si=abc&x=1",
  );
  assert.equal(out, "https://www.youtube.com/watch?v=dQw4w9WgXcQ&x=1");
});

test("sanitizeUrl returns trimmed input when unparseable", () => {
  assert.equal(sanitizeUrl("  not a url  "), "not a url");
});

test("isCobaltOk accepts tunnel/redirect/picker, rejects error + HTTP errors", () => {
  assert.equal(isCobaltOk(200, { status: "tunnel" }), true);
  assert.equal(isCobaltOk(200, { status: "redirect" }), true);
  assert.equal(isCobaltOk(200, { status: "picker" }), true);
  assert.equal(isCobaltOk(200, { status: "error" }), false);
  assert.equal(isCobaltOk(401, { status: "tunnel" }), false);
  assert.equal(isCobaltOk(200, null), false);
});

test("getError explains auth requirement without leaking anything", () => {
  const msg = getError(
    { status: "error", error: { code: "error.api.auth.jwt.missing" } },
    401,
  );
  assert.match(msg, /otentikasi/);
  assert.match(msg, /COBALT_API_KEY/); // nama variabel env boleh disebut
  assert.doesNotMatch(msg, /[A-Za-z0-9_\-]{32,}/); // tapi tidak boleh ada nilai kunci
});

test("getError maps rate limit + invalid URL + fallback", () => {
  assert.match(getError({ status: "error", error: { code: "error.api.rate_limit" } }, 429), /Terlalu banyak/);
  assert.match(getError({ status: "error", error: { code: "error.api.content.empty" } }, 400), /tidak ditemukan/);
  assert.equal(getError(null, 403), "URL tidak valid atau ditolak server. Pastikan link video bersih dari parameter tambahan (seperti playlist).");
  assert.match(getError(null, 500), /Gagal mengekstrak/);
});

test("filename helpers: extension, title, quality", () => {
  assert.equal(getExtension("video_1080p.mp4"), "mp4");
  assert.equal(getExtension("noext"), "");
  assert.equal(getTitle("my.video.1080p.mp4"), "my.video.1080p");
  assert.equal(getTitle(""), "Extracted Media");
  assert.equal(getQualityFromFilename("clip_4k.mp4"), "2160p (4K)");
  assert.equal(getQualityFromFilename("clip_720p.mp4"), "720p (HD)");
  assert.equal(getQualityFromFilename("clip.mp4"), "1080p (FHD)");
});

test("buildResult merges video tunnel + audio tunnel into medias", () => {
  const built = buildResult(
    { ok: true, data: { status: "tunnel", url: "https://cdn.example/v.mp4", filename: "clip_1080p.mp4" } },
    { ok: true, data: { status: "redirect", url: "https://cdn.example/a.mp3", filename: "clip.mp3" } },
  );
  assert.equal(built.ok, true);
  assert.equal(built.title, "clip_1080p");
  assert.equal(built.medias.length, 2);
  assert.equal(built.medias[0].type, "video");
  assert.equal(built.medias[0].quality, "1080p (FHD)");
  assert.equal(built.medias[1].type, "audio");
  assert.equal(built.medias[1].ext, "mp3");
});

test("buildResult expands picker items (photo/video/gif)", () => {
  const built = buildResult(
    {
      ok: true,
      data: {
        status: "picker",
        picker: [
          { type: "photo", url: "https://cdn.example/1.jpg", thumb: "https://cdn.example/1t.jpg" },
          { type: "video", url: "https://cdn.example/2.mp4" },
        ],
      },
    },
    { ok: false, data: null },
  );
  assert.equal(built.ok, true);
  assert.equal(built.thumbnail, "https://cdn.example/1t.jpg");
  assert.equal(built.medias[0].ext, "jpg");
  assert.equal(built.medias[1].hasAudio, true);
});

test("buildResult is not ok when both calls fail", () => {
  const built = buildResult({ ok: false, data: null }, { ok: false, data: null });
  assert.equal(built.ok, false);
  assert.equal(built.medias.length, 0);
});
