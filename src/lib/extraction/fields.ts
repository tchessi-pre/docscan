import type { ExtractedField } from "./schemas";

export function applyFieldEdit(
  fields: ExtractedField[],
  key: string,
  value: string,
): ExtractedField[] {
  return fields.map((field) => (field.key === key ? { ...field, value } : field));
}
