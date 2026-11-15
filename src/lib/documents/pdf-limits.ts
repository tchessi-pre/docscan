import { PDFDocument } from "pdf-lib";

export const MAX_PDF_PAGES = 30;

export async function countPdfPages(bytes: Uint8Array): Promise<number> {
  const document = await PDFDocument.load(bytes);
  return document.getPageCount();
}
