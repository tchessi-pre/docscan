export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="h-40 w-full animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
    </main>
  );
}
