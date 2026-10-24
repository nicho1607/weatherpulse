"use client";

import { useState, useTransition } from "react";

import { addFavorite } from "@/actions/favorites";
import type { WeatherData } from "@/types/weather";

interface WeatherCardProps {
  data: WeatherData;
  coords: { lat: number; lon: number };
  isFavorite?: boolean;
}

const dayFormatter = new Intl.DateTimeFormat("es", { weekday: "short" });

function formatDay(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  return dayFormatter.format(date);
}

export function WeatherCard({ data, coords, isFavorite = false }: WeatherCardProps) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(isFavorite);
  const [error, setError] = useState<string | null>(null);

  function handleFavorite() {
    setError(null);
    startTransition(async () => {
      try {
        await addFavorite({
          cityName: data.city,
          latitude: coords.lat,
          longitude: coords.lon,
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar");
      }
    });
  }

  return (
    <article className="w-full max-w-md rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 p-6 text-white shadow-xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{data.city}</h2>
          <p className="text-sky-100">{data.current.condition}</p>
        </div>
        <button
          type="button"
          onClick={handleFavorite}
          disabled={pending || saved}
          aria-pressed={saved}
          aria-label={saved ? "Ciudad en favoritos" : "Agregar a favoritos"}
          className="rounded-full bg-white/15 p-2 text-xl leading-none transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saved ? "★" : "☆"}
        </button>
      </header>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-6xl font-bold">{Math.round(data.current.temperature)}°</span>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-2xl bg-white/10 p-3">
          <dt className="text-sky-100">Humedad</dt>
          <dd className="mt-1 font-semibold">{data.current.humidity}%</dd>
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <dt className="text-sky-100">Viento</dt>
          <dd className="mt-1 font-semibold">{Math.round(data.current.windSpeed)} km/h</dd>
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <dt className="text-sky-100">UV</dt>
          <dd className="mt-1 font-semibold">{Math.round(data.current.uvIndex)}</dd>
        </div>
      </dl>

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-medium text-sky-100">Pronóstico a 5 días</h3>
        <ul className="grid grid-cols-5 gap-2 text-center text-xs">
          {data.forecast.map((day) => (
            <li key={day.date} className="rounded-2xl bg-white/10 p-2">
              <p className="font-medium capitalize">{formatDay(day.date)}</p>
              <p className="mt-1 font-semibold">{Math.round(day.maxTemp)}°</p>
              <p className="text-sky-200">{Math.round(day.minTemp)}°</p>
            </li>
          ))}
        </ul>
      </section>

      {error && <p className="mt-4 text-sm text-rose-100">{error}</p>}
      {saved && !error && (
        <p className="mt-4 text-sm text-sky-100">Guardada en favoritos</p>
      )}
    </article>
  );
}
