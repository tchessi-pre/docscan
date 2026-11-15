import { collectExtractedFields, type ExtractedField } from "@/lib/extraction/schemas";
import type { Database } from "@/lib/supabase/database.types";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type ExtractionRow = Database["public"]["Tables"]["extractions"]["Row"];
type ExtractionLike = Pick<ExtractionRow, "document_id" | "fields" | "created_at">;

export type DocumentExtraction = {
  document: DocumentRow;
  fields: ExtractedField[];
};

// Associe à chaque document sa dernière extraction, en ne conservant que les
// champs réellement renseignés (une valeur absente reste `null`).
export function buildDocumentExtractions(
  documents: DocumentRow[],
  extractions: ExtractionLike[],
): DocumentExtraction[] {
  const latestByDocument = new Map<string, ExtractionLike>();
  for (const extraction of extractions) {
    const current = latestByDocument.get(extraction.document_id);
    if (!current || extraction.created_at > current.created_at) {
      latestByDocument.set(extraction.document_id, extraction);
    }
  }

  return documents.map((document) => {
    const extraction = latestByDocument.get(document.id);
    const fields = extraction
      ? collectExtractedFields(extraction.fields).filter((field) => field.value !== null)
      : [];
    return { document, fields };
  });
}
