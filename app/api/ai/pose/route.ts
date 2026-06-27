import { NextResponse } from "next/server";
import { z } from "zod";

import { getProvider, resolveModel, resolveSystemPrompt } from "@/lib/ai";
import { requireProjectRole } from "@/lib/auth/roles";

const Body = z.object({
  projectId: z.string().uuid(),
  characterName: z.string().min(1),
  description: z.string().min(1),
  references: z
    .array(z.object({ source: z.string(), mime: z.string().optional() }))
    .optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });
  const { projectId, characterName, description, references } = parsed.data;

  try {
    await requireProjectRole(projectId, "editor");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const model = await resolveModel("pose", projectId);
  const systemPrompt = await resolveSystemPrompt("pose");
  const provider = getProvider(model);

  const result = await provider.generateImage(
    {
      prompt: `${systemPrompt}\n\nCharacter: ${characterName}\nDescription: ${description}`,
      references,
      aspectRatio: "16:9",
    },
    model,
  );
  return NextResponse.json({ images: result.images, model: result.model });
}
