import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(
        and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published'))
      )
      .limit(1);
    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Get blog post error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
