import { notFound } from "next/navigation";
import { z } from "zod";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { FieldsTable } from "@/components/FieldsTable";
import { DOC_TYPE_LABELS, STATUS_LABELS } from "@/lib/documents/labels";
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

  return (
    <main className="mx-auto flex h-screen max-w-6xl flex-col gap-4 p-8">
      <div>
        <h1 className="text-xl font-semibold">{document.filename}</h1>
        <p className="text-sm text-muted-foreground">
          {DOC_TYPE_LABELS[document.doc_type]} — {STATUS_LABELS[document.status]}
        </p>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2">
        <div className="min-h-[50vh] overflow-hidden rounded-lg border">
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
        <div className="flex flex-col gap-4 overflow-y-auto">
          {document.status === "processing" && (
            <p className="text-sm text-muted-foreground">Analyse en cours…</p>
          )}
          {(document.status === "uploaded" || document.status === "failed") && (
            <div className="flex flex-col gap-2">
              {document.status === "failed" && document.error && (
                <p className="text-sm text-destructive">{document.error}</p>
              )}
              <AnalyzeButton documentId={document.id} />
            </div>
          )}
          {parsedFields?.success && (
            <FieldsTable
              documentId={document.id}
              fields={parsedFields.data}
              readOnly={document.status === "validated"}
            />
          )}
        </div>
      </div>
    </main>
  );
}
