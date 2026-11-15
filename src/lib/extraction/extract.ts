import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "./prompt";
import {
  collectExtractedFields,
  convertSentinels,
  extractionSchemas,
  toToolInputSchema,
  type DocType,
  type ExtractedField,
} from "./schemas";

const MAX_ATTEMPTS = 2;

export type ExtractDocumentResult =
  | {
      ok: true;
      data: {
        fields: ExtractedField[];
        model: string;
        inputTokens: number;
        outputTokens: number;
      };
    }
  | { ok: false; error: string };

export async function extractDocument({
  pdfBase64,
  docType,
}: {
  pdfBase64: string;
  docType: DocType;
}): Promise<ExtractDocumentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY manquante." };
  }

  const client = new Anthropic({ apiKey });
  const schema = extractionSchemas[docType];
  const jsonSchema = toToolInputSchema(schema) as Record<string, unknown>;

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: pdfBase64,
          },
        },
        { type: "text", text: "Extrait les champs demandés de ce document." },
      ],
    },
  ];

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let lastError = "aucune réponse du modèle";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let message: Anthropic.Message;
    try {
      message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 4096,
        system: getSystemPrompt(docType),
        output_config: {
          format: { type: "json_schema", schema: jsonSchema },
        },
        messages,
      });
    } catch (cause) {
      const errorMessage = cause instanceof Error ? cause.message : "erreur inconnue";
      return { ok: false, error: `Appel à l'API Anthropic impossible : ${errorMessage}` };
    }

    totalInputTokens += message.usage.input_tokens;
    totalOutputTokens += message.usage.output_tokens;

    const textBlock = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );

    if (!textBlock) {
      lastError = "le modèle n'a renvoyé aucun texte";
      break;
    }

    let rawOutput: unknown;
    try {
      rawOutput = JSON.parse(textBlock.text);
    } catch {
      lastError = "la réponse du modèle n'est pas un JSON valide";
      if (attempt < MAX_ATTEMPTS) {
        messages.push(
          { role: "assistant", content: textBlock.text },
          {
            role: "user",
            content: `Ta réponse précédente n'était pas un JSON valide. Corrige et renvoie un JSON complet et valide respectant le schéma attendu.`,
          },
        );
      }
      continue;
    }

    const parsed = schema.safeParse(convertSentinels(rawOutput));
    if (parsed.success) {
      return {
        ok: true,
        data: {
          fields: collectExtractedFields(parsed.data),
          model: message.model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
      };
    }

    lastError = parsed.error.message;

    if (attempt < MAX_ATTEMPTS) {
      messages.push(
        { role: "assistant", content: textBlock.text },
        {
          role: "user",
          content: `Sortie invalide : ${lastError}. Corrige et renvoie un JSON complet et valide respectant strictement le schéma attendu.`,
        },
      );
    }
  }

  return {
    ok: false,
    error: `Extraction invalide après ${MAX_ATTEMPTS} tentative(s) : ${lastError}`,
  };
}
