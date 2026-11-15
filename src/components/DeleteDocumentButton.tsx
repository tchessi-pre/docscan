"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDocument } from "@/app/documents/actions";
import { Button } from "@/components/ui/button";

export function DeleteDocumentButton({
  documentId,
  filename,
}: {
  documentId: string;
  filename: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm(`Supprimer définitivement "${filename}" ?`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteDocument(documentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Suppression…" : "Supprimer"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
