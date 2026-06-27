import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { requireProjectRole } from "@/lib/auth/roles";

const Body = z.object({ content: z.unknown() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let user;
  try {
    ({ user } = await requireProjectRole(id, "editor"));
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });

  const [row] = await db
    .insert(ideas)
    .values({
      projectId: id,
      authorId: user.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: parsed.data.content as any,
    })
    .returning({ id: ideas.id });
  return NextResponse.json({ id: row.id }, { status: 201 });
}
