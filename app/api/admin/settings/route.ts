import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { adminSettings } from '@/lib/db/schema';
import { getAdminSettings } from '@/lib/settings';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const settings = await getAdminSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get admin settings error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const values = {
      modelName: body.modelName ?? 'gemini-2.0-flash',
      imageModel: body.imageModel ?? 'imagen-3.0-generate-002',
      videoModel: body.videoModel ?? 'veo-2.0-generate-001',
      aiRules: body.aiRules ?? null,
      systemPrompt: body.systemPrompt ?? null,
      updatedAt: new Date(),
    };

    const [existing] = await db.select().from(adminSettings).limit(1);

    let saved;
    if (existing) {
      [saved] = await db
        .update(adminSettings)
        .set(values)
        .where(eq(adminSettings.id, existing.id))
        .returning();
    } else {
      [saved] = await db.insert(adminSettings).values(values).returning();
    }

    return NextResponse.json({ settings: saved });
  } catch (error) {
    console.error('Update admin settings error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
