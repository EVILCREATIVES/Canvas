# Canvas

A collaborative production canvas for storytellers — an infinite, multiplayer
canvas with an AI script-to-storyboard-to-video pipeline.

> Drop in an idea. Canvas turns it into a script, breaks it into a shot list,
> designs characters / locations / styles, generates a 12–16 panel storyboard,
> and animates approved frames into video.

## Stack

| Layer        | Choice                                                |
| ------------ | ----------------------------------------------------- |
| Framework    | Next.js 15 (App Router) + TypeScript                  |
| Database     | Neon (Postgres) + Drizzle ORM                         |
| Auth         | Auth.js v5 (email magic link, Google OAuth)           |
| AI providers | Gemini 1.5 / 3.5 (text), Imagen 3 (image), Veo (video) |
| Canvas       | `tldraw` (infinite canvas, pan/zoom, multi-cursor)    |
| Text editor  | TipTap (ProseMirror)                                  |
| Realtime     | Liveblocks (one room per project)                     |
| Storage      | Vercel Blob                                           |
| Blog         | DB-backed MDX rendered by `next-mdx-remote`           |
| Deploy       | Vercel                                                |

The AI provider is abstracted behind a `Provider` interface
(`lib/ai/types.ts`). The model used for each task (script / shots / image /
pose / style / video) is read at request time from the `ai_settings` table —
so admins can switch models in `/admin/settings` with **no redeploy**.

## Quick start

```bash
cp .env.example .env.local
# fill in DATABASE_URL, GEMINI_API_KEY, AUTH_SECRET, etc.

npm install
npm run db:migrate     # apply lib/db/migrations/*.sql to Neon
npm run dev            # http://localhost:3000
```

### Required environment variables

| Variable                            | Used for                                 |
| ----------------------------------- | ---------------------------------------- |
| `DATABASE_URL`                      | Neon Postgres connection                 |
| `GEMINI_API_KEY`                    | All AI calls (text / image / video)      |
| `AUTH_SECRET`                       | Auth.js session encryption                |
| `AUTH_URL`                          | Public origin (set in Vercel)            |
| `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`| Magic-link sign-in (optional)            |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth (optional)               |
| `BLOB_READ_WRITE_TOKEN`             | Reference / generated image uploads      |
| `LIVEBLOCKS_SECRET_KEY`, `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | Real-time collab (optional) |

On Vercel: add the same variables in **Project → Settings → Environment
Variables**. The Gemini key is the one referenced in the original brief.

## Repository layout

```
app/                      Next.js routes
  page.tsx                Landing page
  projects/               Project list + new-project form
  projects/[id]/          Canvas workspace (left rail editor + tldraw)
  admin/                  Admin home
  admin/settings/         AI model & rule editor (no-code config)
  admin/blog/             Blog management
  blog/                   Public blog index + post pages
  api/auth/[...nextauth]  Auth.js route handlers
  api/projects/           Projects CRUD + canvas + ideas sub-routes
  api/ai/script           Idea → structured script
  api/ai/shots            Script → shot list
  api/ai/image            Text/reference → image (panel / style / generic)
  api/ai/pose             Character → pose sheet
  api/ai/video            Panel → video (long-running, poll-able)
  api/admin/settings      Read/update ai_settings + ai_rules
  api/blog                Read/write blog_posts

components/               Client-side UI
  ProjectWorkspace.tsx    Two-pane layout
  LeftRailEditor.tsx      TipTap editor + "Expand into script"
  InfiniteCanvas.tsx      tldraw mount + canvas-node hydration

lib/
  ai/                     Provider interface, GeminiProvider, settings resolver
  auth/                   Auth.js config + role helpers
  db/                     Drizzle schema, Neon client, migrations
  realtime/               Liveblocks wiring
```

## Data model

Fully relational, with real foreign keys. Highlights:

- `users` / `accounts` / `sessions` / `verification_tokens` — Auth.js core
- `projects` + `project_members` (roles: owner / editor / viewer)
- `ideas` → `scripts` → `shots` chain
- `characters`, `locations`, `styles` (self-referencing `parent_style_id`)
- `storyboards` → `panels` → `panel_versions` (regeneration history)
- `videos` (async Gemini jobs with `job_id` for polling)
- `assets` + `asset_links` — a single image can be referenced by character,
  location, style, panel, or shot without duplication
- `canvas_nodes` + `canvas_edges` — layout layer; the visual position of a
  panel is stored *separately* from the panel data itself
- `ai_settings` + `ai_rules` — admin-editable configuration the AI provider
  reads at request time

See `lib/db/schema.ts` for the full Drizzle definition and
`lib/db/migrations/0000_initial.sql` for the matching SQL.

## Roles

Two layers, as agreed in the brief:

- **Global** (`users.role`): `admin` | `user`. Only admins see `/admin/*`.
- **Per-project** (`project_members.role`): `owner` | `editor` | `viewer`.
  Enforced by `lib/auth/roles.ts#requireProjectRole` on every API call.

## Phase status

| Phase | Scope                                              | Status |
| ----- | -------------------------------------------------- | ------ |
| 0     | Scaffolding, DB, Auth, env wiring                  | ✅     |
| 1     | Projects + canvas + left rail TipTap editor       | ✅     |
| 2     | Script + shot list endpoints (Gemini)             | ✅     |
| 3     | Character / location / style endpoints + pose API | ✅ API |
| 4     | Storyboard generation                              | ✅ API |
| 5     | Panel → video (async, polled)                     | ✅ API |
| 6     | Liveblocks rooms + project member invitations     | 🟡 wiring in place |
| 7     | Admin no-code AI settings + rules editor          | ✅     |
| 8     | DB-backed MDX blog                                 | ✅     |
| 9     | Polish: activity log, exports, rate-limits         | ⏳     |

UI for phases 3 and 4 still needs the in-canvas card components — the API,
storage, and DB shape are in place so wiring them up is layout work.

## Useful scripts

```bash
npm run dev          # local dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run db:generate  # generate Drizzle migration from schema.ts
npm run db:migrate   # run pending migrations
npm run db:studio    # Drizzle Studio
```
