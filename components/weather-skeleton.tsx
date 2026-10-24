/**
 * Loading placeholder that mirrors the WeatherCard layout while the weather
 * request is in flight.
 */
export function WeatherSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando clima"
      className="w-full max-w-md animate-pulse rounded-3xl bg-slate-200 p-6 dark:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-4 w-24 rounded bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="h-9 w-9 rounded-full bg-slate-300 dark:bg-slate-700" />
      </div>

      <div className="mt-4 h-16 w-28 rounded bg-slate-300 dark:bg-slate-700" />

      <div className="mt-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-16 rounded-2xl bg-slate-300 dark:bg-slate-700" />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-20 rounded-2xl bg-slate-300 dark:bg-slate-700" />
        ))}
      </div>

      <span className="sr-only">Cargando...</span>
    </div>
  );
}
