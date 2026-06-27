/**
 * Provider registry. The active provider is chosen by `ResolvedModel.provider`,
 * which itself comes from the `ai_settings` table — switching providers is a
 * config change, not a code change.
 */
import { GeminiProvider } from "./gemini";
import type { Provider, ResolvedModel } from "./types";

const REGISTRY: Record<string, Provider> = {
  gemini: GeminiProvider,
};

export function getProvider(opts: ResolvedModel): Provider {
  const p = REGISTRY[opts.provider];
  if (!p) throw new Error(`Unknown AI provider: ${opts.provider}`);
  return p;
}

export * from "./types";
export { resolveModel, resolveSystemPrompt } from "./settings";
