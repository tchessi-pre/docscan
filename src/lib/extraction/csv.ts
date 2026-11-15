import type { ExtractedField } from "./schemas";

const HEADERS = ["Clé", "Libellé", "Valeur", "Page", "Citation", "Confiance"];

function escapeCsvValue(value: string): string {
  if (/["\n\r,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function fieldsToCsv(fields: ExtractedField[]): string {
  const rows = [
    HEADERS,
    ...fields.map((field) => [
      field.key,
      field.label,
      field.value ?? "",
      field.page !== null ? String(field.page) : "",
      field.quote ?? "",
      field.confidence,
    ]),
  ];

  const body = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  return `﻿${body}`;
}
