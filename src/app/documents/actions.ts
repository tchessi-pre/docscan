"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { buildStoragePath } from "@/lib/documents/storage-path";
import { validateUploadedFile } from "@/lib/documents/validate-upload";
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
