"use client";

import Link from "next/link";
import { useState } from "react";

import { SearchBar } from "@/components/search-bar";
import { WeatherCard } from "@/components/weather-card";
import { WeatherSkeleton } from "@/components/weather-skeleton";
import type { GeocodingResult, WeatherData } from "@/types/weather";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSelect(city: GeocodingResult) {
    setStatus("loading");
    setErrorMessage(null);
    setWeather(null);
    setCoords({ lat: city.latitude, lon: city.longitude });

    const params = new URLSearchParams({
      lat: String(city.latitude),
      lon: String(city.longitude),
      city: city.name,
    });

    try {
      const res = await fetch(`/api/weather?${params.toString()}`);

      if (res.status === 404) {
        setStatus("error");
        setErrorMessage("Ciudad no encontrada");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setErrorMessage("El servicio de clima no está disponible. Intenta más tarde.");
        return;
      }

      const data = (await res.json()) as WeatherData;
      setWeather(data);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("El servicio de clima no está disponible. Intenta más tarde.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-8 px-4 py-10 sm:py-16">
      <header className="w-full text-center">
        <h1 className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
          WeatherPulse
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Clima en tiempo real y pronóstico a 5 días.
        </p>
        <nav className="mt-4">
          <Link
            href="/favorites"
            className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
          >
            Ver favoritos →
          </Link>
        </nav>
      </header>

      <SearchBar onSelect={handleSelect} />

      <div className="flex w-full flex-col items-center">
        {status === "loading" && <WeatherSkeleton />}

        {status === "error" && errorMessage && (
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        {status === "success" && weather && coords && (
          <WeatherCard data={weather} coords={coords} />
        )}

        {status === "idle" && (
          <p className="text-center text-slate-500 dark:text-slate-400">
            Busca una ciudad para ver su clima.
          </p>
        )}
      </div>
    </main>
  );
}
