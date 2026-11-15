import type { ExtractedField } from "@/lib/extraction/schemas";
import type { Database } from "@/lib/supabase/database.types";

export const DOC_TYPE_LABELS: Record<Database["public"]["Enums"]["doc_type"], string> = {
  quote: "Devis",
  specification: "Cahier des charges",
  other: "Autre",
};

export const STATUS_LABELS: Record<Database["public"]["Enums"]["doc_status"], string> = {
  uploaded: "Uploadé",
  processing: "En cours",
  extracted: "Extrait",
  validated: "Validé",
  failed: "Échoué",
};

export const STATUS_BADGE_CLASSES: Record<Database["public"]["Enums"]["doc_status"], string> = {
  uploaded: "bg-muted text-muted-foreground",
  processing: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  extracted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  validated: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export const CONFIDENCE_LABELS: Record<ExtractedField["confidence"], string> = {
  high: "Fiable",
  medium: "À vérifier",
  low: "Incertain",
};

export const CONFIDENCE_BADGE_CLASSES: Record<ExtractedField["confidence"], string> = {
  high: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};
