import { NextResponse } from "next/server";
import { z } from "zod";

import { getProvider, resolveModel, resolveSystemPrompt } from "@/lib/ai";
import type { AiTask } from "@/lib/ai/types";
import { requireProjectRole } from "@/lib/auth/roles";

const Body = z.object({
  projectId: z.string().uuid(),
  task: z.enum(["panel", "image", "pose", "style"]).default("image"),
  prompt: z.string().min(1).max(20_000),
  references: z
    .array(z.object({ source: z.string(), mime: z.string().optional() }))
    .optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
  negativePrompt: z.string().optional(),
  count: z.number().int().min(1).max(4).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });
  const { projectId, task, prompt, references, aspectRatio, negativePrompt, count } =
    parsed.data;

  try {
    await requireProjectRole(projectId, "editor");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const model = await resolveModel(task as AiTask, projectId);
  const systemPrompt = await resolveSystemPrompt(task as AiTask);
  const provider = getProvider(model);

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const result = await provider.generateImage(
    { prompt: fullPrompt, references, aspectRatio, negativePrompt, count },
    model,
  );

  return NextResponse.json({ images: result.images, model: result.model });
}
