"use client";

import dynamic from "next/dynamic";

import { LeftRailEditor } from "@/components/LeftRailEditor";

// tldraw is heavy and only renders client-side.
const InfiniteCanvas = dynamic(
  () => import("@/components/InfiniteCanvas").then((m) => m.InfiniteCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Loading canvas…
      </div>
    ),
  },
);

export function ProjectWorkspace({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  return (
    <div className="flex h-[calc(100vh-65px)] w-full p-4 gap-4">
      <aside className="w-[380px] shrink-0 rounded-rail bg-canvas-panel border border-canvas-border overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-canvas-border">
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            Idea editor
          </div>
          <div className="font-medium mt-0.5 truncate">{title}</div>
        </div>
        <LeftRailEditor projectId={projectId} />
      </aside>
      <section className="flex-1 rounded-rail bg-canvas-panel border border-canvas-border overflow-hidden flex">
        <InfiniteCanvas projectId={projectId} />
      </section>
    </div>
  );
}
