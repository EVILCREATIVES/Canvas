import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storyboardPanels } from '@/lib/db/schema';
import { generateVideo } from '@/lib/gemini';
import { getAdminSettings } from '@/lib/settings';
import { eq } from 'drizzle-orm';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const [panel] = await db
      .select()
      .from(storyboardPanels)
      .where(eq(storyboardPanels.id, id))
      .limit(1);
    if (!panel) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const settings = await getAdminSettings();
    const result = await generateVideo(
      panel.prompt ?? '',
      panel.imageUrl ?? undefined,
      settings.videoModel
    );

    const metadata = {
      ...(panel.metadata ?? {}),
      videoOperation: result?.operationName ?? null,
      videoUrl: result?.videoUrl ?? null,
    };

    await db
      .update(storyboardPanels)
      .set({ metadata, updatedAt: new Date() })
      .where(eq(storyboardPanels.id, id));

    return NextResponse.json({
      success: true,
      operationName: result?.operationName ?? null,
      videoUrl: result?.videoUrl ?? null,
    });
  } catch (error) {
    console.error('Generate video error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}
