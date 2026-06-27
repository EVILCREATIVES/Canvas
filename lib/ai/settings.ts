/**
 * Resolves the AI model + system prompt to use for a given task by reading
 * `ai_settings` and `ai_rules` from the database. Admins edit these tables
 * via /admin/settings, so behaviour changes without a redeploy.
 */
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { aiRules, aiSettings } from "@/lib/db/schema";

import type { AiTask, ResolvedModel } from "./types";

const TASK_KEY: Record<AiTask, string> = {
  script: "model.script",
  shots: "model.shots",
  panel: "model.image",
  image: "model.image",
  pose: "model.pose",
  style: "model.style",
  video: "model.video",
};

const RULE_TARGET: Record<AiTask, (typeof aiRules.appliesTo.enumValues)[number]> = {
  script: "script",
  shots: "shot",
  panel: "panel",
  image: "panel",
  pose: "character",
  style: "style",
  video: "video",
};

const DEFAULTS: Record<AiTask, ResolvedModel> = {
  script: { provider: "gemini", model: "gemini-1.5-pro", temperature: 0.7 },
  shots: { provider: "gemini", model: "gemini-1.5-pro", temperature: 0.5 },
  panel: { provider: "gemini", model: "imagen-3.0-generate-002" },
  image: { provider: "gemini", model: "imagen-3.0-generate-002" },
  pose: { provider: "gemini", model: "imagen-3.0-generate-002" },
  style: { provider: "gemini", model: "imagen-3.0-generate-002" },
  video: { provider: "gemini", model: "veo-2.0-generate-001" },
};

export async function resolveModel(
  task: AiTask,
  projectId?: string,
): Promise<ResolvedModel> {
  const key = TASK_KEY[task];
  try {
    // Project override takes precedence over global setting.
    if (projectId) {
      const [row] = await db
        .select()
        .from(aiSettings)
        .where(
          and(
            eq(aiSettings.scope, "project"),
            eq(aiSettings.projectId, projectId),
            eq(aiSettings.key, key),
          ),
        )
        .limit(1);
      if (row) return { ...DEFAULTS[task], ...(row.value as ResolvedModel) };
    }
    const [row] = await db
      .select()
      .from(aiSettings)
      .where(
        and(
          eq(aiSettings.scope, "global"),
          isNull(aiSettings.projectId),
          eq(aiSettings.key, key),
        ),
      )
      .limit(1);
    if (row) return { ...DEFAULTS[task], ...(row.value as ResolvedModel) };
  } catch {
    // DB unavailable — fall back to compiled defaults so generation still works.
  }
  return DEFAULTS[task];
}

/**
 * Returns the combined system prompt for a task by concatenating all enabled
 * `ai_rules` that apply. Falls back to a sensible baseline if the DB is empty.
 */
export async function resolveSystemPrompt(task: AiTask): Promise<string> {
  const target = RULE_TARGET[task];
  const baseline = BASELINE_PROMPTS[task];
  try {
    const rows = await db
      .select()
      .from(aiRules)
      .where(and(eq(aiRules.appliesTo, target), eq(aiRules.enabled, true)));
    if (rows.length === 0) return baseline;
    return [baseline, ...rows.map((r) => r.systemPrompt)].filter(Boolean).join("\n\n");
  } catch {
    return baseline;
  }
}

const BASELINE_PROMPTS: Record<AiTask, string> = {
  script:
    "You are a screenwriter. Given a short idea, produce a structured shooting script as JSON with scenes and beats. Keep it cinematic, vivid, and concise.",
  shots:
    "You are a director of photography. Break the given script into a numbered shot list. Each shot should include a one-sentence description and a camera direction.",
  panel:
    "You are a storyboard artist. Generate a single panel image faithful to the shot, character descriptions, location, and style provided.",
  image:
    "You are a concept artist. Produce a high-quality image faithful to the prompt and style references.",
  pose:
    "Generate a clean character pose sheet showing the same character from front, side, three-quarter, and back views against a neutral background.",
  style:
    "Generate a style reference sheet capturing the requested mood, palette, lighting, and rendering technique.",
  video:
    "Animate the provided storyboard panel into a short cinematic clip preserving composition, character likeness, and style.",
};
