import { NextResponse } from "next/server";

import { getCached, setCached } from "@/lib/cache";
import { geocodeCity, WeatherServiceError } from "@/services/weather";
import type { GeocodingResult } from "@/types/weather";

/** Rate limit: 30 requests per IP per 60 second sliding window. */
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

/** Cache geocoding results for one hour. */
const GEOCODING_TTL = 3_600_000;

const requestLog = new Map<string, number[]>();

/**
 * Records a request for `ip` and returns whether it is within the rate limit.
 */
function isWithinRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW;

  const timestamps = (requestLog.get(ip) ?? []).filter((ts) => ts > windowStart);

  if (timestamps.length >= RATE_LIMIT) {
    requestLog.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return true;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export async function GET(request: Request): Promise<Response> {
  const ip = getClientIp(request);

  if (!isWithinRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes, intenta más tarde" },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `geocoding:${query.toLowerCase()}`;
  const cached = getCached<GeocodingResult[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached }, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const results = await geocodeCity(query);
    setCached(cacheKey, results, GEOCODING_TTL);
    return NextResponse.json({ results }, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      return NextResponse.json(
        { error: "El servicio de geocodificación no está disponible" },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
