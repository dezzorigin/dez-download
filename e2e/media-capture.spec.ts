import { expect, test } from "@playwright/test";

// Media capture untuk README: satu walkthrough desktop (paste URL -> manifest)
// dengan video recording Playwright + screenshot tiap adegan kunci.
// API dimock dengan fixture yang sama seperti landing.spec.ts — ini BUKAN
// ekstraksi live nyata (butuh COBALT_API_KEY); README menyatakan itu jujur.
// Screenshot masuk ke media-capture/ (diunggah sebagai artifact CI
// `readme-media`), video Playwright (.webm) dikonversi ke MP4 di CI.
// Video direkam 1280x720; pacing sengaja lambat (jeda tiap adegan + ketik
// URL huruf per huruf) supaya video demo enak ditonton (~15 detik).
test.use({ video: { mode: "on", size: { width: 1280, height: 720 } } });

const SUCCESS_FIXTURE = {
  Status: true,
  Code: 200,
  Input: "https://www.tiktok.com/@contoh/video/123",
  Endpoint: "https://api.cobalt.tools/",
  Result: {
    title: "Example video",
    thumbnail: null,
    author: "@contoh",
    source: "Cobalt",
    duration: 42,
    medias: [
      {
        url: "https://cdn.example/v1080.mp4",
        type: "video",
        ext: "mp4",
        quality: "1080p (FHD)",
        label: "1080p (FHD)",
        hasAudio: true,
        audio: true,
      },
      {
        url: "https://cdn.example/v720.mp4",
        type: "video",
        ext: "mp4",
        quality: "720p (HD)",
        label: "720p (HD)",
        hasAudio: false,
        audio: false,
      },
      {
        url: "https://cdn.example/a.mp3",
        type: "audio",
        ext: "mp3",
        quality: "320kbps",
        label: "Best Audio",
        hasAudio: true,
        audio: true,
      },
    ],
  },
  Error: null,
};

test("media capture: walkthrough paste URL → manifest (desktop)", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "media capture desktop only");
  await page.route("**/api/download*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SUCCESS_FIXTURE) });
  });

  // Adegan 1: landing / hero + form.
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Extract Media" })).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "media-capture/01-hero.png" });

  // Adegan 2: tempel URL contoh, ekstrak (mock), manifest tampil.
  await page.getByLabel("Media link").pressSequentially("https://www.tiktok.com/@contoh/video/123", { delay: 80 });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Extract Media" }).click();
  const results = page.locator('section[aria-label="Extraction results"]');
  await expect(results.getByRole("heading", { name: "Extraction Complete" })).toBeVisible();
  await expect(results.getByText("BEST WITH AUDIO")).toBeVisible();
  await results.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "media-capture/02-manifest.png" });

  // Adegan 3: drawer 54 platform.
  await page.locator('nav[aria-label="Main navigation"]').getByRole("button", { name: "Platforms" }).click();
  await expect(page.getByRole("dialog", { name: "Supported platforms" })).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "media-capture/03-platforms.png" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1500);
});
