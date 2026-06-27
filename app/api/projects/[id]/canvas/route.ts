import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { canvasEdges, canvasNodes } from "@/lib/db/schema";
import { requireProjectRole } from "@/lib/auth/roles";

const NodeInput = z.object({
  id: z.string().uuid().optional(),
  type: z.enum([
    "editor",
    "script",
    "shot",
    "panel",
    "character_card",
    "location_card",
    "style_card",
    "note",
  ]),
  x: z.number(),
  y: z.number(),
  w: z.number().optional(),
  h: z.number().optional(),
  refTable: z.string().optional(),
  refId: z.string().uuid().optional(),
  data: z.unknown().optional(),
});

const EdgeInput = z.object({
  id: z.string().uuid().optional(),
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  kind: z.string().optional(),
  data: z.unknown().optional(),
});

const Body = z.object({
  nodes: z.array(NodeInput).default([]),
  edges: z.array(EdgeInput).default([]),
  /** When true, replace all nodes/edges for the project; otherwise upsert. */
  replace: z.boolean().default(false),
});

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
  const [nodes, edges] = await Promise.all([
    db.select().from(canvasNodes).where(eq(canvasNodes.projectId, id)),
    db.select().from(canvasEdges).where(eq(canvasEdges.projectId, id)),
  ]);
  return NextResponse.json({ nodes, edges });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await requireProjectRole(id, "editor");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });
  const { nodes, edges, replace } = parsed.data;

  if (replace) {
    await db.delete(canvasEdges).where(eq(canvasEdges.projectId, id));
    await db.delete(canvasNodes).where(eq(canvasNodes.projectId, id));
  }
  if (nodes.length > 0) {
    await db.insert(canvasNodes).values(
      nodes.map((n) => ({
        ...(n.id ? { id: n.id } : {}),
        projectId: id,
        type: n.type,
        x: n.x,
        y: n.y,
        w: n.w ?? 320,
        h: n.h ?? 200,
        refTable: n.refTable,
        refId: n.refId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: n.data as any,
      })),
    );
  }
  if (edges.length > 0) {
    await db.insert(canvasEdges).values(
      edges.map((e) => ({
        ...(e.id ? { id: e.id } : {}),
        projectId: id,
        fromNodeId: e.fromNodeId,
        toNodeId: e.toNodeId,
        kind: e.kind,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: e.data as any,
      })),
    );
  }
  return NextResponse.json({ ok: true });
}
