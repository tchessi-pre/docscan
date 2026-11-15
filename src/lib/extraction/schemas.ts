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

export function toToolInputSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema);
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
