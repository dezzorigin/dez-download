import { expect, test } from "@playwright/test";

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

test("tool page: title + hero + form + footer (produk asli repo)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("DezDownload | Free Universal Media Downloader");
  await expect(page.getByRole("heading", { name: "DezDownload" })).toBeVisible();
  await expect(page.getByText("54 PLATFORMS · POWERED BY COBALT")).toBeVisible();
  await expect(page.getByLabel("Media link")).toBeVisible();
  await expect(page.getByRole("button", { name: "Extract Media" })).toBeVisible();
  // header pil: Platforms, Legal & Terms, Install App, GitHub
  await expect(page.getByRole("button", { name: "Platforms" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Legal & Terms" }).first()).toBeVisible();
  await expect(page.getByText("Designed by DezReacher")).toBeVisible();
  // tag OG ada di HTML hasil build
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  await expect(page.locator('meta[name="twitter:card"][content="summary_large_image"]')).toHaveCount(1);
  // og-image bisa dimuat
  const og = await page.request.get("/og-image.png");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/");
});

test("ekstraksi (mock API): manifest hasil tampil dengan label peti", async ({ page }) => {
  await page.route("**/api/download*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SUCCESS_FIXTURE) });
  });
  await page.goto("/");
  await page.getByLabel("Media link").fill("https://www.tiktok.com/@contoh/video/123");
  await page.getByRole("button", { name: "Extract Media" }).click();
  const results = page.locator('section[aria-label="Extraction results"]');
  await expect(results.getByRole("heading", { name: "Extraction Complete" })).toBeVisible();
  await expect(results.getByText("MANIFEST")).toBeVisible();
  await expect(results.getByText("Example video")).toBeVisible();
  await expect(results.getByText("BEST WITH AUDIO")).toBeVisible();
  await expect(results.getByRole("button", { name: /MP4 · 1080p \(FHD\)/ })).toBeVisible();
  await expect(results.getByText("VIDEO ONLY")).toBeVisible();
  await expect(results.getByRole("button", { name: /MP3 · 320kbps/ })).toBeVisible();
  await expect(results.getByText("VIDEO CRATE")).toBeVisible();
  await expect(results.getByText("AUDIO CRATE")).toBeVisible();
});

test("ekstraksi gagal (mock API): pesan error jujur tampil", async ({ page }) => {
  await page.route("**/api/download*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        Status: false,
        Code: 400,
        Error: "Content not found or link invalid. Make sure the URL you entered is correct.",
      }),
    });
  });
  await page.goto("/");
  await page.getByLabel("Media link").fill("https://www.tiktok.com/@contoh/video/123");
  await page.getByRole("button", { name: "Extract Media" }).click();
  await expect(page.getByRole("alert")).toContainText("Content not found or link invalid");
  await expect(page.getByRole("heading", { name: "Extraction Complete" })).toHaveCount(0);
});

test("drawer platform: klik TikTok mengisi kolom tautan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Platforms" }).first().click();
  await expect(page.getByRole("dialog", { name: "Supported platforms" })).toBeVisible();
  await page.getByRole("button", { name: "TikTok" }).click();
  await expect(page.getByLabel("Media link")).toHaveValue(/tiktok\.com/);
});

test("API worker: tanpa url harus 400 (tanpa memanggil Cobalt)", async ({ page }) => {
  const dl = await page.request.get("/api/download");
  expect(dl.status()).toBe(400);
  expect(await dl.json()).toMatchObject({ Status: false });
  const px = await page.request.get("/api/proxy");
  expect(px.status()).toBe(400);
});

test("tool page: mobile 390px tanpa scroll horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  await expect(page.getByRole("button", { name: "Extract Media" })).toBeVisible();
});
