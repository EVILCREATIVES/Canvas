/**
 * Role helpers used by server components and API routes.
 *
 * Roles operate on two levels:
 *   - Global:   users.role        ('admin' | 'user')
 *   - Project:  project_members.role ('owner' | 'editor' | 'viewer')
 */
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers, projects } from "@/lib/db/schema";

export type GlobalRole = "admin" | "user";
export type ProjectRole = "owner" | "editor" | "viewer";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

export async function getProjectRole(
  userId: string,
  projectId: string,
): Promise<ProjectRole | null> {
  const [project] = await db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) return null;
  if (project.ownerId === userId) return "owner";

  const [m] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    )
    .limit(1);
  return m?.role ?? null;
}

const RANK: Record<ProjectRole, number> = { viewer: 1, editor: 2, owner: 3 };

export async function requireProjectRole(projectId: string, min: ProjectRole) {
  const user = await requireUser();
  const role = await getProjectRole(user.id, projectId);
  if (!role || RANK[role] < RANK[min]) {
    throw new Response("Forbidden", { status: 403 });
  }
  return { user, role };
}
