import { AlertTriangle, ArrowLeft, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { FieldsTable } from "@/components/FieldsTable";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DOC_TYPE_ARTICLE_LABELS,
  DOC_TYPE_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_ICONS,
  STATUS_LABELS,
} from "@/lib/documents/labels";
import { extractedFieldSchema } from "@/lib/extraction/schemas";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 300;

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!document) {
    notFound();
  }

  const { data: signedUrlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS);

  const { data: extraction } = await supabase
    .from("extractions")
    .select("*")
    .eq("document_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const parsedFields = extraction
    ? z.array(extractedFieldSchema).safeParse(extraction.fields)
    : null;
  const StatusIcon = STATUS_ICONS[document.status];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:h-dvh lg:overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour à la liste
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{document.filename}</h1>
            <Badge variant="outline" className={STATUS_BADGE_CLASSES[document.status]}>
              <StatusIcon
                className={`size-3 ${document.status === "processing" ? "animate-spin" : ""}`}
              />
              {STATUS_LABELS[document.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{DOC_TYPE_LABELS[document.doc_type]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {document.status === "validated" && parsedFields?.success && (
            <>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <a
                    href={`/api/documents/${document.id}/export?format=json`}
                    download
                  />
                }
              >
                <FileJson />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <a
                    href={`/api/documents/${document.id}/export?format=csv`}
                    download
                  />
                }
              >
                <FileSpreadsheet />
                Export CSV
              </Button>
            </>
          )}
          <UserMenu />
          <ThemeToggle />
        </div>
      </header>
      <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 lg:min-h-0">
        <div className="min-h-[50vh] overflow-hidden rounded-lg border bg-muted/30 lg:min-h-0">
          {signedUrlData?.signedUrl ? (
            <iframe
              src={signedUrlData.signedUrl}
              title={document.filename}
              className="h-full w-full"
            />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">PDF indisponible.</p>
          )}
        </div>
        <div className="lg:min-h-0 lg:overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Extraction</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {document.status === "processing" && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Analyse en cours…
                </p>
              )}
              {(document.status === "uploaded" || document.status === "failed") && (
                <div className="flex flex-col gap-2">
                  {document.status === "failed" && document.error && (
                    <p className="text-sm text-destructive">{document.error}</p>
                  )}
                  <AnalyzeButton documentId={document.id} />
                </div>
              )}
              {extraction?.type_mismatch && (
                <Alert variant="destructive">
                  <AlertTriangle />
                  <AlertTitle>
                    Ce document ne ressemble pas à{" "}
                    {DOC_TYPE_ARTICLE_LABELS[document.doc_type] ?? DOC_TYPE_LABELS[document.doc_type]}
                  </AlertTitle>
                  {extraction.type_mismatch_reason && (
                    <AlertDescription>{extraction.type_mismatch_reason}</AlertDescription>
                  )}
                </Alert>
              )}
              {parsedFields?.success && !extraction?.type_mismatch && (
                <FieldsTable
                  documentId={document.id}
                  fields={parsedFields.data}
                  readOnly={document.status === "validated"}
                />
              )}
              {(document.status === "extracted" || document.status === "validated") &&
                !parsedFields?.success && (
                  <p className="text-sm text-muted-foreground">
                    Aucun champ extrait pour ce document.
                  </p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
