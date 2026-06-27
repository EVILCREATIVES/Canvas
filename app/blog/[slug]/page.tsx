import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getPost(slug: string) {
  try {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
      .limit(1);
    return post ?? null;
  } catch {
    return null;
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold">Canvas</span>
        </Link>
        <Link
          href="/blog"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          All posts
        </Link>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-16">
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full aspect-video object-cover rounded-xl mb-8"
          />
        )}
        <h1 className="text-3xl md:text-4xl font-bold">{post.title}</h1>
        {post.publishedAt && (
          <p className="text-sm text-zinc-500 mt-3">
            {formatDate(post.publishedAt)}
          </p>
        )}
        <div className="prose prose-invert max-w-none mt-8 whitespace-pre-wrap text-zinc-300">
          {post.content}
        </div>
      </article>
    </div>
  );
}
