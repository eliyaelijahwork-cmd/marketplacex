export default function Loading() {
  return (
    <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" key={index}>
            <div className="aspect-[4/3] animate-pulse bg-slate-200" />
            <div className="grid gap-3 p-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-10 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
