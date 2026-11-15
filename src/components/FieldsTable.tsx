"use client";

import { CheckCircle2, Eye, EyeOff, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateField, validateDocument } from "@/app/documents/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CONFIDENCE_BADGE_CLASSES,
  CONFIDENCE_ICONS,
  CONFIDENCE_LABELS,
} from "@/lib/documents/labels";
import type { ExtractedField } from "@/lib/extraction/schemas";

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
  const ConfidenceIcon = CONFIDENCE_ICONS[field.confidence];

  function handleSave() {
    startTransition(async () => {
      const result = await updateField(documentId, field.key, value);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`« ${field.label} » enregistré.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5 border-b pb-3 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{field.label}</span>
        <Badge variant="outline" className={CONFIDENCE_BADGE_CLASSES[field.confidence]}>
          <ConfidenceIcon className="size-3" />
          {CONFIDENCE_LABELS[field.confidence]}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={readOnly || isPending}
        />
        {!readOnly && (
          <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
            <Save />
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        )}
      </div>
      {(field.page !== null || field.quote !== null) && (
        <button
          type="button"
          onClick={() => setShowCitation((current) => !current)}
          className="inline-flex w-fit items-center gap-1 self-start text-xs text-muted-foreground underline underline-offset-2"
        >
          {showCitation ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          {showCitation ? "Masquer la citation" : "Voir la citation"}
        </button>
      )}
      {showCitation && (
        <p className="text-xs text-muted-foreground">
          {field.page !== null ? `Page ${field.page} — ` : ""}
          {field.quote !== null ? `« ${field.quote} »` : "Aucune citation."}
        </p>
      )}
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

  function handleValidate() {
    startValidating(async () => {
      const result = await validateDocument(documentId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Document validé.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
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
          <CheckCircle2 />
          {isValidating ? "Validation…" : "Valider"}
        </Button>
      )}
      {readOnly && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
          Document validé.
        </p>
      )}
    </div>
  );
}
