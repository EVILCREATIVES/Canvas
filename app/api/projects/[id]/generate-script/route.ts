import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { scripts } from '@/lib/db/schema';
import { generateScript } from '@/lib/gemini';
import { getAdminSettings } from '@/lib/settings';

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
    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
    }

    const settings = await getAdminSettings();
    const content = await generateScript(
      idea,
      settings.modelName,
      settings.systemPrompt ?? undefined
    );

    const [script] = await db
      .insert(scripts)
      .values({
        projectId,
        content,
        generatedFromIdea: idea,
      })
      .returning();

    return NextResponse.json({ script: content, scriptId: script.id });
  } catch (error) {
    console.error('Generate script error:', error);
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}
