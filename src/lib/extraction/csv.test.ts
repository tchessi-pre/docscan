import { describe, expect, it } from "vitest";
import { fieldsToCsv } from "./csv";
import type { ExtractedField } from "./schemas";

function field(overrides: Partial<ExtractedField> = {}): ExtractedField {
  return {
    key: "montant_ttc",
    label: "Montant TTC",
    value: "1200.00 €",
    page: 2,
    quote: "Montant TTC : 1200.00 €",
    confidence: "high",
    ...overrides,
  };
}

describe("fieldsToCsv", () => {
  it("commence par un BOM UTF-8 et contient les en-têtes français", () => {
    const csv = fieldsToCsv([field()]);

    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Clé,Libellé,Valeur,Page,Citation,Confiance");
  });

  it("écrit une ligne par champ avec les bonnes valeurs", () => {
    const csv = fieldsToCsv([field()]);
    const lines = csv.replace("﻿", "").split("\r\n");

    expect(lines[1]).toBe("montant_ttc,Montant TTC,1200.00 €,2,Montant TTC : 1200.00 €,high");
  });

  it("représente value/page/quote absents par une cellule vide", () => {
    const csv = fieldsToCsv([field({ value: null, page: null, quote: null })]);
    const lines = csv.replace("﻿", "").split("\r\n");

    expect(lines[1]).toBe("montant_ttc,Montant TTC,,,,high");
  });

  it("échappe les valeurs contenant une virgule, un guillemet ou un retour à la ligne", () => {
    const csv = fieldsToCsv([
      field({ value: 'Dupont, Martin "et associés"', quote: "ligne 1\nligne 2" }),
    ]);
    const lines = csv.replace("﻿", "").split("\r\n");

    expect(lines[1]).toContain('"Dupont, Martin ""et associés"""');
    expect(lines[1]).toContain('"ligne 1\nligne 2"');
  });
});
