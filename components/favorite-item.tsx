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
    <li className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
            {favorite.cityName}
          </p>
          {favorite.label && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
              {favorite.label}
            </span>
          )}
        </div>
        {favorite.country && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{favorite.country}</p>
        )}
        {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
      </div>

      <button
        type="button"
        onClick={handleRemove}
        disabled={pending}
        className="shrink-0 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900/60 dark:hover:bg-rose-950/40"
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </button>
    </li>
  );
}
