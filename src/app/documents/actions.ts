"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildStoragePath } from "@/lib/documents/storage-path";
import { validateUploadedFile } from "@/lib/documents/validate-upload";
import { applyFieldEdit } from "@/lib/extraction/fields";
import { extractedFieldSchema } from "@/lib/extraction/schemas";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type DocType = Database["public"]["Enums"]["doc_type"];

const DOC_TYPES: DocType[] = ["quote", "specification", "other"];

export type UploadDocumentResult =
  | { ok: true; data: { id: string } }
  | { ok: false; error: string };

export async function uploadDocument(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const file = formData.get("file");
  const docType = formData.get("docType");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Sélectionne un fichier PDF." };
  }
  if (typeof docType !== "string" || !DOC_TYPES.includes(docType as DocType)) {
    return { ok: false, error: "Sélectionne un type de document." };
  }

  const validation = validateUploadedFile(file);
  if (!validation.ok) {
    return validation;
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, error: "Session utilisateur introuvable." };
  }

  const documentId = randomUUID();
  const storagePath = buildStoragePath(userData.user.id, documentId);

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, { contentType: "application/pdf" });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    user_id: userData.user.id,
    filename: file.name,
    storage_path: storagePath,
    doc_type: docType as DocType,
  });
  if (insertError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { ok: false, error: insertError.message };
  }

  revalidatePath("/");
  return { ok: true, data: { id: documentId } };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateField(
  documentId: string,
  fieldKey: string,
  value: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: extraction, error: fetchError } = await supabase
    .from("extractions")
    .select("fields")
    .eq("document_id", documentId)
    .single();
  if (fetchError || !extraction) {
    return { ok: false, error: "Extraction introuvable." };
  }

  const parsedFields = z.array(extractedFieldSchema).safeParse(extraction.fields);
  if (!parsedFields.success) {
    return { ok: false, error: "Champs extraits invalides en base." };
  }

  const updatedFields = applyFieldEdit(parsedFields.data, fieldKey, value);

  const { error: updateError } = await supabase
    .from("extractions")
    .update({ fields: updatedFields, edited: true })
    .eq("document_id", documentId);
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/documents/${documentId}`);
  return { ok: true };
}

export async function validateDocument(documentId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error: extractionError } = await supabase
    .from("extractions")
    .update({ validated_at: new Date().toISOString() })
    .eq("document_id", documentId);
  if (extractionError) {
    return { ok: false, error: extractionError.message };
  }

  const { error: documentError } = await supabase
    .from("documents")
    .update({ status: "validated" })
    .eq("id", documentId);
  if (documentError) {
    return { ok: false, error: documentError.message };
  }

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();
  if (fetchError || !document) {
    return { ok: false, error: "Document introuvable." };
  }

  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([document.storage_path]);
  if (storageError) {
    return { ok: false, error: storageError.message };
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);
  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  revalidatePath("/");
  return { ok: true };
}
