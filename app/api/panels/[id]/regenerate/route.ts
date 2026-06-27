import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storyboardPanels } from '@/lib/db/schema';
import { generateImage } from '@/lib/gemini';
import { getAdminSettings } from '@/lib/settings';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const [panel] = await db
      .select()
      .from(storyboardPanels)
      .where(eq(storyboardPanels.id, id))
      .limit(1);
    if (!panel) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const prompt = body.prompt || panel.prompt || '';

    await db
      .update(storyboardPanels)
      .set({ status: 'generating', prompt, updatedAt: new Date() })
      .where(eq(storyboardPanels.id, id));

    const settings = await getAdminSettings();
    const imageUrl = await generateImage(prompt, settings.imageModel);

    const [updated] = await db
      .update(storyboardPanels)
      .set({
        imageUrl: imageUrl ?? panel.imageUrl,
        status: imageUrl ? 'generated' : 'pending',
        updatedAt: new Date(),
      })
      .where(eq(storyboardPanels.id, id))
      .returning();

    return NextResponse.json({ panel: updated });
  } catch (error) {
    console.error('Regenerate panel error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate panel' },
      { status: 500 }
    );
  }
}
