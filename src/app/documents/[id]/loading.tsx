export default function Loading() {
  return (
    <main className="mx-auto flex h-screen max-w-6xl flex-col gap-4 px-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-6 w-60 animate-pulse rounded bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
        <div className="min-h-[50vh] animate-pulse rounded-lg bg-muted" />
        <div className="flex flex-col gap-3">
          <div className="h-6 w-28 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </main>
  );
}
