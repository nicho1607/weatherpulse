"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { useDebounce } from "@/lib/use-debounce";
import type { GeocodingResult } from "@/types/weather";

interface SearchBarProps {
  onSelect: (city: GeocodingResult) => void;
}

/** Results of the last finished lookup, tagged with the query they answer. */
interface Lookup {
  query: string;
  items: GeocodingResult[];
  failed: boolean;
}

const EMPTY_LOOKUP: Lookup = { query: "", items: [], failed: false };

/** Starting points shown while the search is empty. */
const SUGGESTED_CITIES: GeocodingResult[] = [
  { id: 3688689, name: "Bogotá", country: "Colombia", latitude: 4.60971, longitude: -74.08175 },
  { id: 3530597, name: "Ciudad de México", country: "México", latitude: 19.42847, longitude: -99.12766 },
  { id: 3117735, name: "Madrid", country: "España", latitude: 40.4165, longitude: -3.70256 },
  { id: 3435910, name: "Buenos Aires", country: "Argentina", latitude: -34.61315, longitude: -58.37723 },
];

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState<Lookup>(EMPTY_LOOKUP);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Name of the city just picked; the input shows it but it is not a new search.
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const debouncedQuery = useDebounce(trimmed, 250);

  useEffect(() => {
    if (debouncedQuery.length < 2 || debouncedQuery === selected) {
      return;
    }

    // Aborting on cleanup means a stale response never overwrites a newer one.
    const controller = new AbortController();

    fetch(`/api/geocoding?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("geocoding failed");
        }
        const data = (await res.json()) as { results: GeocodingResult[] };
        setLookup({ query: debouncedQuery, items: data.results, failed: false });
        setActive(-1);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLookup({ query: debouncedQuery, items: [], failed: true });
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, selected]);

  const searchable = trimmed.length >= 2 && trimmed !== selected;
  const loading = searchable && lookup.query !== trimmed;
  const items = searchable ? lookup.items : [];
  const showList = open && items.length > 0;
  const showEmpty = open && searchable && !loading && items.length === 0;

  function handleSelect(city: GeocodingResult) {
    onSelect(city);
    setSelected(city.name);
    setQuery(city.name);
    setOpen(false);
    setActive(-1);
    // Dismiss the on-screen keyboard on mobile so the result is visible.
    inputRef.current?.blur();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && items.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp" && items.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === "Enter" && items.length > 0) {
      event.preventDefault();
      handleSelect(items[active >= 0 ? active : 0]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const activeId = showList && active >= 0 ? `city-option-${items[active].id}` : undefined;

  return (
    <div className="w-full max-w-3xl">
      <label htmlFor="city-search" className="display block text-[clamp(2.75rem,9vw,5.5rem)]">
        El tiempo en
      </label>
      <div className="relative mt-1">
        <input
          ref={inputRef}
          id="city-search"
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls="city-search-results"
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-describedby="city-search-hint"
          autoComplete="off"
          spellCheck={false}
          placeholder="cualquier ciudad"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="display w-full border-b-2 border-ink bg-transparent pb-2 pr-12 text-[clamp(2.75rem,9vw,5.5rem)] text-accent outline-none placeholder:text-muted/50 focus-visible:outline-none focus-visible:border-accent"
        />
        {loading && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 animate-spin rounded-full border-2 border-rule border-t-accent motion-reduce:animate-none"
          />
        )}

        {showList && (
          <ul
            id="city-search-results"
            role="listbox"
            aria-label="Ciudades encontradas"
            className="absolute left-0 top-full z-20 mt-2 max-h-80 w-full max-w-lg overflow-auto rounded-md border border-rule bg-surface py-1 shadow-[0_12px_32px_-12px_rgb(27_42_56/0.35)]"
          >
            {items.map((city, index) => (
              <li
                key={city.id}
                id={`city-option-${city.id}`}
                role="option"
                aria-selected={index === active}
                // Keep focus in the input so onBlur does not close the list first.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => handleSelect(city)}
                className={`flex cursor-pointer items-baseline justify-between gap-4 px-4 py-2.5 text-ink ${
                  index === active ? "bg-accent/15" : ""
                }`}
              >
                <span className="font-medium">{city.name}</span>
                {city.country && <span className="text-sm text-muted">{city.country}</span>}
              </li>
            ))}
          </ul>
        )}

        {showEmpty && (
          <p
            role="status"
            className="absolute left-0 top-full z-20 mt-2 w-full max-w-lg rounded-md border border-rule bg-surface px-4 py-3 text-sm text-muted"
          >
            {lookup.failed
              ? "La búsqueda de ciudades no está disponible. Inténtalo de nuevo en unos segundos."
              : `Sin resultados para «${trimmed}». Revisa la ortografía o prueba con una ciudad cercana.`}
          </p>
        )}
      </div>
      {trimmed === "" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="mr-1 text-sm text-muted">Prueba con</p>
          {SUGGESTED_CITIES.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => handleSelect(city)}
              className="rounded-full border border-rule px-3 py-1 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              {city.name}
            </button>
          ))}
        </div>
      ) : (
        selected === null && (
          <p id="city-search-hint" className="mt-3 text-sm text-muted">
            Escribe al menos dos letras y elige la ciudad en la lista.
          </p>
        )
      )}
    </div>
  );
}
