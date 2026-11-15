import { describe, expect, it } from "vitest";
import { validateUploadedFile } from "./validate-upload";

function makeFile(options: { type?: string; sizeBytes?: number } = {}): File {
  const size = options.sizeBytes ?? 1024;
  return new File([new Uint8Array(size)], "document.pdf", {
    type: options.type ?? "application/pdf",
  });
}

describe("validateUploadedFile", () => {
  it("accepte un PDF de taille raisonnable", () => {
    expect(validateUploadedFile(makeFile())).toEqual({ ok: true });
  });

  it("rejette un fichier qui n'est pas un PDF", () => {
    const result = validateUploadedFile(makeFile({ type: "image/png" }));
    expect(result.ok).toBe(false);
  });

  it("rejette un PDF de plus de 10 Mo", () => {
    const result = validateUploadedFile(
      makeFile({ sizeBytes: 10 * 1024 * 1024 + 1 }),
    );
    expect(result.ok).toBe(false);
  });
});
