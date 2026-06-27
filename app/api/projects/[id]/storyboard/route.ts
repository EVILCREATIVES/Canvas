import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storyboards, storyboardPanels } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: projectId } = await params;
  try {
    const [storyboard] = await db
      .select()
      .from(storyboards)
      .where(eq(storyboards.projectId, projectId))
      .orderBy(desc(storyboards.createdAt))
      .limit(1);

    if (!storyboard) {
      return NextResponse.json({ storyboardId: null, panels: [] });
    }

    const panels = await db
      .select()
      .from(storyboardPanels)
      .where(eq(storyboardPanels.storyboardId, storyboard.id))
      .orderBy(asc(storyboardPanels.orderIndex));

    return NextResponse.json({ storyboardId: storyboard.id, panels });
  } catch (error) {
    console.error('Get storyboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load storyboard' },
      { status: 500 }
    );
  }
}
