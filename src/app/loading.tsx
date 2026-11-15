export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center gap-3">
        <div className="size-10 animate-pulse rounded-xl bg-muted" />
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-52 w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
    </main>
  );
}
