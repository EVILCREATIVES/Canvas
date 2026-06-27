/**
 * AI provider abstraction.
 *
 * Every AI capability (text generation, image generation, video generation,
 * image editing) goes through a `Provider` so callers never depend on a
 * specific vendor. Providers are resolved at request time from the
 * `ai_settings` table, so an admin can switch model/provider without a
 * redeploy.
 */

export type AiTask =
  | "script"
  | "shots"
  | "panel"
  | "image"
  | "pose"
  | "style"
  | "video";

export interface GenerateTextInput {
  /** Operator-defined system prompt (resolved from ai_rules + ai_settings). */
  systemPrompt?: string;
  /** Primary user prompt. */
  prompt: string;
  /** Optional structured JSON schema the model should return. */
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateTextResult {
  text: string;
  /** Parsed JSON when `responseSchema` was supplied. */
  json?: unknown;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export interface ReferenceImage {
  /** Either a remote URL or a base64 data URL. */
  source: string;
  mime?: string;
}

export interface GenerateImageInput {
  prompt: string;
  references?: ReferenceImage[];
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  negativePrompt?: string;
  /** Number of variants to generate. */
  count?: number;
}

export interface GeneratedImage {
  /** Either a URL (if uploaded) or a base64 data URL. */
  url: string;
  mime: string;
  width?: number;
  height?: number;
}

export interface GenerateImageResult {
  images: GeneratedImage[];
  model: string;
}

export interface EditImageInput {
  prompt: string;
  image: ReferenceImage;
  mask?: ReferenceImage;
}

export interface GenerateVideoInput {
  prompt: string;
  /** Optional driving image (image-to-video). */
  image?: ReferenceImage;
  durationSeconds?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface GenerateVideoResult {
  /** Gemini video API is async; we return a job handle to poll. */
  jobId: string;
  status: "queued" | "generating" | "ready" | "failed";
  url?: string;
  model: string;
}

export interface Provider {
  name: string;
  generateText(input: GenerateTextInput, opts: ResolvedModel): Promise<GenerateTextResult>;
  generateImage(
    input: GenerateImageInput,
    opts: ResolvedModel,
  ): Promise<GenerateImageResult>;
  editImage(input: EditImageInput, opts: ResolvedModel): Promise<GenerateImageResult>;
  generateVideo(
    input: GenerateVideoInput,
    opts: ResolvedModel,
  ): Promise<GenerateVideoResult>;
  pollVideo(jobId: string, opts: ResolvedModel): Promise<GenerateVideoResult>;
}

/** A model selection resolved from `ai_settings` for a given task. */
export interface ResolvedModel {
  provider: string;
  model: string;
  temperature?: number;
  [key: string]: unknown;
}
