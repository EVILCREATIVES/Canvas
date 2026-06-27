import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { aiRules, aiSettings } from "@/lib/db/schema";

const UpdateSetting = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

const UpdateRule = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  appliesTo: z.enum([
    "script",
    "shot",
    "panel",
    "video",
    "style",
    "character",
    "location",
  ]),
  systemPrompt: z.string(),
  enabled: z.boolean().default(true),
});

const Body = z.object({
  settings: z.array(UpdateSetting).default([]),
  rules: z.array(UpdateRule).default([]),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const [settings, rules] = await Promise.all([
    db.select().from(aiSettings).where(eq(aiSettings.scope, "global")),
    db.select().from(aiRules),
  ]);
  return NextResponse.json({ settings, rules });
}

export async function PUT(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 });
  const { settings, rules } = parsed.data;

  for (const s of settings) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = s.value as any;
    const existing = await db
      .select({ id: aiSettings.id })
      .from(aiSettings)
      .where(
        and(
          eq(aiSettings.scope, "global"),
          isNull(aiSettings.projectId),
          eq(aiSettings.key, s.key),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(aiSettings)
        .set({ value, updatedBy: admin.id, updatedAt: new Date() })
        .where(eq(aiSettings.id, existing[0].id));
    } else {
      await db.insert(aiSettings).values({
        scope: "global",
        key: s.key,
        value,
        updatedBy: admin.id,
      });
    }
  }

  for (const r of rules) {
    if (r.id) {
      await db
        .update(aiRules)
        .set({
          name: r.name,
          appliesTo: r.appliesTo,
          systemPrompt: r.systemPrompt,
          enabled: r.enabled,
          updatedBy: admin.id,
          updatedAt: new Date(),
        })
        .where(eq(aiRules.id, r.id));
    } else {
      await db.insert(aiRules).values({
        name: r.name,
        appliesTo: r.appliesTo,
        systemPrompt: r.systemPrompt,
        enabled: r.enabled,
        updatedBy: admin.id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
