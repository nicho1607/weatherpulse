/**
 * Strict types for the Open-Meteo responses and the normalized shapes the
 * app works with. External responses are typed so the proxy layer can
 * validate and transform them before they reach the client.
 */

/** Raw response from the Open-Meteo forecast endpoint. */
export interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    uv_index_max: number[];
  };
}

/** A single day in the normalized 5-day forecast. */
export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  condition: string;
}

/** Normalized weather payload returned by the internal /api/weather route. */
export interface WeatherData {
  city: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    uvIndex: number;
    weatherCode: number;
    condition: string;
  };
  forecast: ForecastDay[];
}

/** A city suggestion returned by the geocoding proxy. */
export interface GeocodingResult {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}
