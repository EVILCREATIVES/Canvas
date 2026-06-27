import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('List blog posts error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { title, content, excerpt, coverImageUrl, status } = body;
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    const slug = body.slug ? slugify(body.slug) : slugify(title);
    const isPublished = status === 'published';

    const [post] = await db
      .insert(blogPosts)
      .values({
        title,
        slug,
        content,
        excerpt: excerpt ?? null,
        coverImageUrl: coverImageUrl ?? null,
        status: isPublished ? 'published' : 'draft',
        authorId: session.user.id,
        publishedAt: isPublished ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Create blog post error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
