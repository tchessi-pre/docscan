import { describe, expect, it } from "vitest";
import {
  extractedFieldSchema,
  otherSchema,
  quoteSchema,
  specificationSchema,
  toToolInputSchema,
} from "./schemas";

function field(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    key: "montant_ttc",
    label: "Montant TTC",
    value: null,
    page: null,
    quote: null,
    confidence: "low",
    ...overrides,
  };
}

describe("extractedFieldSchema", () => {
  it("accepte un champ absent (value/page/quote à null)", () => {
    expect(extractedFieldSchema.safeParse(field()).success).toBe(true);
  });

  it("accepte un champ renseigné", () => {
    const result = extractedFieldSchema.safeParse(
      field({ value: "1200.00 €", page: 2, quote: "Montant TTC : 1200.00 €", confidence: "high" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejette une confidence hors énumération", () => {
    const result = extractedFieldSchema.safeParse(field({ confidence: "certain" }));
    expect(result.success).toBe(false);
  });

  it("rejette un champ manquant", () => {
    const incomplete: Record<string, unknown> = field();
    delete incomplete.label;
    expect(extractedFieldSchema.safeParse(incomplete).success).toBe(false);
  });
});

describe("quoteSchema", () => {
  it("accepte un devis complet avec ses lignes principales", () => {
    const result = quoteSchema.safeParse({
      emetteur: field({ key: "emetteur" }),
      client: field({ key: "client" }),
      numero: field({ key: "numero" }),
      date: field({ key: "date" }),
      validite: field({ key: "validite" }),
      montant_ht: field({ key: "montant_ht" }),
      tva: field({ key: "tva" }),
      montant_ttc: field({ key: "montant_ttc" }),
      conditions_paiement: field({ key: "conditions_paiement" }),
      delai_realisation: field({ key: "delai_realisation" }),
      lignes_principales: [
        {
          designation: field({ key: "designation" }),
          quantite: field({ key: "quantite" }),
          prix: field({ key: "prix" }),
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejette un devis sans lignes_principales", () => {
    expect(
      quoteSchema.safeParse({
        emetteur: field(),
        client: field(),
        numero: field(),
        date: field(),
        validite: field(),
        montant_ht: field(),
        tva: field(),
        montant_ttc: field(),
        conditions_paiement: field(),
        delai_realisation: field(),
      }).success,
    ).toBe(false);
  });
});

describe("specificationSchema", () => {
  it("accepte un cahier des charges avec ses listes", () => {
    const result = specificationSchema.safeParse({
      maitre_ouvrage: field(),
      objet: field(),
      date_limite_reponse: field(),
      budget_indicatif: field(),
      livrables: [field({ value: "Livrable 1" })],
      exigences_techniques: [field({ value: "Exigence 1" })],
      normes_citees: [field({ value: "NF EN 1090" })],
      criteres_selection: [field({ value: "Prix" })],
      contact: field(),
    });
    expect(result.success).toBe(true);
  });
});

describe("otherSchema", () => {
  it("accepte un document générique", () => {
    const result = otherSchema.safeParse({
      titre: field(),
      auteur_emetteur: field(),
      date: field(),
      resume: field(),
      points_cles: [field(), field(), field(), field(), field()],
      dates_montants: [field()],
    });
    expect(result.success).toBe(true);
  });
});

describe("toToolInputSchema", () => {
  it("dérive un JSON Schema d'objet avec les propriétés attendues", () => {
    const jsonSchema = toToolInputSchema(quoteSchema) as Record<string, unknown>;

    expect(jsonSchema.type).toBe("object");
    expect(jsonSchema.properties).toMatchObject({
      emetteur: expect.any(Object),
      lignes_principales: expect.any(Object),
    });
    expect(jsonSchema.required).toEqual(
      expect.arrayContaining(["emetteur", "montant_ttc", "lignes_principales"]),
    );
  });
});
