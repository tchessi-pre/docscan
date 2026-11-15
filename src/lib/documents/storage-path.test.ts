import { describe, expect, it } from "vitest";
import { buildStoragePath } from "./storage-path";

describe("buildStoragePath", () => {
  it("construit le chemin {user_id}/{document_id}.pdf", () => {
    expect(buildStoragePath("user-1", "doc-1")).toBe("user-1/doc-1.pdf");
  });
});
