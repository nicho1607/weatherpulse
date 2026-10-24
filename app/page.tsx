"use client";

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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <h1 className="sr-only">WeatherPulse</h1>
      <SearchBar onSelect={handleSelect} />

      <div aria-live="polite" className="w-full">
        {status === "loading" && <WeatherSkeleton />}

        {status === "error" && errorMessage && (
          <p role="alert" className="border-l-2 border-danger pl-3 text-danger">
            {errorMessage}
          </p>
        )}

        {status === "success" && weather && coords && (
          <WeatherCard data={weather} coords={coords} />
        )}
      </div>
    </main>
  );
}
