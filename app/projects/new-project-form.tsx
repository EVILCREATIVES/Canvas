"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function NewProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        start(async () => {
          const res = await fetch("/api/projects", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title, description }),
          });
          if (res.ok) {
            const { id } = (await res.json()) as { id: string };
            router.push(`/projects/${id}`);
          }
        });
      }}
      className="flex gap-3 rounded-rail border border-canvas-border bg-canvas-panel p-4"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New project title"
        className="flex-1 bg-transparent outline-none px-3 py-2"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        className="flex-1 bg-transparent outline-none px-3 py-2 border-l border-canvas-border pl-3"
      />
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="rounded-rail bg-canvas-accent px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create"}
      </button>
    </form>
  );
}
