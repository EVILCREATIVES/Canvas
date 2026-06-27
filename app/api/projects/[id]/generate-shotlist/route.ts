import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { scripts, shotLists } from '@/lib/db/schema';
import { generateShotList } from '@/lib/gemini';
import { getAdminSettings } from '@/lib/settings';
import { eq, desc } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: projectId } = await params;
  try {
    const body = await request.json();
    let { script, scriptId } = body as { script?: string; scriptId?: string };

    if (!script) {
      const [latest] = await db
        .select()
        .from(scripts)
        .where(eq(scripts.projectId, projectId))
        .orderBy(desc(scripts.createdAt))
        .limit(1);
      script = latest?.content;
      scriptId = scriptId ?? latest?.id;
    }

    if (!script) {
      return NextResponse.json(
        { error: 'No script available' },
        { status: 400 }
      );
    }

    const settings = await getAdminSettings();
    const items = await generateShotList(script, settings.modelName);

    if (scriptId && items.length > 0) {
      await db
        .insert(shotLists)
        .values(
          items.map((item, index) => ({
            scriptId: scriptId as string,
            orderIndex: index,
            sceneNumber: item.sceneNumber ?? String(index + 1),
            location: item.location ?? null,
            timeOfDay: item.timeOfDay ?? null,
            action: item.action ?? null,
            dialogue: item.dialogue ?? null,
            notes: item.notes ?? null,
          }))
        );
    }

    return NextResponse.json({ shotList: items });
  } catch (error) {
    console.error('Generate shot list error:', error);
    return NextResponse.json(
      { error: 'Failed to generate shot list' },
      { status: 500 }
    );
  }
}
