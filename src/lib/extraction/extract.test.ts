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

const validQuotePayload = {
  emetteur: field({ key: "emetteur" }),
  client: field({ key: "client" }),
  numero: field({ key: "numero" }),
  date: field({ key: "date" }),
  validite: field({ key: "validite" }),
  montant_ht: field({ key: "montant_ht" }),
  tva: field({ key: "tva" }),
  montant_ttc: field({ key: "montant_ttc" }),
  conditions_paiement: field({ key: "conditions_paiement" }),
  delai_realisation: field({ key: "delai_realisation" }),
  lignes_principales: [
    {
      designation: field({ key: "ligne_1_designation" }),
      quantite: field({ key: "ligne_1_quantite" }),
      prix: field({ key: "ligne_1_prix" }),
    },
  ],
  type_mismatch: false,
  type_mismatch_reason: "",
};

function jsonMessage(payload: unknown) {
  return {
    model: "claude-sonnet-5-5",
    usage: { input_tokens: 100, output_tokens: 50 },
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

function textMessage(text: string) {
  return {
    model: "claude-sonnet-5-5",
    usage: { input_tokens: 10, output_tokens: 5 },
    content: [{ type: "text", text }],
  };
}

function noTextMessage() {
  return {
    model: "claude-sonnet-5-5",
    usage: { input_tokens: 10, output_tokens: 5 },
    content: [],
  };
}

beforeEach(() => {
  createMock.mockReset();
  process.env.ANTHROPIC_API_KEY = "test-key";
});

describe("extractDocument", () => {
  it("retourne les champs aplatis quand la sortie est valide du premier coup", async () => {
    createMock.mockResolvedValueOnce(jsonMessage(validOtherPayload));

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fields.length).toBe(10);
      expect(result.data.inputTokens).toBe(100);
      expect(result.data.outputTokens).toBe(50);
      expect(result.data.typeMismatch).toBe(false);
      expect(result.data.typeMismatchReason).toBeNull();
    }
    expect(createMock).toHaveBeenCalledTimes(1);

    const callParams = createMock.mock.calls[0][0];
    expect(callParams.output_config.format.type).toBe("json_schema");
    expect(callParams.tools).toBeUndefined();
  });

  it("signale un type_mismatch détecté par le modèle sur un devis", async () => {
    createMock.mockResolvedValueOnce(
      jsonMessage({
        ...validQuotePayload,
        type_mismatch: true,
        type_mismatch_reason: "Il s'agit d'une facture, pas d'un devis.",
      }),
    );

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "quote" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.typeMismatch).toBe(true);
      expect(result.data.typeMismatchReason).toBe("Il s'agit d'une facture, pas d'un devis.");
    }
  });

  it("retente une fois en cas de sortie invalide, puis réussit", async () => {
    createMock
      .mockResolvedValueOnce(jsonMessage({ titre: field() }))
      .mockResolvedValueOnce(jsonMessage(validOtherPayload));

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(true);
    expect(createMock).toHaveBeenCalledTimes(2);

    const secondCallParams = createMock.mock.calls[1][0];
    expect(secondCallParams.messages).toHaveLength(3);
    expect(secondCallParams.messages[1].role).toBe("assistant");
    expect(secondCallParams.messages[2].role).toBe("user");
  });

  it("retente une fois si la sortie n'est pas un JSON valide, puis réussit", async () => {
    createMock
      .mockResolvedValueOnce(textMessage("ceci n'est pas du json"))
      .mockResolvedValueOnce(jsonMessage(validOtherPayload));

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(true);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("échoue après le nombre maximum de tentatives invalides", async () => {
    createMock.mockResolvedValue(jsonMessage({ titre: field() }));

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(false);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("échoue si le modèle ne renvoie aucun bloc de texte", async () => {
    createMock.mockResolvedValueOnce(noTextMessage());

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(false);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("échoue proprement (sans lever d'exception) si l'appel réseau échoue", async () => {
    createMock.mockRejectedValueOnce(new Error("Connection error."));

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Connection error.");
    }
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("échoue immédiatement si ANTHROPIC_API_KEY est absente", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await extractDocument({ pdfBase64: "ZGF0YQ==", docType: "other" });

    expect(result.ok).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });
});
