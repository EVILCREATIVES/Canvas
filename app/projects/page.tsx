import Link from "next/link";
import { desc, eq, or } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers, projects } from "@/lib/db/schema";

import { NewProjectForm } from "./new-project-form";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sign in to see your projects</h1>
        <p className="mt-3 text-zinc-400">
          Canvas uses sign-in to attribute scripts, panels and edits across your
          team.
        </p>
      </section>
    );
  }

  const rows = await db
    .selectDistinct({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .where(
      or(
        eq(projects.ownerId, session.user.id),
        eq(projectMembers.userId, session.user.id),
      ),
    )
    .orderBy(desc(projects.updatedAt))
    .limit(100);

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
      </div>
      <NewProjectForm />
      {rows.length === 0 ? (
        <p className="text-zinc-400 mt-10">
          No projects yet. Create one above to open an infinite canvas.
        </p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="block rounded-rail border border-canvas-border bg-canvas-panel p-5 hover:border-canvas-accent transition"
              >
                <div className="font-medium text-lg">{p.title}</div>
                {p.description ? (
                  <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                    {p.description}
                  </p>
                ) : null}
                <div className="mt-3 text-xs text-zinc-500">
                  Updated {new Date(p.updatedAt).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
