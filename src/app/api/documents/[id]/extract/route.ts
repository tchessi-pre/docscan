import { NextResponse } from "next/server";
import { countPdfPages, MAX_PDF_PAGES } from "@/lib/documents/pdf-limits";
import { extractDocument } from "@/lib/extraction/extract";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (documentError || !document) {
    return NextResponse.json(
      { ok: false, error: "Document introuvable." },
      { status: 404 },
    );
  }

  await supabase
    .from("documents")
    .update({ status: "processing", error: null })
    .eq("id", id);

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("documents")
    .download(document.storage_path);

  if (downloadError || !fileBlob) {
    const message = downloadError?.message ?? "Téléchargement du PDF impossible.";
    await supabase
      .from("documents")
      .update({ status: "failed", error: message })
      .eq("id", id);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  const fileBytes = new Uint8Array(await fileBlob.arrayBuffer());
  const pageCount = await countPdfPages(fileBytes);

  if (pageCount > MAX_PDF_PAGES) {
    const message = `Le document dépasse la limite de ${MAX_PDF_PAGES} pages (${pageCount}).`;
    await supabase
      .from("documents")
      .update({ status: "failed", error: message })
      .eq("id", id);
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }

  const pdfBase64 = Buffer.from(fileBytes).toString("base64");
  const result = await extractDocument({ pdfBase64, docType: document.doc_type });

  if (!result.ok) {
    await supabase
      .from("documents")
      .update({ status: "failed", error: result.error })
      .eq("id", id);
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  const { error: insertError } = await supabase.from("extractions").insert({
    document_id: id,
    fields: result.data.fields,
    model: result.data.model,
    input_tokens: result.data.inputTokens,
    output_tokens: result.data.outputTokens,
  });

  if (insertError) {
    await supabase
      .from("documents")
      .update({ status: "failed", error: insertError.message })
      .eq("id", id);
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  await supabase.from("documents").update({ status: "extracted" }).eq("id", id);

  return NextResponse.json({ ok: true, data: { id } });
}
