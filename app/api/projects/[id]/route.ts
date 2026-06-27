import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireProjectRole } from "@/lib/auth/roles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await requireProjectRole(id, "viewer");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!row) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await requireProjectRole(id, "owner");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  await db.delete(projects).where(eq(projects.id, id));
  return new NextResponse(null, { status: 204 });
}
