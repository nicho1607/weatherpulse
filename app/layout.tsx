import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";

import { AuthButton } from "@/components/auth-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeatherPulse",
  description:
    "Clima en tiempo real con búsqueda de ciudades, pronóstico a 5 días y favoritos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              WeatherPulse
            </Link>
            <Suspense
              fallback={
                <span className="text-sm text-slate-400 dark:text-slate-500">
                  Cargando…
                </span>
              }
            >
              <AuthButton />
            </Suspense>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
