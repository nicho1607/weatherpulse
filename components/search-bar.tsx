"use client";

import { useEffect, useRef, useState } from "react";

import { useDebounce } from "@/lib/use-debounce";
import type { GeocodingResult } from "@/types/weather";

interface SearchBarProps {
  onSelect: (city: GeocodingResult) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 400);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Cancel any in-flight request so stale responses never win.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    fetch(`/api/geocoding?q=${encodeURIComponent(trimmed)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("geocoding failed");
        }
        const data = (await res.json()) as { results: GeocodingResult[] };
        setResults(data.results);
        setOpen(true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  function handleSelect(city: GeocodingResult) {
    onSelect(city);
    setQuery(city.name);
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor="city-search" className="sr-only">
        Buscar ciudad
      </label>
      <div className="relative">
        <input
          id="city-search"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="city-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Buscar una ciudad..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {loading && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500"
          />
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          id="city-search-results"
          role="listbox"
          className="absolute z-10 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {results.map((city) => (
            <li key={city.id} role="option" aria-selected="false">
              <button
                type="button"
                onClick={() => handleSelect(city)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-slate-800 transition hover:bg-sky-50 focus:bg-sky-50 focus:outline-none dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
              >
                <span className="font-medium">{city.name}</span>
                {city.country && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {city.country}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && debouncedQuery.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Ciudad no encontrada
        </div>
      )}
    </div>
  );
}
