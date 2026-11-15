import { Info, ScanText } from "lucide-react";
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
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <ScanText className="size-6" />
        DocScan
      </h1>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Les documents analysés sont transmis à Anthropic (sous-traitant IA) pour
        l&apos;extraction. Ces données ne servent pas à entraîner leurs modèles par défaut.
      </p>
      <UploadForm />
      <DocumentList documents={documents ?? []} />
    </main>
  );
}
