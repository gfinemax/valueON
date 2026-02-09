import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ValueOn - 수지 분석 시뮬레이터",
  description: "데이터 기반의 스마트한 수지 분석 플랫폼",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
};


import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { MobileStatusBar } from "@/components/mobile-status-bar";

import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/components/settings-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <div className="h-full relative overflow-x-hidden">
              <div className="hidden h-full md:flex md:w-20 hover:md:w-56 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 group transition-all duration-300 ease-in-out overflow-hidden">
                <Sidebar />
              </div>
              <main className="md:pl-20 transition-all duration-300 ease-in-out pb-20 md:pb-0">
                {children}
              </main>
              <MobileNav />
              <MobileStatusBar />
            </div>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
