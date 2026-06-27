"use client";

import { useState, useTransition } from "react";

import type { AiRule, AiSetting } from "@/lib/db/schema";

const TASKS = [
  { key: "model.script", label: "Script generation" },
  { key: "model.shots", label: "Shot list" },
  { key: "model.image", label: "Panel / image" },
  { key: "model.pose", label: "Character pose sheet" },
  { key: "model.style", label: "Style reference" },
  { key: "model.video", label: "Video animation" },
];

export function AdminSettingsForm({
  settings,
  rules,
}: {
  settings: AiSetting[];
  rules: AiRule[];
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      TASKS.map((t) => {
        const s = settings.find((x) => x.key === t.key);
        return [t.key, JSON.stringify(s?.value ?? {}, null, 2)];
      }),
    ),
  );
  const [ruleState, setRuleState] = useState(rules);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function save() {
    start(async () => {
      const payload = {
        settings: TASKS.map((t) => {
          try {
            return { key: t.key, value: JSON.parse(values[t.key]) };
          } catch {
            return null;
          }
        }).filter(Boolean),
        rules: ruleState.map((r) => ({
          id: r.id,
          name: r.name,
          appliesTo: r.appliesTo,
          systemPrompt: r.systemPrompt,
          enabled: r.enabled,
        })),
      };
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <div className="mt-10 space-y-10">
      <div className="space-y-4">
        <h2 className="text-xl font-medium">Models per task</h2>
        {TASKS.map((t) => (
          <label key={t.key} className="block">
            <div className="text-sm text-zinc-400 mb-1">{t.label}</div>
            <textarea
              value={values[t.key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [t.key]: e.target.value }))
              }
              rows={4}
              className="w-full rounded-rail bg-canvas-bg border border-canvas-border px-3 py-2 font-mono text-xs"
            />
          </label>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-medium">System rules</h2>
        {ruleState.length === 0 ? (
          <p className="text-zinc-500 text-sm">No rules defined yet.</p>
        ) : (
          ruleState.map((r, i) => (
            <div
              key={r.id}
              className="rounded-rail border border-canvas-border bg-canvas-panel p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <input
                  value={r.name}
                  onChange={(e) =>
                    setRuleState((s) =>
                      s.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                    )
                  }
                  className="bg-transparent outline-none font-medium flex-1"
                />
                <select
                  value={r.appliesTo}
                  onChange={(e) =>
                    setRuleState((s) =>
                      s.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              appliesTo: e.target
                                .value as AiRule["appliesTo"],
                            }
                          : x,
                      ),
                    )
                  }
                  className="bg-canvas-bg border border-canvas-border rounded px-2 py-1 text-sm"
                >
                  {[
                    "script",
                    "shot",
                    "panel",
                    "video",
                    "style",
                    "character",
                    "location",
                  ].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <label className="text-xs flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) =>
                      setRuleState((s) =>
                        s.map((x, j) =>
                          j === i ? { ...x, enabled: e.target.checked } : x,
                        ),
                      )
                    }
                  />
                  enabled
                </label>
              </div>
              <textarea
                value={r.systemPrompt}
                onChange={(e) =>
                  setRuleState((s) =>
                    s.map((x, j) =>
                      j === i ? { ...x, systemPrompt: e.target.value } : x,
                    ),
                  )
                }
                rows={4}
                className="w-full rounded-rail bg-canvas-bg border border-canvas-border px-3 py-2 text-sm"
              />
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-rail bg-canvas-accent px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {savedAt && <span className="text-xs text-zinc-500">Saved at {savedAt}</span>}
      </div>
    </div>
  );
}
