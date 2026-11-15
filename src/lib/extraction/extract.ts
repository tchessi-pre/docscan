import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "./prompt";
import {
  collectExtractedFields,
  extractionSchemas,
  toToolInputSchema,
  type DocType,
  type ExtractedField,
} from "./schemas";

const TOOL_NAME = "record_extraction";
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
  const tool: Anthropic.Tool = {
    name: TOOL_NAME,
    description: "Enregistre les champs extraits du document.",
    input_schema: toToolInputSchema(schema) as Anthropic.Tool.InputSchema,
  };

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
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 4096,
      system: getSystemPrompt(docType),
      tools: [tool],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages,
    });

    totalInputTokens += message.usage.input_tokens;
    totalOutputTokens += message.usage.output_tokens;

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (!toolUse) {
      lastError = "le modèle n'a pas appelé l'outil record_extraction";
      break;
    }

    const parsed = schema.safeParse(toolUse.input);
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
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: toolUse.id,
              name: toolUse.name,
              input: toolUse.input,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUse.id,
              is_error: true,
              content: `Sortie invalide : ${lastError}. Corrige et renvoie un résultat complet et valide.`,
            },
          ],
        },
      );
    }
  }

  return {
    ok: false,
    error: `Extraction invalide après ${MAX_ATTEMPTS} tentative(s) : ${lastError}`,
  };
}
