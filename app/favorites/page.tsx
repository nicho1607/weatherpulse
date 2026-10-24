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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <h1 className="display text-[clamp(2.75rem,9vw,5.5rem)] text-ink">Favoritos</h1>

      {favorites.length === 0 ? (
        <div className="mt-8 max-w-prose border-t border-rule pt-6">
          <p className="text-lg font-semibold text-ink">Aún no tienes ciudades favoritas.</p>
          <p className="mt-1 text-muted">
            Inicia sesión con GitHub, busca una ciudad y usa «Guardar en favoritos».
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-85"
          >
            Buscar una ciudad
          </Link>
        </div>
      ) : (
        <ul className="mt-8 max-w-3xl border-b border-rule">
          {favorites.map((favorite) => (
            <FavoriteItem key={favorite.id} favorite={favorite} />
          ))}
        </ul>
      )}
    </main>
  );
}
