import { connection } from "next/server";
import Link from "next/link";

import { FavoriteItem } from "@/components/favorite-item";
import { getFavorites } from "@/actions/favorites";

// Allow a blocking dynamic route: the per-user favorites query depends on the
// request session, so the page is rendered at request time, never prerendered.
export const instant = false;

export default async function FavoritesPage() {
  // Opt into dynamic rendering so the per-user DB query never runs during
  // build/prerender (Cache Components equivalent of force-dynamic).
  await connection();
  const favorites = await getFavorites();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Favoritos
        </h1>
        <Link
          href="/"
          className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
        >
          ← Volver
        </Link>
      </header>

      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <p className="font-medium">Aún no tienes ciudades favoritas.</p>
          <p className="mt-1 text-sm">
            Inicia sesión y guarda ciudades desde la página principal.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {favorites.map((favorite) => (
            <FavoriteItem key={favorite.id} favorite={favorite} />
          ))}
        </ul>
      )}
    </main>
  );
}
