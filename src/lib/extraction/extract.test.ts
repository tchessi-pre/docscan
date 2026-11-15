import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractDocument } from "./extract";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(function AnthropicMock() {
    return { messages: { create: createMock } };
  }),
}));

function field(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    key: "titre",
    label: "Titre",
    value: "Rapport annuel",
    page: 1,
    quote: "Rapport annuel 2026",
    confidence: "high",
    ...overrides,
  };
}

const validOtherPayload = {
  titre: field({ key: "titre" }),
  auteur_emetteur: field({ key: "auteur_emetteur" }),
  date: field({ key: "date" }),
  resume: field({ key: "resume" }),
  points_cles: [
    field({ key: "point_1" }),
    field({ key: "point_2" }),
    field({ key: "point_3" }),
    field({ key: "point_4" }),
    field({ key: "point_5" }),
  ],
  dates_montants: [field({ key: "montant_1" })],
};

function toolUseMessage(input: unknown) {
  return {
    model: "claude-sonnet-5-5",
    usage: { input_tokens: 100, output_tokens: 50 },
    content: [
      { type: "tool_use", id: "tool_1", name: "record_extraction", input },
    ],
  };
}

function textOnlyMessage() {
  return {
    model: "claude-sonnet-5-5",
    usage: { input_tokens: 10, output_tokens: 5 },
    content: [{ type: "text", text: "je ne peux pas faire ça" }],
  };
}

beforeEach(() => {
  createMock.mockReset();
  process.env.ANTHROPIC_API_KEY = "test-key";
});

describe("extractDocument", () => {
  it("retourne les champs aplatis quand la sortie est valide du premier coup", async () => {
    createMock.mockResolvedValueOnce(toolUseMessage(validOtherPayload));

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fields.length).toBe(10);
      expect(result.data.inputTokens).toBe(100);
      expect(result.data.outputTokens).toBe(50);
    }
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("retente une fois en cas de sortie invalide, puis réussit", async () => {
    createMock
      .mockResolvedValueOnce(toolUseMessage({ titre: field() }))
      .mockResolvedValueOnce(toolUseMessage(validOtherPayload));

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(true);
    expect(createMock).toHaveBeenCalledTimes(2);

    const secondCallParams = createMock.mock.calls[1][0];
    expect(secondCallParams.messages).toHaveLength(3);
    expect(secondCallParams.messages[2].content[0].type).toBe("tool_result");
    expect(secondCallParams.messages[2].content[0].is_error).toBe(true);
  });

  it("échoue après le nombre maximum de tentatives invalides", async () => {
    createMock.mockResolvedValue(toolUseMessage({ titre: field() }));

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(false);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("échoue si le modèle n'appelle pas l'outil record_extraction", async () => {
    createMock.mockResolvedValueOnce(textOnlyMessage());

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(false);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("échoue immédiatement si ANTHROPIC_API_KEY est absente", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });
});
