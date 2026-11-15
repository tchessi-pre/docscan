"use client";

import { useActionState } from "react";
import { uploadDocument, type UploadDocumentResult } from "@/app/documents/actions";
import { DOC_TYPE_LABELS } from "@/lib/documents/labels";

async function action(
  _previous: UploadDocumentResult | null,
  formData: FormData,
): Promise<UploadDocumentResult> {
  return uploadDocument(formData);
}

export function UploadForm() {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span>Fichier PDF</span>
        <input type="file" name="file" accept="application/pdf" required />
      </label>
      <label className="flex flex-col gap-1">
        <span>Type de document</span>
        <select name="docType" required defaultValue="">
          <option value="" disabled>
            Choisir…
          </option>
          {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? "Envoi…" : "Uploader"}
      </button>
      {state && !state.ok && <p role="alert">{state.error}</p>}
      {state?.ok && <p>Document envoyé.</p>}
    </form>
  );
}
