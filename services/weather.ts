import type {
  ForecastDay,
  GeocodingResult,
  OpenMeteoResponse,
  WeatherData,
} from "@/types/weather";

/**
 * Server-only weather service. All external Open-Meteo calls live here and are
 * invoked exclusively from the internal API routes, so the browser never talks
 * to the external API directly. Open-Meteo is keyless, but the proxy pattern is
 * kept intact for security and future provider swaps.
 */

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** WMO weather interpretation codes mapped to Spanish descriptions. */
export const WEATHER_CODES: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia helada ligera",
  67: "Lluvia helada intensa",
  71: "Nevada ligera",
  73: "Nevada moderada",
  75: "Nevada intensa",
  77: "Granizo de nieve",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos violentos",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve intensos",
  95: "Tormenta",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo intenso",
};

/** Returns the Spanish description for a WMO weather code. */
export function describe(code: number): string {
  return WEATHER_CODES[code] ?? "Desconocido";
}

/** Error raised when an external weather request fails. */
export class WeatherServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "WeatherServiceError";
    this.status = status;
  }
}

interface RawGeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
  }>;
}

/**
 * Searches cities by name via the Open-Meteo geocoding API.
 * Returns an empty array when there are no matches.
 */
export async function geocodeCity(query: string): Promise<GeocodingResult[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new WeatherServiceError("No se pudo contactar el servicio de geocodificación", 502);
  }

  if (!response.ok) {
    throw new WeatherServiceError(
      "El servicio de geocodificación respondió con un error",
      response.status,
    );
  }

  const data = (await response.json()) as RawGeocodingResponse;

  if (!data.results) {
    return [];
  }

  return data.results.map((result) => ({
    id: result.id,
    name: result.name,
    country: result.country ?? "",
    latitude: result.latitude,
    longitude: result.longitude,
  }));
}

/**
 * Fetches the current weather plus a 5-day forecast for the given coordinates
 * and normalizes the raw Open-Meteo payload into {@link WeatherData}.
 */
export async function getWeather(
  lat: number,
  lon: number,
  cityName: string,
): Promise<WeatherData> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max",
  );
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new WeatherServiceError("No se pudo contactar el servicio de clima", 502);
  }

  if (!response.ok) {
    throw new WeatherServiceError(
      "El servicio de clima respondió con un error",
      response.status,
    );
  }

  const raw = (await response.json()) as OpenMeteoResponse;

  const forecast: ForecastDay[] = raw.daily.time.map((date, index) => ({
    date,
    maxTemp: raw.daily.temperature_2m_max[index],
    minTemp: raw.daily.temperature_2m_min[index],
    weatherCode: raw.daily.weather_code[index],
    condition: describe(raw.daily.weather_code[index]),
  }));

  return {
    city: cityName,
    current: {
      temperature: raw.current.temperature_2m,
      humidity: raw.current.relative_humidity_2m,
      windSpeed: raw.current.wind_speed_10m,
      uvIndex: raw.daily.uv_index_max[0] ?? 0,
      weatherCode: raw.current.weather_code,
      condition: describe(raw.current.weather_code),
    },
    forecast,
  };
}
