"use client";

import { CheckCircle2, FileText, Upload } from "lucide-react";
import { useActionState } from "react";
import { uploadDocument, type UploadDocumentResult } from "@/app/documents/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
            <Input id="file" type="file" name="file" accept="application/pdf" required />
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
          {state && !state.ok && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state?.ok && (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>Document envoyé.</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
