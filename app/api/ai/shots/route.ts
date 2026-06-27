import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getProvider, resolveModel, resolveSystemPrompt } from "@/lib/ai";
import { db } from "@/lib/db";
import { scripts, shots } from "@/lib/db/schema";
import { requireProjectRole } from "@/lib/auth/roles";

const Body = z.object({
  projectId: z.string().uuid(),
  scriptId: z.string().uuid(),
  targetCount: z.number().int().min(4).max(40).default(16),
});

const SHOTS_SCHEMA = {
  type: "object",
  properties: {
    shots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sceneId: { type: "string" },
          description: { type: "string" },
          cameraDirection: { type: "string" },
        },
        required: ["description"],
      },
    },
  },
  required: ["shots"],
};

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });
  const { projectId, scriptId, targetCount } = parsed.data;

  try {
    await requireProjectRole(projectId, "editor");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const [script] = await db
    .select()
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .limit(1);
  if (!script || script.projectId !== projectId) {
    return new NextResponse("Script not found", { status: 404 });
  }

  const model = await resolveModel("shots", projectId);
  const systemPrompt = await resolveSystemPrompt("shots");
  const provider = getProvider(model);

  const result = await provider.generateText(
    {
      systemPrompt,
      prompt: `Break the following script into approximately ${targetCount} shots. Script JSON:\n${JSON.stringify(
        script.content,
      )}\n\nReturn JSON.`,
      responseSchema: SHOTS_SCHEMA,
    },
    model,
  );

  const list =
    (result.json as { shots?: Array<{ description: string; cameraDirection?: string; sceneId?: string }> })
      ?.shots ?? [];

  if (list.length > 0) {
    await db.insert(shots).values(
      list.map((s, i) => ({
        scriptId,
        order: i,
        description: s.description,
        cameraDirection: s.cameraDirection,
        sceneId: s.sceneId,
      })),
    );
  }

  return NextResponse.json({ shots: list, model: result.model });
}
