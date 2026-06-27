import { NextResponse } from "next/server";
import { z } from "zod";

import { getProvider, resolveModel, resolveSystemPrompt } from "@/lib/ai";
import { db } from "@/lib/db";
import { scripts } from "@/lib/db/schema";
import { requireProjectRole } from "@/lib/auth/roles";

const Body = z.object({
  projectId: z.string().uuid(),
  idea: z.string().min(1).max(20_000),
  save: z.boolean().default(true),
});

const SCRIPT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    logline: { type: "string" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          beats: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                dialogue: { type: "string" },
              },
              required: ["description"],
            },
          },
        },
        required: ["heading", "beats"],
      },
    },
  },
  required: ["title", "scenes"],
};

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });
  const { projectId, idea, save } = parsed.data;

  try {
    await requireProjectRole(projectId, "editor");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const model = await resolveModel("script", projectId);
  const systemPrompt = await resolveSystemPrompt("script");
  const provider = getProvider(model);

  const result = await provider.generateText(
    {
      systemPrompt,
      prompt: `Idea:\n${idea}\n\nReturn a structured script as JSON.`,
      responseSchema: SCRIPT_SCHEMA,
    },
    model,
  );

  if (save && result.json) {
    await db.insert(scripts).values({
      projectId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: result.json as any,
      model: result.model,
    });
  }

  return NextResponse.json({
    text: result.text,
    script: result.json,
    model: result.model,
  });
}
