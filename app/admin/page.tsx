import Link from "next/link";

import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-2xl font-semibold">Admin only</h1>
        <p className="mt-3 text-zinc-400">
          You need an admin role to view this page.
        </p>
      </section>
    );
  }
  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/settings"
          className="rounded-rail border border-canvas-border bg-canvas-panel p-5 hover:border-canvas-accent"
        >
          <div className="font-medium text-lg">AI settings & rules</div>
          <p className="mt-1 text-sm text-zinc-400">
            Pick which Gemini model is used for each task, and tune system
            prompts. Changes apply instantly with no redeploy.
          </p>
        </Link>
        <Link
          href="/admin/blog"
          className="rounded-rail border border-canvas-border bg-canvas-panel p-5 hover:border-canvas-accent"
        >
          <div className="font-medium text-lg">Blog</div>
          <p className="mt-1 text-sm text-zinc-400">
            Author and publish posts stored in the database.
          </p>
        </Link>
      </div>
    </section>
  );
}
