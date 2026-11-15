"use client";

import Link from "next/link";
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
      <h1 className="text-xl font-semibold">Impossible d&apos;afficher ce document</h1>
      <p className="text-sm text-muted-foreground">{error.message || "Erreur inattendue."}</p>
      <div className="flex items-center gap-4">
        <Button type="button" onClick={reset}>
          Réessayer
        </Button>
        <Link href="/" className="text-sm underline underline-offset-2">
          Retour à la liste
        </Link>
      </div>
    </main>
  );
}
