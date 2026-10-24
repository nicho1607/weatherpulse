/**
 * Loading placeholder that mirrors the WeatherCard layout while the weather
 * request is in flight.
 */
export function WeatherSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando clima"
      className="grid w-full animate-pulse gap-x-16 gap-y-12 motion-reduce:animate-none lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]"
    >
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="h-6 w-36 rounded bg-rule" />
          <div className="h-8 w-44 rounded-md bg-rule" />
        </div>
        <div className="mt-4 h-[clamp(7rem,26vw,11rem)] w-[clamp(10rem,36vw,17rem)] rounded bg-rule" />
        <div className="mt-6 flex gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-4 w-24 rounded bg-rule" />
          ))}
        </div>
      </div>

      <div>
        <div className="h-5 w-36 rounded bg-rule" />
        <div className="mt-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 border-t border-rule py-4">
              <div className="h-4 w-16 rounded bg-rule" />
              <div className="h-1.5 flex-1 rounded-full bg-rule" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Cargando…</span>
    </div>
  );
}
