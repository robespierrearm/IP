import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { Analytics } from '@vercel/analytics/react';
import { LazyMotion, domAnimation } from 'framer-motion';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Prevent FOIT (Flash of Invisible Text)
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "TenderCRM - Система управления тендерами",
  description: "Профессиональная CRM-система для управления тендерами, поставщиками и бухгалтерией. ИП Чолахян - Строительная компания.",
  keywords: ["crm", "тендеры", "управление тендерами", "строительство", "поставщики", "бухгалтерия"],
  authors: [{ name: "ИП Чолахян" }],
  robots: {
    index: false, // Приватная CRM - не индексировать
    follow: false,
  },
  icons: {
    icon: [
      { url: "/icon-static.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-static.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TenderCRM",
  },
  themeColor: "#6366F1", // indigo-500 (primary-500) как в настройках
  openGraph: {
    type: "website",
    title: "TenderCRM - Система управления тендерами",
    description: "Профессиональная CRM для управления тендерами и поставщиками",
    siteName: "TenderCRM",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366F1",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://qqoqbhnffyxdejwuxqrp.supabase.co" />
        <link rel="dns-prefetch" href="https://qqoqbhnffyxdejwuxqrp.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LazyMotion features={domAnimation} strict>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </LazyMotion>
        <Analytics />
      </body>
    </html>
  );
}
