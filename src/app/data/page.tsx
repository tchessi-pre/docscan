import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ExtractionsTable } from "@/components/ExtractionsTable";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { buildDocumentExtractions } from "@/lib/documents/extracted-rows";
import { createClient } from "@/lib/supabase/server";

export default async function DataPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .in("status", ["extracted", "validated"])
    .order("created_at", { ascending: false });

  const documentIds = (documents ?? []).map((document) => document.id);
  const extractions = documentIds.length
    ? (
        await supabase
          .from("extractions")
          .select("document_id, fields, created_at")
          .in("document_id", documentIds)
          .order("created_at", { ascending: false })
      ).data
    : [];

  const rows = buildDocumentExtractions(documents ?? [], extractions ?? []);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour à la liste
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Données extraites</h1>
          <p className="text-sm text-muted-foreground">
            Tous les champs extraits de vos documents analysés.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
          <ThemeToggle />
        </div>
      </header>
      <ExtractionsTable rows={rows} />
    </main>
  );
}
