"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AnalyzeButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const response = await fetch(`/api/documents/${documentId}/extract`, {
        method: "POST",
      });
      const body = (await response.json()) as { ok: boolean; error?: string };
      if (body.ok) {
        toast.success("Analyse terminée.");
      } else {
        toast.error(body.error ?? "Échec de l'analyse.");
      }
      router.refresh();
    });
  }

  return (
    <Button type="button" onClick={handleClick} disabled={isPending}>
      <Sparkles />
      {isPending ? "Analyse…" : "Analyser"}
    </Button>
  );
}
