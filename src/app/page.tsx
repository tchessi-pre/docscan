import { DocumentList } from "@/components/DocumentList";
import { UploadForm } from "@/components/UploadForm";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">DocScan</h1>
      <p className="text-xs text-muted-foreground">
        Les documents analysés sont transmis à Anthropic (sous-traitant IA) pour l&apos;extraction.
        Ces données ne servent pas à entraîner leurs modèles par défaut.
      </p>
      <UploadForm />
      <DocumentList documents={documents ?? []} />
    </main>
  );
}
