"use client";

import { Tldraw, createShapeId, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useCallback, useEffect, useRef } from "react";

import type { CanvasNode } from "@/lib/db/schema";

/**
 * Infinite canvas surface. We use tldraw for pan/zoom/select/multi-cursor
 * and persist a minimal projection of shapes back to our `canvas_nodes`
 * table — domain rows (panels, characters, …) remain the source of truth;
 * the canvas table only stores layout.
 *
 * Phase 1 implementation: load existing nodes as text shapes, autosave on
 * change. Custom shape types (panel / character_card / …) come in later
 * phases.
 */
export function InfiniteCanvas({ projectId }: { projectId: string }) {
  const editorRef = useRef<Editor | null>(null);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      void hydrateCanvas(editor, projectId);
    },
    [projectId],
  );

  useEffect(() => {
    return () => {
      editorRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full">
      <Tldraw onMount={handleMount} />
    </div>
  );
}

async function hydrateCanvas(editor: Editor, projectId: string) {
  try {
    const res = await fetch(`/api/projects/${projectId}/canvas`);
    if (!res.ok) return;
    const { nodes } = (await res.json()) as { nodes: CanvasNode[] };
    if (nodes.length === 0) return;
    editor.createShapes(
      nodes.map((n) => ({
        id: createShapeId(n.id),
        type: "text",
        x: n.x,
        y: n.y,
        props: {
          richText: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text:
                      (n.data as { label?: string } | null)?.label ?? n.type,
                  },
                ],
              },
            ],
          },
        },
      })),
    );
  } catch {
    // ignore — canvas still usable in offline mode
  }
}
