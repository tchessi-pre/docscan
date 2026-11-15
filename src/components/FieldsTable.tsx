"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateField, validateDocument } from "@/app/documents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExtractedField } from "@/lib/extraction/schemas";

const CONFIDENCE_LABELS: Record<ExtractedField["confidence"], string> = {
  high: "Fiable",
  medium: "À vérifier",
  low: "Incertain",
};

function FieldRow({
  documentId,
  field,
  readOnly,
}: {
  documentId: string;
  field: ExtractedField;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(field.value ?? "");
  const [showCitation, setShowCitation] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateField(documentId, field.key, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5 border-b pb-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{field.label}</span>
        <span className="text-xs text-muted-foreground">
          {CONFIDENCE_LABELS[field.confidence]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={readOnly || isPending}
        />
        {!readOnly && (
          <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        )}
      </div>
      {(field.page !== null || field.quote !== null) && (
        <button
          type="button"
          onClick={() => setShowCitation((current) => !current)}
          className="self-start text-xs text-muted-foreground underline underline-offset-2"
        >
          {showCitation ? "Masquer la citation" : "Voir la citation"}
        </button>
      )}
      {showCitation && (
        <p className="text-xs text-muted-foreground">
          {field.page !== null ? `Page ${field.page} — ` : ""}
          {field.quote !== null ? `« ${field.quote} »` : "Aucune citation."}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function FieldsTable({
  documentId,
  fields,
  readOnly,
}: {
  documentId: string;
  fields: ExtractedField[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [isValidating, startValidating] = useTransition();
  const [validateError, setValidateError] = useState<string | null>(null);

  function handleValidate() {
    setValidateError(null);
    startValidating(async () => {
      const result = await validateDocument(documentId);
      if (!result.ok) {
        setValidateError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {fields.map((field) => (
          <FieldRow
            key={field.key}
            documentId={documentId}
            field={field}
            readOnly={readOnly}
          />
        ))}
      </div>
      {!readOnly && (
        <Button type="button" onClick={handleValidate} disabled={isValidating}>
          {isValidating ? "Validation…" : "Valider"}
        </Button>
      )}
      {readOnly && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Document validé.</p>
          <div className="flex gap-3">
            <a
              href={`/api/documents/${documentId}/export?format=json`}
              download
              className="text-sm underline underline-offset-2"
            >
              Export JSON
            </a>
            <a
              href={`/api/documents/${documentId}/export?format=csv`}
              download
              className="text-sm underline underline-offset-2"
            >
              Export CSV
            </a>
          </div>
        </div>
      )}
      {validateError && <p className="text-sm text-destructive">{validateError}</p>}
    </div>
  );
}
