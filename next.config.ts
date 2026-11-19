import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export untuk Cloudflare Pages (direct upload `out/`).
  // Konsekuensi: tidak ada Route Handler dinamis — /api/download dan
  // /api/proxy pindah ke Pages Worker (worker/_worker.js), yang di-copy ke
  // out/_worker.js saat build dan di-deploy sebagai _worker.bundle.
  output: "export",
  // trailingSlash: true supaya tiap rute jadi folder index.html
  // (out/docs/index.html) — server statis & Cloudflare Pages menyajikan
  // /docs/ langsung tanpa rewrite.
  trailingSlash: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["motion"],
};

export default nextConfig;
