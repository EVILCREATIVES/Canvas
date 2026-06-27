import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const posts = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published")))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(50);

  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      {posts.length === 0 ? (
        <p className="mt-6 text-zinc-400">No posts yet.</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/blog/${p.slug}`}
                className="block rounded-rail border border-canvas-border bg-canvas-panel p-5 hover:border-canvas-accent"
              >
                <div className="text-lg font-medium">{p.title}</div>
                {p.excerpt && (
                  <p className="mt-1 text-sm text-zinc-400">{p.excerpt}</p>
                )}
                <div className="mt-2 text-xs text-zinc-500">
                  {p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString()
                    : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
