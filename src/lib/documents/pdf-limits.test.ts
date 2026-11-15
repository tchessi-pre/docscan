import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { countPdfPages } from "./pdf-limits";

async function makePdf(pageCount: number): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  for (let i = 0; i < pageCount; i += 1) {
    document.addPage();
  }
  return document.save();
}

describe("countPdfPages", () => {
  it("compte le nombre de pages d'un PDF", async () => {
    const bytes = await makePdf(3);
    expect(await countPdfPages(bytes)).toBe(3);
  });

  it("compte un PDF d'une seule page", async () => {
    const bytes = await makePdf(1);
    expect(await countPdfPages(bytes)).toBe(1);
  });
});
