import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storyboardPanels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
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
    return NextResponse.json({ panel });
  } catch (error) {
    console.error('Get panel error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const [updated] = await db
      .update(storyboardPanels)
      .set({
        prompt: body.prompt,
        imageUrl: body.imageUrl,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(storyboardPanels.id, id))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ panel: updated });
  } catch (error) {
    console.error('Update panel error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
