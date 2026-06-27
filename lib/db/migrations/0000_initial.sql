-- Canvas initial schema
-- Generated to mirror lib/db/schema.ts. Regenerate with `pnpm db:generate`.

CREATE TYPE "user_role" AS ENUM ('admin', 'user');
CREATE TYPE "project_member_role" AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE "panel_status" AS ENUM ('pending', 'generated', 'approved', 'rejected');
CREATE TYPE "storyboard_status" AS ENUM ('draft', 'generating', 'ready', 'archived');
CREATE TYPE "video_status" AS ENUM ('queued', 'generating', 'ready', 'failed');
CREATE TYPE "asset_kind" AS ENUM ('image', 'video', 'reference');
CREATE TYPE "canvas_node_type" AS ENUM ('editor', 'script', 'shot', 'panel', 'character_card', 'location_card', 'style_card', 'note');
CREATE TYPE "ai_setting_scope" AS ENUM ('global', 'project');
CREATE TYPE "ai_rule_applies" AS ENUM ('script', 'shot', 'panel', 'video', 'style', 'character', 'location');
CREATE TYPE "blog_status" AS ENUM ('draft', 'published', 'archived');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text,
  "email" varchar(320) NOT NULL UNIQUE,
  "email_verified" timestamptz,
  "image" text,
  "role" "user_role" NOT NULL DEFAULT 'user',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "accounts" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  PRIMARY KEY ("provider", "provider_account_id")
);

CREATE TABLE "sessions" (
  "session_token" text PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires" timestamptz NOT NULL
);

CREATE TABLE "verification_tokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamptz NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "title" text NOT NULL,
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "project_members" (
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "project_member_role" NOT NULL DEFAULT 'editor',
  "invited_at" timestamptz NOT NULL DEFAULT now(),
  "accepted_at" timestamptz,
  PRIMARY KEY ("project_id", "user_id")
);

CREATE TABLE "ideas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "content" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "scripts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "idea_id" uuid REFERENCES "ideas"("id") ON DELETE SET NULL,
  "content" jsonb NOT NULL,
  "model" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "shots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "script_id" uuid NOT NULL REFERENCES "scripts"("id") ON DELETE CASCADE,
  "scene_id" text,
  "order" integer NOT NULL,
  "description" text NOT NULL,
  "camera_direction" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "shots_script_order_idx" ON "shots" ("script_id", "order");

CREATE TABLE "assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "kind" "asset_kind" NOT NULL,
  "url" text NOT NULL,
  "mime" text,
  "width" integer,
  "height" integer,
  "source_panel_id" uuid,
  "meta" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "characters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "pose_sheet_asset_id" uuid REFERENCES "assets"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "styles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "parent_style_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "styles" ADD CONSTRAINT "styles_parent_fk"
  FOREIGN KEY ("parent_style_id") REFERENCES "styles"("id") ON DELETE SET NULL;

CREATE TABLE "asset_links" (
  "asset_id" uuid NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "entity_type" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "role" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("asset_id", "entity_type", "entity_id")
);
CREATE INDEX "asset_links_entity_idx" ON "asset_links" ("entity_type", "entity_id");

CREATE TABLE "storyboards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "script_id" uuid REFERENCES "scripts"("id") ON DELETE SET NULL,
  "style_id" uuid REFERENCES "styles"("id") ON DELETE SET NULL,
  "status" "storyboard_status" NOT NULL DEFAULT 'draft',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "panels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "storyboard_id" uuid NOT NULL REFERENCES "storyboards"("id") ON DELETE CASCADE,
  "shot_id" uuid REFERENCES "shots"("id") ON DELETE SET NULL,
  "order" integer NOT NULL,
  "prompt" text NOT NULL,
  "image_asset_id" uuid REFERENCES "assets"("id") ON DELETE SET NULL,
  "status" "panel_status" NOT NULL DEFAULT 'pending',
  "version" integer NOT NULL DEFAULT 1,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "panels_storyboard_order_uq" ON "panels" ("storyboard_id", "order");

ALTER TABLE "assets" ADD CONSTRAINT "assets_source_panel_fk"
  FOREIGN KEY ("source_panel_id") REFERENCES "panels"("id") ON DELETE SET NULL;

CREATE TABLE "panel_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "panel_id" uuid NOT NULL REFERENCES "panels"("id") ON DELETE CASCADE,
  "prompt" text NOT NULL,
  "image_asset_id" uuid REFERENCES "assets"("id") ON DELETE SET NULL,
  "version" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "videos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "storyboard_id" uuid REFERENCES "storyboards"("id") ON DELETE CASCADE,
  "panel_id" uuid REFERENCES "panels"("id") ON DELETE CASCADE,
  "url" text,
  "status" "video_status" NOT NULL DEFAULT 'queued',
  "model" text,
  "job_id" text,
  "error" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "canvas_nodes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "type" "canvas_node_type" NOT NULL,
  "x" real NOT NULL DEFAULT 0,
  "y" real NOT NULL DEFAULT 0,
  "w" real NOT NULL DEFAULT 320,
  "h" real NOT NULL DEFAULT 200,
  "ref_table" text,
  "ref_id" uuid,
  "data" jsonb,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "canvas_nodes_project_idx" ON "canvas_nodes" ("project_id");

CREATE TABLE "canvas_edges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "from_node_id" uuid NOT NULL REFERENCES "canvas_nodes"("id") ON DELETE CASCADE,
  "to_node_id" uuid NOT NULL REFERENCES "canvas_nodes"("id") ON DELETE CASCADE,
  "kind" text,
  "data" jsonb
);
CREATE INDEX "canvas_edges_project_idx" ON "canvas_edges" ("project_id");

CREATE TABLE "ai_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "scope" "ai_setting_scope" NOT NULL DEFAULT 'global',
  "project_id" uuid REFERENCES "projects"("id") ON DELETE CASCADE,
  "key" text NOT NULL,
  "value" jsonb NOT NULL,
  "updated_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "ai_settings_scope_key_uq"
  ON "ai_settings" ("scope", (COALESCE("project_id"::text, '')), "key");

CREATE TABLE "ai_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "applies_to" "ai_rule_applies" NOT NULL,
  "system_prompt" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "updated_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "blog_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "excerpt" text,
  "body" text NOT NULL,
  "status" "blog_status" NOT NULL DEFAULT 'draft',
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" ("status", "published_at");

-- Seed default AI settings so admins have something to edit immediately.
INSERT INTO "ai_settings" ("scope", "key", "value") VALUES
  ('global', 'model.script', '{"provider":"gemini","model":"gemini-1.5-pro","temperature":0.7}'),
  ('global', 'model.shots',  '{"provider":"gemini","model":"gemini-1.5-pro","temperature":0.5}'),
  ('global', 'model.image',  '{"provider":"gemini","model":"imagen-3.0-generate-002"}'),
  ('global', 'model.pose',   '{"provider":"gemini","model":"imagen-3.0-generate-002"}'),
  ('global', 'model.style',  '{"provider":"gemini","model":"imagen-3.0-generate-002"}'),
  ('global', 'model.video',  '{"provider":"gemini","model":"veo-2.0-generate-001"}');
