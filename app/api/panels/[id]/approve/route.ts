import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storyboardPanels } from '@/lib/db/schema';
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
    const [updated] = await db
      .update(storyboardPanels)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(storyboardPanels.id, id))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ panel: updated });
  } catch (error) {
    console.error('Approve panel error:', error);
    return NextResponse.json(
      { error: 'Failed to approve panel' },
      { status: 500 }
    );
  }
}
