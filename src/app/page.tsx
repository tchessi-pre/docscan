import { Info, ScanText } from "lucide-react";
import { DocumentList } from "@/components/DocumentList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UploadForm } from "@/components/UploadForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ScanText className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold tracking-tight">DocScan</h1>
            <p className="text-sm text-muted-foreground">
              Extraction de données structurées depuis vos PDF techniques
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>
      <Alert>
        <Info />
        <AlertDescription>
          Les documents analysés sont transmis à Anthropic (sous-traitant IA) pour
          l&apos;extraction. Ces données ne servent pas à entraîner leurs modèles par défaut.
        </AlertDescription>
      </Alert>
      <UploadForm />
      <DocumentList documents={documents ?? []} />
    </main>
  );
}
