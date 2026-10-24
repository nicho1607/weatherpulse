"use client";

import { useState, useTransition, type CSSProperties } from "react";

import { addFavorite } from "@/actions/favorites";
import { temperatureColors } from "@/lib/temperature";
import type { WeatherData } from "@/types/weather";

interface WeatherCardProps {
  data: WeatherData;
  coords: { lat: number; lon: number };
  isFavorite?: boolean;
}

const dayFormatter = new Intl.DateTimeFormat("es", { weekday: "short" });

function formatDay(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  return dayFormatter.format(date).replace(".", "");
}

function tempVars(celsius: number): CSSProperties {
  const { light, dark } = temperatureColors(celsius);
  return { "--t-light": light, "--t-dark": dark } as CSSProperties;
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
        const message = err instanceof Error ? err.message : "";
        setError(
          message === "No autenticado"
            ? "Inicia sesión con GitHub para guardar favoritos."
            : "No se pudo guardar. Inténtalo de nuevo.",
        );
      }
    });
  }

  // Shared scale across all days so the range bars are comparable.
  const lows = data.forecast.map((day) => day.minTemp);
  const highs = data.forecast.map((day) => day.maxTemp);
  const scaleMin = Math.floor(Math.min(...lows));
  const scaleMax = Math.ceil(Math.max(...highs));
  const span = Math.max(scaleMax - scaleMin, 1);

  return (
    <article className="grid w-full gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start">
      <div>
        <h2 className="sr-only">Clima en {data.city}</h2>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="text-xl font-semibold text-ink">{data.current.condition}</p>
          <button
            type="button"
            onClick={handleFavorite}
            disabled={pending || saved}
            aria-pressed={saved}
            className="inline-flex items-center gap-2 rounded-md border border-rule px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface disabled:cursor-default disabled:hover:bg-transparent"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            >
              <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
            </svg>
            {saved ? "Guardada en favoritos" : pending ? "Guardando…" : "Guardar en favoritos"}
          </button>
        </div>

        <p
          className="display temp-ink mt-2 text-[clamp(8rem,30vw,13rem)] leading-[0.85]"
          style={tempVars(data.current.temperature)}
        >
          {Math.round(data.current.temperature)}°
        </p>

        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-ink">
          <div className="flex items-baseline gap-2">
            <dt className="text-sm text-muted">Humedad</dt>
            <dd className="font-semibold tabular-nums">{data.current.humidity} %</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-sm text-muted">Viento</dt>
            <dd className="font-semibold tabular-nums">
              {Math.round(data.current.windSpeed)} km/h
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-sm text-muted">Índice UV</dt>
            <dd className="font-semibold tabular-nums">{Math.round(data.current.uvIndex)}</dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="mt-4 border-l-2 border-danger pl-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <section className="lg:pt-1">
        <h3 className="text-lg font-semibold text-ink">Próximos 5 días</h3>
        <ul className="mt-3">
          {data.forecast.map((day, index) => {
            const from = temperatureColors(day.minTemp);
            const to = temperatureColors(day.maxTemp);
            const left = ((day.minTemp - scaleMin) / span) * 100;
            const width = Math.max(((day.maxTemp - day.minTemp) / span) * 100, 2);

            return (
              <li
                key={day.date}
                className="grid grid-cols-[minmax(6rem,1fr)_2.5rem_minmax(0,2fr)_2.5rem] items-center gap-x-3 border-t border-rule py-3 sm:grid-cols-[4rem_minmax(0,1fr)_2.5rem_minmax(0,1.5fr)_2.5rem]"
              >
                <div className="sm:contents">
                  <p className="font-semibold capitalize text-ink">
                    {index === 0 ? "Hoy" : formatDay(day.date)}
                  </p>
                  <p className="truncate text-sm text-muted" title={day.condition}>
                    {day.condition}
                  </p>
                </div>
                <p className="text-right tabular-nums text-muted">
                  <span className="sr-only">Mínima </span>
                  {Math.round(day.minTemp)}°
                </p>
                <div aria-hidden="true" className="relative h-1.5 rounded-full bg-rule">
                  <div
                    className="range-fill absolute inset-y-0 rounded-full"
                    style={
                      {
                        left: `${left}%`,
                        width: `${width}%`,
                        "--from-light": from.light,
                        "--from-dark": from.dark,
                        "--to-light": to.light,
                        "--to-dark": to.dark,
                        "--i": index,
                      } as CSSProperties
                    }
                  />
                </div>
                <p className="font-semibold tabular-nums text-ink">
                  <span className="sr-only">Máxima </span>
                  {Math.round(day.maxTemp)}°
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}
