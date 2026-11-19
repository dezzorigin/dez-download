import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const SITE_URL = "https://dez-download.pages.dev";
const TITLE = "DezDownload — Tempel tautan, ambil medianya";
const DESCRIPTION =
  "Downloader video, audio, dan gambar dari 54 platform — TikTok, Instagram, YouTube, X, Spotify, dan lainnya — lewat Cobalt API. Tanpa akun, tanpa iklan, tanpa menyimpan file Anda.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords:
    "media downloader, video downloader, TikTok downloader, Instagram downloader, YouTube downloader, Cobalt API, DezDownload",
  manifest: "/manifest.json",
  authors: [{ name: "Nabil Aulia Dika (dezzorigin)" }],
  creator: "dezzorigin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DezDownload",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "DezDownload — dermaga unduh media" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export const viewport: Viewport = {
  themeColor: "#0C1F22",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body
        className={`${display.variable} ${mono.variable} bg-[var(--air)] text-[var(--busa)] font-display min-h-screen antialiased overflow-x-hidden w-full`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
