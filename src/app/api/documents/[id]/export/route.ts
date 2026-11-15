import { NextResponse } from "next/server";
import { z } from "zod";
import { fieldsToCsv } from "@/lib/extraction/csv";
import { extractedFieldSchema } from "@/lib/extraction/schemas";
import { createClient } from "@/lib/supabase/server";

function baseFilename(filename: string): string {
  return filename.replace(/\.pdf$/i, "");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format");

  if (format !== "json" && format !== "csv") {
    return NextResponse.json(
      { ok: false, error: "Format d'export invalide (json ou csv attendu)." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!document) {
    return NextResponse.json({ ok: false, error: "Document introuvable." }, { status: 404 });
  }

  if (document.status !== "validated") {
    return NextResponse.json(
      { ok: false, error: "Le document doit être validé avant export." },
      { status: 403 },
    );
  }

  const { data: extraction } = await supabase
    .from("extractions")
    .select("fields")
    .eq("document_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const parsedFields = z.array(extractedFieldSchema).safeParse(extraction?.fields);
  if (!parsedFields.success) {
    return NextResponse.json(
      { ok: false, error: "Champs extraits invalides en base." },
      { status: 500 },
    );
  }

  const name = baseFilename(document.filename);

  if (format === "json") {
    return new NextResponse(JSON.stringify(parsedFields.data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}.json"`,
      },
    });
  }

  return new NextResponse(fieldsToCsv(parsedFields.data), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
    },
  });
}
