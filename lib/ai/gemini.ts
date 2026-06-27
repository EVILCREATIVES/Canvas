/**
 * GeminiProvider — implements the `Provider` interface against Google's
 * Generative AI APIs.
 *
 * References:
 *   - https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5
 *   - https://ai.google.dev/gemini-api/docs/image-generation
 *   - https://ai.google.dev/gemini-api/docs/video
 *
 * The image and video endpoints use the REST API directly because the JS
 * SDK doesn't yet expose Imagen 3 / Veo in a stable surface.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

import type {
  EditImageInput,
  GenerateImageInput,
  GenerateImageResult,
  GenerateTextInput,
  GenerateTextResult,
  GenerateVideoInput,
  GenerateVideoResult,
  Provider,
  ResolvedModel,
} from "./types";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function apiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not configured");
  return k;
}

async function geminiFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}?key=${apiKey()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export const GeminiProvider: Provider = {
  name: "gemini",

  async generateText(input: GenerateTextInput, opts: ResolvedModel): Promise<GenerateTextResult> {
    const client = new GoogleGenerativeAI(apiKey());
    const model = client.getGenerativeModel({
      model: opts.model,
      systemInstruction: input.systemPrompt,
      generationConfig: {
        temperature: input.temperature ?? opts.temperature,
        maxOutputTokens: input.maxOutputTokens,
        responseMimeType: input.responseSchema ? "application/json" : undefined,
        // The SDK accepts a JSON schema here when responseMimeType is JSON.
        // We pass it through verbatim.
        ...(input.responseSchema
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ({ responseSchema: input.responseSchema } as any)
          : {}),
      },
    });
    const result = await model.generateContent(input.prompt);
    const text = result.response.text();
    let json: unknown;
    if (input.responseSchema) {
      try {
        json = JSON.parse(text);
      } catch {
        /* leave undefined */
      }
    }
    const usage = result.response.usageMetadata;
    return {
      text,
      json,
      model: opts.model,
      usage: {
        inputTokens: usage?.promptTokenCount,
        outputTokens: usage?.candidatesTokenCount,
      },
    };
  },

  async generateImage(
    input: GenerateImageInput,
    opts: ResolvedModel,
  ): Promise<GenerateImageResult> {
    // Imagen 3 REST endpoint.
    type Response = {
      predictions?: Array<{ bytesBase64Encoded: string; mimeType?: string }>;
    };
    const body = {
      instances: [{ prompt: input.prompt }],
      parameters: {
        sampleCount: input.count ?? 1,
        aspectRatio: input.aspectRatio,
        negativePrompt: input.negativePrompt,
      },
    };
    const data = await geminiFetch<Response>(
      `/models/${encodeURIComponent(opts.model)}:predict`,
      body,
    );
    const images = (data.predictions ?? []).map((p) => ({
      url: `data:${p.mimeType ?? "image/png"};base64,${p.bytesBase64Encoded}`,
      mime: p.mimeType ?? "image/png",
    }));
    return { images, model: opts.model };
  },

  async editImage(input: EditImageInput, opts: ResolvedModel): Promise<GenerateImageResult> {
    // Gemini 1.5 / 3.x multimodal can be used for image edits via inline image
    // input + prompt. We keep the call shape parallel to generateImage.
    const client = new GoogleGenerativeAI(apiKey());
    const model = client.getGenerativeModel({ model: opts.model });
    const { base64, mime } = await toBase64(input.image);
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: mime } },
      { text: input.prompt },
    ]);
    // The current text-first models won't return an image; this is a stub
    // that will be replaced when image-edit endpoints become available.
    const text = result.response.text();
    return {
      images: [
        {
          url: `data:text/plain;base64,${Buffer.from(text).toString("base64")}`,
          mime: "text/plain",
        },
      ],
      model: opts.model,
    };
  },

  async generateVideo(
    input: GenerateVideoInput,
    opts: ResolvedModel,
  ): Promise<GenerateVideoResult> {
    // Veo long-running operation: POST returns an operation name we can poll.
    type LRO = { name: string; done?: boolean };
    const body: Record<string, unknown> = {
      instances: [
        {
          prompt: input.prompt,
          ...(input.image
            ? {
                image: {
                  bytesBase64Encoded: (await toBase64(input.image)).base64,
                  mimeType: input.image.mime ?? "image/png",
                },
              }
            : {}),
        },
      ],
      parameters: {
        durationSeconds: input.durationSeconds ?? 4,
        aspectRatio: input.aspectRatio ?? "16:9",
      },
    };
    const lro = await geminiFetch<LRO>(
      `/models/${encodeURIComponent(opts.model)}:predictLongRunning`,
      body,
    );
    return { jobId: lro.name, status: "queued", model: opts.model };
  },

  async pollVideo(jobId: string, opts: ResolvedModel): Promise<GenerateVideoResult> {
    type Op = {
      done?: boolean;
      error?: { message?: string };
      response?: {
        generateVideoResponse?: {
          generatedSamples?: Array<{ video?: { uri?: string } }>;
        };
      };
    };
    const res = await fetch(
      `${API_BASE}/${jobId}?key=${apiKey()}`,
      { method: "GET" },
    );
    if (!res.ok) {
      throw new Error(`Gemini poll failed: ${res.status} ${await res.text()}`);
    }
    const op = (await res.json()) as Op;
    if (op.error) {
      return { jobId, status: "failed", model: opts.model };
    }
    if (!op.done) return { jobId, status: "generating", model: opts.model };
    const sample = op.response?.generateVideoResponse?.generatedSamples?.[0];
    return {
      jobId,
      status: sample?.video?.uri ? "ready" : "failed",
      url: sample?.video?.uri,
      model: opts.model,
    };
  },
};

async function toBase64(ref: { source: string; mime?: string }): Promise<{
  base64: string;
  mime: string;
}> {
  if (ref.source.startsWith("data:")) {
    const [meta, data] = ref.source.split(",", 2);
    return {
      base64: data ?? "",
      mime: ref.mime ?? (meta.slice(5, meta.indexOf(";")) || "image/png"),
    };
  }
  const res = await fetch(ref.source);
  if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { base64: buf.toString("base64"), mime: ref.mime ?? res.headers.get("content-type") ?? "image/png" };
}
