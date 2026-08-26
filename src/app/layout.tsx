import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteDescription =
  "ECOTRACK is Jasaan LGU's smart waste management platform for monitoring collection routes, tracking pickups, handling resident complaints, and building a cleaner, greener community.";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ECOTRACK — Smart Waste Management for Jasaan",
    template: "%s | ECOTRACK",
  },
  description: siteDescription,
  applicationName: "ECOTRACK",
  keywords: [
    "ECOTRACK",
    "Jasaan",
    "waste management",
    "garbage collection",
    "LGU",
    "Misamis Oriental",
    "collection monitoring",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "ECOTRACK — Smart Waste Management for Jasaan",
    description: siteDescription,
    siteName: "ECOTRACK",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "/og-share.png",
        width: 1376,
        height: 768,
        alt: "ECOTRACK — Smart waste management for Jasaan LGU",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ECOTRACK — Smart Waste Management for Jasaan",
    description: siteDescription,
    images: ["/og-share.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
