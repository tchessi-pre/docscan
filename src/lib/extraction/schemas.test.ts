import { describe, expect, it } from "vitest";
import {
  collectExtractedFields,
  convertSentinels,
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

describe("collectExtractedFields", () => {
  it("aplatit un objet structuré par champ nommé en liste plate", () => {
    const parsed = {
      titre: field({ key: "titre" }),
      resume: field({ key: "resume" }),
      points_cles: [field({ key: "point_1" }), field({ key: "point_2" })],
    };

    const fields = collectExtractedFields(parsed);

    expect(fields.map((f) => f.key).sort()).toEqual(
      ["point_1", "point_2", "resume", "titre"].sort(),
    );
  });

  it("aplatit les lignes composites (objets de plusieurs ExtractedField)", () => {
    const parsed = {
      lignes_principales: [
        {
          designation: field({ key: "ligne_1_designation" }),
          quantite: field({ key: "ligne_1_quantite" }),
          prix: field({ key: "ligne_1_prix" }),
        },
      ],
    };

    const fields = collectExtractedFields(parsed);

    expect(fields.map((f) => f.key).sort()).toEqual(
      ["ligne_1_designation", "ligne_1_prix", "ligne_1_quantite"].sort(),
    );
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

  it("ne contient pas de minimum/maximum (non supportés par l'API Anthropic)", () => {
    const jsonSchema = JSON.stringify(toToolInputSchema(quoteSchema));

    expect(jsonSchema).not.toContain("minimum");
    expect(jsonSchema).not.toContain("maximum");
  });

  it("ne contient aucun champ nullable/union (limite de 16 de l'API Anthropic)", () => {
    const jsonSchema = JSON.stringify(toToolInputSchema(quoteSchema));

    expect(jsonSchema).not.toContain("anyOf");
    expect(jsonSchema).not.toContain('"null"');
  });
});

describe("convertSentinels", () => {
  it("convertit les sentinelles (\"\"/0) en vrais null", () => {
    const wireField = {
      key: "montant_ttc",
      label: "Montant TTC",
      value: "",
      page: 0,
      quote: "",
      confidence: "low",
    };

    expect(convertSentinels(wireField)).toEqual(field());
  });

  it("laisse une valeur renseignée inchangée", () => {
    const wireField = {
      key: "montant_ttc",
      label: "Montant TTC",
      value: "1200.00 €",
      page: 2,
      quote: "Montant TTC : 1200.00 €",
      confidence: "high",
    };

    expect(convertSentinels(wireField)).toEqual(wireField);
  });

  it("convertit récursivement dans les tableaux et objets imbriqués", () => {
    const parsed = {
      lignes_principales: [
        {
          designation: { key: "a", label: "A", value: "", page: 0, quote: "", confidence: "low" },
        },
      ],
    };

    const result = convertSentinels(parsed) as {
      lignes_principales: Array<{ designation: { value: null } }>;
    };

    expect(result.lignes_principales[0].designation.value).toBeNull();
  });
});
