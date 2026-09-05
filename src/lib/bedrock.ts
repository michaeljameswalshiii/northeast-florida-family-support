import { Sha256 } from "@aws-crypto/sha256-js";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";

export type AiResult = {
  content: string;
  modelId: string;
  modelLabel: string;
  inputTokens: number;
  outputTokens: number;
};

const REQUEST_TIMEOUT_MS = 75_000;

function region() {
  return process.env.AWS_REGION || "us-east-1";
}

export function bedrockConfigured() {
  return Boolean(process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim());
}

async function invokeNova(system: string, user: string): Promise<AiResult> {
  const modelId = process.env.BEDROCK_NAVIGATOR_MODEL_ID || "amazon.nova-lite-v1:0";
  const client = new BedrockRuntimeClient({
    region: region(),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
      sessionToken: process.env.AWS_SESSION_TOKEN?.trim() || undefined,
    },
  });
  const response = await client.send(new ConverseCommand({
    modelId,
    system: [{ text: system }],
    messages: [{ role: "user", content: [{ text: user }] }],
    inferenceConfig: { maxTokens: 1800, temperature: 0.15 },
  }), { abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const content = (response.output?.message?.content || []).map((block) => "text" in block ? block.text || "" : "").join("").trim();
  if (!content) throw new Error("Nova returned an empty answer.");
  return { content, modelId, modelLabel: "Nova Lite", inputTokens: response.usage?.inputTokens || 0, outputTokens: response.usage?.outputTokens || 0 };
}

async function invokeGrok(system: string, user: string): Promise<AiResult> {
  const awsRegion = region();
  const baseUrl = process.env.BEDROCK_MANTLE_BASE_URL?.replace(/\/$/, "") || `https://bedrock-mantle.${awsRegion}.api.aws/openai/v1`;
  const modelId = process.env.BEDROCK_MANTLE_MODEL_ID || "xai.grok-4.3";
  const url = `${baseUrl}/chat/completions`;
  const body = JSON.stringify({
    model: modelId,
    temperature: 0.15,
    max_completion_tokens: 1800,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  });
  const parsed = new URL(url);
  const signer = new SignatureV4({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
      sessionToken: process.env.AWS_SESSION_TOKEN?.trim() || undefined,
    },
    region: awsRegion,
    service: "bedrock",
    sha256: Sha256,
  });
  const signed = await signer.sign(new HttpRequest({
    method: "POST",
    protocol: "https:",
    hostname: parsed.hostname,
    path: parsed.pathname,
    headers: { host: parsed.hostname, "content-type": "application/json", accept: "application/json" },
    body,
  }));
  const response = await fetch(url, { method: "POST", headers: signed.headers as Record<string, string>, body, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const data = await response.json().catch(() => ({})) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(data.error?.message || `Grok could not answer (${response.status}).`);
  const content = data.choices?.[0]?.message?.content?.trim() || "";
  if (!content) throw new Error("Grok returned an empty answer.");
  return { content, modelId: data.model || modelId, modelLabel: "Grok 4.3", inputTokens: data.usage?.prompt_tokens || 0, outputTokens: data.usage?.completion_tokens || 0 };
}

export async function askWithModelLadder(system: string, user: string) {
  let lastError: unknown;
  for (const invoke of [invokeNova, invokeGrok]) {
    try {
      return await invoke(system, user);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No AI model is available.");
}
