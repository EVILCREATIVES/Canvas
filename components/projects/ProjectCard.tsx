'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export interface ProjectCardData {
  id: string;
  name: string;
  description: string | null;
  updatedAt: Date | string;
  collaboratorCount?: number;
}

export default function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full transition-colors hover:border-indigo-500 cursor-pointer">
        <CardHeader>
          <CardTitle className="line-clamp-1">{project.name}</CardTitle>
          <p className="text-sm text-zinc-400 line-clamp-2 min-h-[2.5rem]">
            {project.description || 'No description'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="aspect-video rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl">
            🎬
          </div>
        </CardContent>
        <CardFooter className="justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(project.updatedAt)}
          </span>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {project.collaboratorCount ?? 1}
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
