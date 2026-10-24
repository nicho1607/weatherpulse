"use client";

import { useState, useTransition } from "react";
import type { FavoriteCity } from "@prisma/client";

import { removeFavorite } from "@/actions/favorites";

interface FavoriteItemProps {
  favorite: FavoriteCity;
}

export function FavoriteItem({ favorite }: FavoriteItemProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removeFavorite(favorite.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo eliminar");
      }
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 border-t border-rule py-4">
      <div className="min-w-0">
        <p className="display truncate text-4xl text-ink">{favorite.cityName}</p>
        {(favorite.country || favorite.label) && (
          <p className="mt-1 text-sm text-muted">
            {[favorite.country, favorite.label].filter(Boolean).join(", ")}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleRemove}
        disabled={pending}
        className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-danger underline-offset-4 transition-colors hover:underline disabled:opacity-60"
      >
        {pending ? "Eliminando…" : "Eliminar"}
      </button>
    </li>
  );
}
