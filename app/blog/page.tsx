import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getPosts() {
  try {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold">Canvas</span>
        </Link>
        <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100">
          Log in
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Blog</h1>
        <p className="text-zinc-400 mb-10">
          News, tips, and stories from the Canvas team.
        </p>

        {posts.length === 0 ? (
          <p className="text-zinc-500">No posts published yet.</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-indigo-500/50">
                  {post.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full aspect-video object-cover rounded-lg mb-4"
                    />
                  )}
                  <h2 className="text-xl font-semibold group-hover:text-indigo-400 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-zinc-400 mt-2">{post.excerpt}</p>
                  )}
                  {post.publishedAt && (
                    <p className="text-xs text-zinc-500 mt-3">
                      {formatDate(post.publishedAt)}
                    </p>
                  )}
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
