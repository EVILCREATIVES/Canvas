import { auth } from '@/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import ProjectCard from '@/components/projects/ProjectCard';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';

export const dynamic = 'force-dynamic';

async function getProjects(userId: string) {
  try {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, userId))
      .orderBy(desc(projects.updatedAt));
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const session = await auth();
  const userProjects = session?.user?.id
    ? await getProjects(session.user.id)
    : [];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Your storyboard projects
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {userProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-16 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-lg font-medium">No projects yet</h2>
          <p className="text-sm text-zinc-400 mt-1 mb-6">
            Create your first project to start storyboarding with AI.
          </p>
          <CreateProjectDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                updatedAt: project.updatedAt,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
