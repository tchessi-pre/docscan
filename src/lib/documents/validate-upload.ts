const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function validateUploadedFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  if (file.type !== "application/pdf") {
    return { ok: false, error: "Le fichier doit être un PDF." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "Le fichier ne doit pas dépasser 10 Mo." };
  }
  return { ok: true };
}
