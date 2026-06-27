import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storyboards, storyboardPanels } from '@/lib/db/schema';
import {
  generateStoryboardPrompts,
  generateImage,
  type ShotListItem,
} from '@/lib/gemini';
import { getAdminSettings } from '@/lib/settings';
import { eq, asc } from 'drizzle-orm';

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
    const { shotList, style } = (await request.json()) as {
      shotList: ShotListItem[];
      style: string;
    };

    if (!Array.isArray(shotList) || shotList.length === 0) {
      return NextResponse.json(
        { error: 'A shot list is required' },
        { status: 400 }
      );
    }

    const settings = await getAdminSettings();

    let prompts = await generateStoryboardPrompts(
      shotList,
      style || '',
      settings.modelName
    );

    // Fall back to action lines if the model didn't return prompts.
    if (prompts.length === 0) {
      prompts = shotList.map(
        (shot) => `${shot.action || shot.location || 'A cinematic shot'}. Style: ${style}`
      );
    }

    const [storyboard] = await db
      .insert(storyboards)
      .values({ projectId, name: 'Storyboard', status: 'draft' })
      .returning();

    const inserted = await db
      .insert(storyboardPanels)
      .values(
        prompts.map((prompt, index) => ({
          storyboardId: storyboard.id,
          orderIndex: index,
          prompt,
          status: 'pending' as const,
        }))
      )
      .returning();

    // Best-effort image generation. Failures leave panels as pending so they
    // can be regenerated later.
    await Promise.all(
      inserted.map(async (panel) => {
        const imageUrl = await generateImage(
          panel.prompt ?? '',
          settings.imageModel
        );
        if (imageUrl) {
          await db
            .update(storyboardPanels)
            .set({ imageUrl, status: 'generated', updatedAt: new Date() })
            .where(eq(storyboardPanels.id, panel.id));
        }
      })
    );

    const panels = await db
      .select()
      .from(storyboardPanels)
      .where(eq(storyboardPanels.storyboardId, storyboard.id))
      .orderBy(asc(storyboardPanels.orderIndex));

    return NextResponse.json({ storyboardId: storyboard.id, panels });
  } catch (error) {
    console.error('Generate storyboard error:', error);
    return NextResponse.json(
      { error: 'Failed to generate storyboard' },
      { status: 500 }
    );
  }
}
