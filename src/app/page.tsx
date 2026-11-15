import { DocumentList } from "@/components/DocumentList";
import { UploadForm } from "@/components/UploadForm";
import { createClient } from "@/lib/supabase/server";

// Cache Components exige une limite <Suspense> pour tout rendu dynamique ; on
// reste en rendu bloquant classique pour l'instant (cf. guide "Migrating an
// existing app" des docs Next.js), le streaming viendra si besoin plus tard.
export const instant = false;

export default async function Home() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">DocScan</h1>
      <UploadForm />
      <DocumentList documents={documents ?? []} />
    </main>
  );
}
