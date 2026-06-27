import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";

const Create = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  body: z.string().min(1),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export async function GET() {
  // List is public — only published posts are returned to non-admins.
  const session = await import("@/lib/auth").then((m) => m.auth());
  const isAdmin = session?.user?.role === "admin";
  const q = db.select().from(blogPosts);
  const rows = isAdmin ? await q : await q.where(eq(blogPosts.status, "published"));
  return NextResponse.json({ posts: rows });
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const parsed = Create.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });
  const [row] = await db
    .insert(blogPosts)
    .values({
      authorId: admin.id,
      ...parsed.data,
      publishedAt: parsed.data.status === "published" ? new Date() : null,
    })
    .returning({ id: blogPosts.id, slug: blogPosts.slug });
  return NextResponse.json(row, { status: 201 });
}

const Update = Create.partial().extend({ id: z.string().uuid() });

export async function PUT(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const parsed = Update.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });
  const { id, ...patch } = parsed.data;
  await db
    .update(blogPosts)
    .set({
      ...patch,
      ...(patch.status === "published" ? { publishedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));
  return NextResponse.json({ ok: true });
}
