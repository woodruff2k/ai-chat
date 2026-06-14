export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-900 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-3 h-9 w-48 animate-pulse rounded-lg bg-slate-700" />
          <div className="mx-auto h-5 w-40 animate-pulse rounded bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-700 bg-slate-800 p-5">
              <div className="mb-4 h-14 w-14 rounded-full bg-slate-700" />
              <div className="mb-1.5 h-4 w-24 rounded bg-slate-700" />
              <div className="mb-1 h-3 w-full rounded bg-slate-700" />
              <div className="mb-4 h-3 w-4/5 rounded bg-slate-700" />
              <div className="flex gap-1.5">
                <div className="h-5 w-12 rounded-full bg-slate-700" />
                <div className="h-5 w-16 rounded-full bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
