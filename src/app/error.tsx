"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
      <p className="text-sm text-muted-foreground">{error.message || "Erreur inattendue."}</p>
      <Button type="button" onClick={reset}>
        Réessayer
      </Button>
    </main>
  );
}
