"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

/**
 * TipTap-powered idea editor pinned to the left of the canvas.
 *
 * - Saves the editor JSON document to /api/projects/[id]/ideas on blur.
 * - "Expand into script" calls /api/ai/script which uses Gemini behind the
 *   provider abstraction and emits a structured script.
 */
export function LeftRailEditor({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "generating" | "error">(
    "idle",
  );
  const [scriptPreview, setScriptPreview] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Type your idea here…" }],
        },
      ],
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none flex-1 px-5 py-4 outline-none overflow-y-auto",
      },
    },
    onBlur: async ({ editor }) => {
      setStatus("saving");
      try {
        await fetch(`/api/projects/${projectId}/ideas`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: editor.getJSON() }),
        });
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    },
  });

  async function expandIntoScript() {
    if (!editor) return;
    setStatus("generating");
    setScriptPreview(null);
    try {
      const res = await fetch("/api/ai/script", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          idea: editor.getText(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { text } = (await res.json()) as { text: string };
      setScriptPreview(text);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <EditorContent editor={editor} />
      {scriptPreview ? (
        <div className="border-t border-canvas-border px-5 py-3 max-h-60 overflow-y-auto text-sm text-zinc-300 whitespace-pre-wrap">
          {scriptPreview}
        </div>
      ) : null}
      <div className="border-t border-canvas-border px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-500">
          {status === "saving"
            ? "Saving…"
            : status === "generating"
              ? "Generating script…"
              : status === "error"
                ? "Something went wrong"
                : "Saved"}
        </span>
        <button
          onClick={expandIntoScript}
          disabled={status === "generating"}
          className="rounded-rail bg-canvas-accent px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          Expand into script
        </button>
      </div>
    </div>
  );
}
