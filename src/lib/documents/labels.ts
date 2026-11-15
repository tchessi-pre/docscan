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
