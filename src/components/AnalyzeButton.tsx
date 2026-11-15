"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function AnalyzeButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/documents/${documentId}/extract`, {
        method: "POST",
      });
      const body = (await response.json()) as { ok: boolean; error?: string };
      if (!body.ok) {
        setError(body.error ?? "Échec de l'analyse.");
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={handleClick} disabled={isPending}>
        <Sparkles />
        {isPending ? "Analyse…" : "Analyser"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
