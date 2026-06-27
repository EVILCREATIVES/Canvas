import { desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-2xl font-semibold">Admin only</h1>
      </section>
    );
  }
  const posts = await db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.updatedAt))
    .limit(50);

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Blog posts</h1>
      <p className="mt-2 text-zinc-400 text-sm">
        Posts are stored in <code>blog_posts</code>. Create via{" "}
        <code>POST /api/blog</code> with{" "}
        <code>{`{ slug, title, body, status }`}</code>.
      </p>
      <ul className="mt-8 divide-y divide-canvas-border">
        {posts.map((p) => (
          <li key={p.id} className="py-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                /{p.slug} · {p.status}
              </div>
            </div>
            <span className="text-xs text-zinc-500">
              {new Date(p.updatedAt).toLocaleDateString()}
            </span>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="py-6 text-zinc-500 text-sm">No posts yet.</li>
        )}
      </ul>
    </section>
  );
}
