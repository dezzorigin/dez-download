import { expect, test } from "@playwright/test";

const SUCCESS_FIXTURE = {
  Status: true,
  Code: 200,
  Input: "https://www.tiktok.com/@contoh/video/123",
  Endpoint: "https://api.cobalt.tools/",
  Result: {
    title: "Contoh video",
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

test("landing: judul + hero dua kolom + manifest contoh", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("DezDownload — Tempel tautan, ambil medianya");
  await expect(page.getByRole("heading", { name: "Tempel tautan." })).toBeVisible();
  await expect(page.getByLabel("Tautan media yang akan diunduh")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ekstrak Media" })).toBeVisible();
  // kartu manifest contoh (berlabel jujur)
  await expect(page.getByText("MANIFEST — CONTOH")).toBeVisible();
  await expect(page.getByText("MP4 · 1080p (FHD)").first()).toBeVisible();
  // strip platform + fitur + cara kerja + footer
  await expect(page.getByText("PLATFORM YANG DIKENALI")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yang dikerjakan dermaga ini" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cara kerja" })).toBeVisible();
  await expect(page.getByText("Dibangun di atas").first()).toBeVisible();
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
  await page.getByLabel("Tautan media yang akan diunduh").fill("https://www.tiktok.com/@contoh/video/123");
  await page.getByRole("button", { name: "Ekstrak Media" }).click();
  const results = page.locator('section[aria-label="Hasil ekstraksi"]');
  await expect(results.getByRole("heading", { name: "Ekstraksi selesai" })).toBeVisible();
  await expect(results.getByText("Contoh video")).toBeVisible();
  await expect(results.getByText("BEST WITH AUDIO")).toBeVisible();
  await expect(results.getByRole("button", { name: /MP4 · 1080p \(FHD\)/ })).toBeVisible();
  await expect(results.getByText("VIDEO ONLY")).toBeVisible();
  await expect(results.getByRole("button", { name: /MP3 · 320kbps/ })).toBeVisible();
  await expect(results.getByText("PETI VIDEO")).toBeVisible();
  await expect(results.getByText("PETI AUDIO")).toBeVisible();
});

test("ekstraksi gagal (mock API): pesan error jujur tampil", async ({ page }) => {
  await page.route("**/api/download*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        Status: false,
        Code: 400,
        Error: "Konten tidak ditemukan atau link tidak valid. Pastikan URL yang dimasukkan benar.",
      }),
    });
  });
  await page.goto("/");
  await page.getByLabel("Tautan media yang akan diunduh").fill("https://www.tiktok.com/@contoh/video/123");
  await page.getByRole("button", { name: "Ekstrak Media" }).click();
  await expect(page.getByRole("alert")).toContainText("tidak ditemukan atau link tidak valid");
  await expect(page.getByRole("heading", { name: "Ekstraksi selesai" })).toHaveCount(0);
});

test("drawer platform: klik TikTok mengisi kolom tautan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Lihat semua 54" }).click();
  await expect(page.getByRole("dialog", { name: "Daftar platform" })).toBeVisible();
  await page.getByRole("button", { name: "TikTok" }).click();
  await expect(page.getByLabel("Tautan media yang akan diunduh")).toHaveValue(/tiktok\.com/);
});

test("API worker: tanpa url harus 400 (tanpa memanggil Cobalt)", async ({ page }) => {
  const dl = await page.request.get("/api/download");
  expect(dl.status()).toBe(400);
  expect(await dl.json()).toMatchObject({ Status: false });
  const px = await page.request.get("/api/proxy");
  expect(px.status()).toBe(400);
});

test("landing: mobile 390px tanpa scroll horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  await expect(page.getByRole("button", { name: "Ekstrak Media" })).toBeVisible();
});
