import { NextResponse } from "next/server";
import { desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers, projects } from "@/lib/db/schema";

const CreateProject = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await db
    .selectDistinct({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .where(
      or(
        eq(projects.ownerId, session.user.id),
        eq(projectMembers.userId, session.user.id),
      ),
    )
    .orderBy(desc(projects.updatedAt));
  return NextResponse.json({ projects: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = CreateProject.safeParse(await req.json());
  if (!body.success) return NextResponse.json(body.error, { status: 400 });

  const [created] = await db
    .insert(projects)
    .values({
      ownerId: session.user.id,
      title: body.data.title,
      description: body.data.description,
    })
    .returning({ id: projects.id });

  await db.insert(projectMembers).values({
    projectId: created.id,
    userId: session.user.id,
    role: "owner",
    acceptedAt: new Date(),
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
