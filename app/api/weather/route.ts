import { NextResponse } from "next/server";
import { z } from "zod";

import { getCached, setCached } from "@/lib/cache";
import { getWeather, WeatherServiceError } from "@/services/weather";
import type { WeatherData } from "@/types/weather";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  city: z.coerce.string().min(1).max(100),
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    city: searchParams.get("city"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { lat, lon, city } = parsed.data;
  const cacheKey = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`;

  const cached = getCached<WeatherData>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const data = await getWeather(lat, lon, city);
    setCached(cacheKey, data);
    return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      return NextResponse.json(
        { error: "El servicio de clima no está disponible" },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
