import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";

import { AuthButton } from "@/components/auth-button";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "WeatherPulse",
  description:
    "Clima en tiempo real con búsqueda de ciudades, pronóstico a 5 días y favoritos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-rule">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="display text-2xl text-ink">
              WeatherPulse
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link
                href="/favorites"
                className="font-medium text-ink underline-offset-4 hover:underline"
              >
                Favoritos
              </Link>
              <Suspense fallback={<span className="text-muted">Cargando…</span>}>
                <AuthButton />
              </Suspense>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
