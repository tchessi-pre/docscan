import { describe, expect, it } from "vitest";
import { applyFieldEdit } from "./fields";
import type { ExtractedField } from "./schemas";

function field(overrides: Partial<ExtractedField> = {}): ExtractedField {
  return {
    key: "montant_ttc",
    label: "Montant TTC",
    value: "1000.00 €",
    page: 1,
    quote: "Montant TTC : 1000.00 €",
    confidence: "high",
    ...overrides,
  };
}

describe("applyFieldEdit", () => {
  it("met à jour la valeur du champ correspondant à la clé", () => {
    const fields = [field({ key: "a" }), field({ key: "b", value: "old" })];

    const result = applyFieldEdit(fields, "b", "new");

    expect(result.find((f) => f.key === "b")?.value).toBe("new");
    expect(result.find((f) => f.key === "a")?.value).toBe(field().value);
  });

  it("laisse page et quote inchangés", () => {
    const fields = [field({ key: "a", page: 3, quote: "citation d'origine" })];

    const result = applyFieldEdit(fields, "a", "nouvelle valeur");

    expect(result[0].page).toBe(3);
    expect(result[0].quote).toBe("citation d'origine");
  });

  it("ne modifie rien si la clé n'existe pas", () => {
    const fields = [field({ key: "a" })];

    const result = applyFieldEdit(fields, "inconnue", "valeur");

    expect(result).toEqual(fields);
  });
});
