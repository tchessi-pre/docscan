import { z } from "zod";

export const extractedFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string().nullable(),
  page: z.number().int().nullable(),
  quote: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
});

export type ExtractedField = z.infer<typeof extractedFieldSchema>;

const quoteLineSchema = z.object({
  designation: extractedFieldSchema,
  quantite: extractedFieldSchema,
  prix: extractedFieldSchema,
});

export const quoteSchema = z.object({
  emetteur: extractedFieldSchema,
  client: extractedFieldSchema,
  numero: extractedFieldSchema,
  date: extractedFieldSchema,
  validite: extractedFieldSchema,
  montant_ht: extractedFieldSchema,
  tva: extractedFieldSchema,
  montant_ttc: extractedFieldSchema,
  conditions_paiement: extractedFieldSchema,
  delai_realisation: extractedFieldSchema,
  lignes_principales: z.array(quoteLineSchema),
});

export const specificationSchema = z.object({
  maitre_ouvrage: extractedFieldSchema,
  objet: extractedFieldSchema,
  date_limite_reponse: extractedFieldSchema,
  budget_indicatif: extractedFieldSchema,
  livrables: z.array(extractedFieldSchema),
  exigences_techniques: z.array(extractedFieldSchema),
  normes_citees: z.array(extractedFieldSchema),
  criteres_selection: z.array(extractedFieldSchema),
  contact: extractedFieldSchema,
});

export const otherSchema = z.object({
  titre: extractedFieldSchema,
  auteur_emetteur: extractedFieldSchema,
  date: extractedFieldSchema,
  resume: extractedFieldSchema,
  points_cles: z.array(extractedFieldSchema),
  dates_montants: z.array(extractedFieldSchema),
});

export const extractionSchemas = {
  quote: quoteSchema,
  specification: specificationSchema,
  other: otherSchema,
} as const;

export type DocType = keyof typeof extractionSchemas;

// L'API Anthropic (structured outputs) rejette minimum/maximum sur les
// entiers ; z.number().int() les ajoute pourtant (bornes de sécurité JS).
// On les retire du schéma envoyé, sans toucher à la validation Zod interne.
function stripNumericBounds(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(stripNumericBounds);
  }
  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node as Record<string, unknown>)
        .filter(([key]) => key !== "minimum" && key !== "maximum")
        .map(([key, value]) => [key, stripNumericBounds(value)]),
    );
  }
  return node;
}

// Anthropic limite à 16 le nombre de champs nullable/union dans un schéma
// ("structured outputs"). Nos schémas en dépassent largement à cause des
// value/page/quote nullable de chaque ExtractedField. On envoie donc au
// modèle une version "wire" sans null (sentinelles : "" / 0), puis on la
// reconvertit en vrais null avant de valider avec les schémas réels
// (extractedFieldSchema etc., inchangés).
const wireExtractedFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  page: z.number().int(),
  quote: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

function toWireNode(node: z.ZodType): z.ZodType {
  if (node === extractedFieldSchema) {
    return wireExtractedFieldSchema;
  }
  if (node instanceof z.ZodArray) {
    return z.array(toWireNode(node.element as z.ZodType));
  }
  if (node instanceof z.ZodObject) {
    const wireShape = Object.fromEntries(
      Object.entries(node.shape).map(([key, value]) => [key, toWireNode(value as z.ZodType)]),
    );
    return z.object(wireShape);
  }
  return node;
}

export function toToolInputSchema(schema: z.ZodType) {
  return stripNumericBounds(z.toJSONSchema(toWireNode(schema), { reused: "ref" }));
}

function isWireField(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "value" in value &&
    "page" in value &&
    "quote" in value &&
    "confidence" in value
  );
}

// Convertit les sentinelles ("" / 0) renvoyées par le modèle en vrais null,
// avant validation avec les schémas réels (nullable).
export function convertSentinels(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(convertSentinels);
  }
  if (isWireField(node)) {
    return {
      ...node,
      value: node.value === "" ? null : node.value,
      page: node.page === 0 ? null : node.page,
      quote: node.quote === "" ? null : node.quote,
    };
  }
  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, convertSentinels(value)]),
    );
  }
  return node;
}

export function collectExtractedFields(value: unknown): ExtractedField[] {
  const result = extractedFieldSchema.safeParse(value);
  if (result.success) {
    return [result.data];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectExtractedFields);
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectExtractedFields);
  }
  return [];
}
