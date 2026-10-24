"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FavoriteCity } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const favoriteSchema = z.object({
  cityName: z.string().min(1).max(100),
  country: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.string().max(50).optional(),
});

export type AddFavoriteInput = z.infer<typeof favoriteSchema>;

/** Returns the current user's id or throws when unauthenticated. */
async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("No autenticado");
  }
  return session.user.id;
}

/**
 * Returns the current user's favorites ordered by `sortOrder`.
 * Returns an empty array when there is no active session.
 */
export async function getFavorites(): Promise<FavoriteCity[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.favoriteCity.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Adds (or updates) a favorite city for the current user. Idempotent on the
 * `userId_latitude_longitude` unique constraint.
 */
export async function addFavorite(input: AddFavoriteInput): Promise<FavoriteCity> {
  const userId = await requireUserId();
  const data = favoriteSchema.parse(input);

  const existingCount = await prisma.favoriteCity.count({ where: { userId } });

  const favorite = await prisma.favoriteCity.upsert({
    where: {
      userId_latitude_longitude: {
        userId,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    },
    create: {
      userId,
      cityName: data.cityName,
      country: data.country ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      label: data.label ?? null,
      sortOrder: existingCount,
    },
    update: {
      cityName: data.cityName,
      country: data.country ?? null,
      label: data.label ?? null,
    },
  });

  revalidatePath("/favorites");
  return favorite;
}

/**
 * Removes a favorite owned by the current user. The `userId` filter prevents
 * deleting another user's favorite (IDOR protection).
 */
export async function removeFavorite(id: string): Promise<void> {
  const userId = await requireUserId();

  await prisma.favoriteCity.deleteMany({
    where: { id, userId },
  });

  revalidatePath("/favorites");
}

/**
 * Persists a new ordering for the current user's favorites. Each update is
 * scoped to the user so a caller can only reorder their own records.
 */
export async function reorderFavorites(orderedIds: string[]): Promise<void> {
  const userId = await requireUserId();

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.favoriteCity.updateMany({
        where: { id, userId },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidatePath("/favorites");
}
