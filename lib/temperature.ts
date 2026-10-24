/**
 * Maps a temperature in °C to a color on a cold → hot scale. Two stop sets are
 * kept so the color holds readable contrast on both the light and dark
 * backgrounds; components expose both as CSS variables and the stylesheet
 * picks one per color scheme.
 */

type Stop = [celsius: number, rgb: [number, number, number]];

const LIGHT_STOPS: Stop[] = [
  [-5, [47, 95, 196]],
  [8, [31, 127, 160]],
  [17, [31, 138, 110]],
  [25, [185, 116, 26]],
  [33, [194, 59, 46]],
];

const DARK_STOPS: Stop[] = [
  [-5, [127, 166, 245]],
  [8, [102, 196, 222]],
  [17, [110, 211, 170]],
  [25, [240, 184, 92]],
  [33, [245, 128, 112]],
];

function interpolate(stops: Stop[], celsius: number): string {
  if (celsius <= stops[0][0]) return toRgb(stops[0][1]);
  const last = stops[stops.length - 1];
  if (celsius >= last[0]) return toRgb(last[1]);

  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (celsius <= t1) {
      const k = (celsius - t0) / (t1 - t0);
      return toRgb([
        c0[0] + (c1[0] - c0[0]) * k,
        c0[1] + (c1[1] - c0[1]) * k,
        c0[2] + (c1[2] - c0[2]) * k,
      ]);
    }
  }
  return toRgb(last[1]);
}

function toRgb([r, g, b]: [number, number, number]): string {
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
}

/** Light- and dark-scheme colors for a temperature. */
export function temperatureColors(celsius: number): { light: string; dark: string } {
  return {
    light: interpolate(LIGHT_STOPS, celsius),
    dark: interpolate(DARK_STOPS, celsius),
  };
}
