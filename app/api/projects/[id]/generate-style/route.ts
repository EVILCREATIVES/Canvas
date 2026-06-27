import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { styleSettings } from '@/lib/db/schema';
import { generateStyleDescription } from '@/lib/gemini';
import { getAdminSettings } from '@/lib/settings';
import { eq } from 'drizzle-orm';

async function upsertStyle(
  projectId: string,
  values: {
    style?: string | null;
    description?: string | null;
    referenceImages?: string[];
  }
) {
  const [existing] = await db
    .select()
    .from(styleSettings)
    .where(eq(styleSettings.projectId, projectId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(styleSettings)
      .set({
        style: values.style ?? existing.style,
        description: values.description ?? existing.description,
        referenceImages: values.referenceImages ?? existing.referenceImages,
        updatedAt: new Date(),
      })
      .where(eq(styleSettings.projectId, projectId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(styleSettings)
    .values({
      projectId,
      style: values.style ?? null,
      description: values.description ?? null,
      referenceImages: values.referenceImages ?? [],
    })
    .returning();
  return created;
}

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
    const { idea } = await request.json();
    if (!idea) {
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
    }
    const settings = await getAdminSettings();
    const description = await generateStyleDescription(
      idea,
      settings.modelName
    );
    await upsertStyle(projectId, { description });
    return NextResponse.json({ style: description });
  } catch (error) {
    console.error('Generate style error:', error);
    return NextResponse.json(
      { error: 'Failed to generate style' },
      { status: 500 }
    );
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
  const { id: projectId } = await params;
  try {
    const { style, description, referenceImages } = await request.json();
    const updated = await upsertStyle(projectId, {
      style,
      description,
      referenceImages,
    });
    return NextResponse.json({ styleSettings: updated });
  } catch (error) {
    console.error('Update style error:', error);
    return NextResponse.json(
      { error: 'Failed to update style' },
      { status: 500 }
    );
  }
}
