# Canvas

**An infinite collaborative canvas for AI-powered visual storytelling** — inspired by Miro and Figma, powered by Google Gemini.

## What it does

1. **Write an idea** in the AI editor (left panel)
2. **Generate a script** — your idea becomes a formatted cinematic script
3. **Shot list** — the script is broken into scenes with location, action, dialogue
4. **Characters & Locations** — auto-generated descriptions, reference images, pose sheets
5. **Style suggestion** — AI proposes a visual style; you can refine it with reference images
6. **Storyboard** — 12–16 panels rendered on the infinite canvas (pan, zoom, arrange)
7. **Edit / regenerate** any panel individually
8. **Export to video** — approved panels become motion clips via Gemini Veo

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Neon (PostgreSQL) via Drizzle ORM |
| Auth | NextAuth v5 (JWT + Credentials) |
| AI | Google Gemini 2.0 Flash / Imagen 3 / Veo 2 |
| Canvas | Custom pan/zoom canvas (React) |
| Editor | Tiptap rich-text |
| Deployment | Vercel |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/EVILCREATIVES/Canvas
cd Canvas
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | Random secret for JWT signing (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `DATABASE_URL` | Neon connection string (from neon.tech) |
| `GEMINI_API_KEY` | Google Gemini API key (from aistudio.google.com) |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **First user to register becomes the Admin** automatically.

## Database Commands

```bash
npm run db:push      # Push schema changes to Neon
npm run db:generate  # Generate SQL migration files
npm run db:studio    # Open Drizzle Studio (visual DB browser)
```

## Admin Settings

Admins can access **Settings → AI Configuration** to:
- Pick the Gemini model (text, image, video)
- Set a global system prompt / AI rules
- Changes take effect immediately — no code changes needed

## Roles

| Role | Capabilities |
|---|---|
| `user` | Create projects, run AI pipeline, collaborate |
| `admin` | Everything above + AI settings, blog management, user list |

## Collaboration

Each project has collaborators with roles (`owner`, `editor`, `viewer`). Invite teammates from the project settings page.

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables from `.env.example`
4. Deploy — database migrations run automatically on first request

## AI Model References

- [Gemini 2.0 Flash](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5)
- [Imagen 3 (image generation)](https://ai.google.dev/gemini-api/docs/image-generation)
- [Veo 2 (video generation)](https://ai.google.dev/gemini-api/docs/video)

