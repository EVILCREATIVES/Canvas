import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getProvider, resolveModel, resolveSystemPrompt } from "@/lib/ai";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { requireProjectRole } from "@/lib/auth/roles";

const StartBody = z.object({
  projectId: z.string().uuid(),
  panelId: z.string().uuid().optional(),
  storyboardId: z.string().uuid().optional(),
  prompt: z.string().min(1).max(20_000),
  image: z.object({ source: z.string(), mime: z.string().optional() }).optional(),
  durationSeconds: z.number().int().min(2).max(20).default(4),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
});

/** Start a video generation job. */
export async function POST(req: Request) {
  const parsed = StartBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });
  const { projectId, panelId, storyboardId, prompt, image, durationSeconds, aspectRatio } =
    parsed.data;

  try {
    await requireProjectRole(projectId, "editor");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const model = await resolveModel("video", projectId);
  const systemPrompt = await resolveSystemPrompt("video");
  const provider = getProvider(model);

  const result = await provider.generateVideo(
    {
      prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
      image,
      durationSeconds,
      aspectRatio,
    },
    model,
  );

  const [row] = await db
    .insert(videos)
    .values({
      projectId,
      panelId,
      storyboardId,
      status: result.status,
      model: result.model,
      jobId: result.jobId,
    })
    .returning({ id: videos.id });

  return NextResponse.json({ id: row.id, jobId: result.jobId, status: result.status });
}

/** Poll an existing job. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("id");
  if (!videoId) return new NextResponse("Missing id", { status: 400 });

  const [row] = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
  if (!row) return new NextResponse("Not found", { status: 404 });

  try {
    await requireProjectRole(row.projectId, "viewer");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  if (row.status === "ready" || row.status === "failed") {
    return NextResponse.json(row);
  }
  if (!row.jobId || !row.model) return NextResponse.json(row);

  const model = await resolveModel("video", row.projectId);
  const provider = getProvider(model);
  const poll = await provider.pollVideo(row.jobId, { ...model, model: row.model });

  await db
    .update(videos)
    .set({ status: poll.status, url: poll.url ?? row.url })
    .where(eq(videos.id, videoId));
  return NextResponse.json({ ...row, status: poll.status, url: poll.url ?? row.url });
}
