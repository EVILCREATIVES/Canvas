import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  projects,
  scripts,
  shotLists,
  characters,
  locations,
  styleSettings,
  storyboards,
  storyboardPanels,
} from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ScriptViewer from '@/components/script/ScriptViewer';
import ShotListViewer from '@/components/script/ShotListViewer';
import CharacterCard from '@/components/characters/CharacterCard';
import StyleSettingsPanel from '@/components/style/StyleSettingsPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function loadProject(id: string) {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!project) return null;

    const [script] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.projectId, id))
      .orderBy(desc(scripts.createdAt))
      .limit(1);

    const shots = script
      ? await db
          .select()
          .from(shotLists)
          .where(eq(shotLists.scriptId, script.id))
          .orderBy(asc(shotLists.orderIndex))
      : [];

    const chars = await db
      .select()
      .from(characters)
      .where(eq(characters.projectId, id));

    const locs = await db
      .select()
      .from(locations)
      .where(eq(locations.projectId, id));

    const [style] = await db
      .select()
      .from(styleSettings)
      .where(eq(styleSettings.projectId, id))
      .limit(1);

    const [storyboard] = await db
      .select()
      .from(storyboards)
      .where(eq(storyboards.projectId, id))
      .orderBy(desc(storyboards.createdAt))
      .limit(1);

    const panels = storyboard
      ? await db
          .select()
          .from(storyboardPanels)
          .where(eq(storyboardPanels.storyboardId, storyboard.id))
          .orderBy(asc(storyboardPanels.orderIndex))
      : [];

    return { project, script, shots, chars, locs, style, panels };
  } catch {
    return null;
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await auth();
  const data = await loadProject(id);

  if (!data) notFound();

  const { project, script, shots, chars, locs, style, panels } = data;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-zinc-400 mt-1">{project.description}</p>
          )}
        </div>
        <Link href={`/projects/${id}/canvas`}>
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Open Canvas
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="canvas">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="script">Script</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
        </TabsList>

        <TabsContent value="canvas">
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-5xl mb-4">🎨</div>
              <p className="text-zinc-300 font-medium">
                The infinite canvas lives in its own full-screen view.
              </p>
              <Link href={`/projects/${id}/canvas`}>
                <Button className="mt-4">Open Canvas</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script">
          <ScriptViewer content={script?.content ?? ''} editable={false} />
          <div className="mt-6">
            <ShotListViewer shots={shots} />
          </div>
        </TabsContent>

        <TabsContent value="characters">
          {chars.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-zinc-500">
                No characters yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chars.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locations">
          {locs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-zinc-500">
                No locations yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locs.map((l) => (
                <Card key={l.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{l.name}</h3>
                    <p className="text-sm text-zinc-400">{l.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="style">
          <StyleSettingsPanel
            projectId={id}
            initial={{
              style: style?.style ?? '',
              description: style?.description ?? '',
              referenceImages: style?.referenceImages ?? [],
            }}
          />
        </TabsContent>

        <TabsContent value="storyboard">
          {panels.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-zinc-500">
                No storyboard panels yet. Generate them from the canvas.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {panels.map((panel, idx) => (
                <div
                  key={panel.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden"
                >
                  <div className="aspect-video bg-zinc-950 flex items-center justify-center">
                    {panel.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={panel.imageUrl}
                        alt={`Panel ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🎨</span>
                    )}
                  </div>
                  <div className="p-2 text-xs text-zinc-400">
                    #{idx + 1} · {panel.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
