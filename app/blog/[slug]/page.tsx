import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 prose prose-invert">
      <h1>{post.title}</h1>
      {post.publishedAt && (
        <p className="text-sm text-zinc-500">
          {new Date(post.publishedAt).toLocaleDateString()}
        </p>
      )}
      <MDXRemote source={post.body} />
    </article>
  );
}
