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
      <UploadForm />
      <DocumentList documents={documents ?? []} />
    </main>
  );
}
