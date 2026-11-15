"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
      <p className="text-sm text-muted-foreground">{error.message || "Erreur inattendue."}</p>
      <Button type="button" onClick={reset}>
        Réessayer
      </Button>
    </main>
  );
}
