"use client";

import { FileText, Upload } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { uploadDocument, type UploadDocumentResult } from "@/app/documents/actions";
import { FileDropzone } from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOC_TYPE_LABELS } from "@/lib/documents/labels";

async function action(
  _previous: UploadDocumentResult | null,
  formData: FormData,
): Promise<UploadDocumentResult> {
  return uploadDocument(formData);
}

export function UploadForm() {
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Document envoyé.");
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4" />
          Nouveau document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file">Fichier PDF</Label>
            <FileDropzone key={state?.ok ? state.data.id : "idle"} id="file" name="file" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="docType">Type de document</Label>
            <Select name="docType" required items={DOC_TYPE_LABELS}>
              <SelectTrigger id="docType" className="w-full">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending}>
            <Upload />
            {isPending ? "Envoi…" : "Uploader"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
