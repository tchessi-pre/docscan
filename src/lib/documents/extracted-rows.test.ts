import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { buildDocumentExtractions } from "./extracted-rows";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type ExtractionRow = Database["public"]["Tables"]["extractions"]["Row"];
type ExtractionLike = Pick<ExtractionRow, "document_id" | "fields" | "created_at">;

function makeDocument(id: string): DocumentRow {
  return {
    id,
    user_id: "user-1",
    filename: `${id}.pdf`,
    storage_path: `user-1/${id}.pdf`,
    doc_type: "quote",
    status: "validated",
    error: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeField(key: string, value: string | null) {
  return { key, label: key, value, page: value === null ? null : 1, quote: value, confidence: "high" };
}

function makeExtraction(
  documentId: string,
  fields: ExtractionLike["fields"],
  createdAt: string,
): ExtractionLike {
  return { document_id: documentId, fields, created_at: createdAt };
}

describe("buildDocumentExtractions", () => {
  it("associe la dernière extraction à chaque document", () => {
    const [older, newer] = [
      makeExtraction("doc-1", { montant_ttc: makeField("montant_ttc", "100 €") }, "2026-01-01T00:00:00.000Z"),
      makeExtraction("doc-1", { montant_ttc: makeField("montant_ttc", "200 €") }, "2026-02-01T00:00:00.000Z"),
    ];

    const [result] = buildDocumentExtractions([makeDocument("doc-1")], [older, newer]);

    expect(result.fields).toEqual([makeField("montant_ttc", "200 €")]);
  });

  it("ne conserve que les champs dont la valeur est renseignée", () => {
    const extraction = makeExtraction(
      "doc-1",
      {
        client: makeField("client", "ACME"),
        montant_ttc: makeField("montant_ttc", null),
      },
      "2026-01-01T00:00:00.000Z",
    );

    const [result] = buildDocumentExtractions([makeDocument("doc-1")], [extraction]);

    expect(result.fields).toEqual([makeField("client", "ACME")]);
  });

  it("renvoie une liste de champs vide sans extraction", () => {
    const [result] = buildDocumentExtractions([makeDocument("doc-1")], []);

    expect(result.fields).toEqual([]);
  });

  it("aplatit les champs imbriqués (listes)", () => {
    const extraction = makeExtraction(
      "doc-1",
      {
        livrables: [
          { designation: makeField("livrable_1", "Étude") },
          { designation: makeField("livrable_2", "Chantier") },
        ],
      },
      "2026-01-01T00:00:00.000Z",
    );

    const [result] = buildDocumentExtractions([makeDocument("doc-1")], [extraction]);

    expect(result.fields.map((field) => field.value)).toEqual(["Étude", "Chantier"]);
  });
});
