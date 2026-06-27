/**
 * Canvas — relational schema (Postgres / Neon, Drizzle ORM).
 *
 * Design notes:
 *   - All foreign keys are real FKs with explicit onDelete behaviour.
 *   - Canvas layout is decoupled from domain data: `canvas_nodes` references
 *     a domain row by (refTable, refId) and `canvas_edges` connects nodes.
 *   - Assets are first-class and linked to many entities through `asset_links`
 *     so a single reference image can be reused for character / location /
 *     style / panel without duplication.
 *   - AI configuration lives in `ai_settings` + `ai_rules` so admins can
 *     change models and prompts without redeploying.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                     */
/* -------------------------------------------------------------------------- */

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const projectMemberRoleEnum = pgEnum("project_member_role", [
  "owner",
  "editor",
  "viewer",
]);
export const panelStatusEnum = pgEnum("panel_status", [
  "pending",
  "generated",
  "approved",
  "rejected",
]);
export const storyboardStatusEnum = pgEnum("storyboard_status", [
  "draft",
  "generating",
  "ready",
  "archived",
]);
export const videoStatusEnum = pgEnum("video_status", [
  "queued",
  "generating",
  "ready",
  "failed",
]);
export const assetKindEnum = pgEnum("asset_kind", ["image", "video", "reference"]);
export const canvasNodeTypeEnum = pgEnum("canvas_node_type", [
  "editor",
  "script",
  "shot",
  "panel",
  "character_card",
  "location_card",
  "style_card",
  "note",
]);
export const aiSettingScopeEnum = pgEnum("ai_setting_scope", ["global", "project"]);
export const aiRuleAppliesEnum = pgEnum("ai_rule_applies", [
  "script",
  "shot",
  "panel",
  "video",
  "style",
  "character",
  "location",
]);
export const blogStatusEnum = pgEnum("blog_status", ["draft", "published", "archived"]);

/* -------------------------------------------------------------------------- */
/*  Auth.js core tables (compatible with @auth/drizzle-adapter)               */
/* -------------------------------------------------------------------------- */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

/* -------------------------------------------------------------------------- */
/*  Projects & membership                                                     */
/* -------------------------------------------------------------------------- */

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: projectMemberRoleEnum("role").notNull().default("editor"),
    invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.userId] }),
  }),
);

/* -------------------------------------------------------------------------- */
/*  Ideas → Scripts → Shots                                                   */
/* -------------------------------------------------------------------------- */

export const ideas = pgTable("ideas", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  // ProseMirror / TipTap JSON document.
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scripts = pgTable("scripts", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "set null" }),
  // Structured: { scenes: [{ id, heading, beats:[{id,text}] }] }
  content: jsonb("content").notNull(),
  model: text("model"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shots = pgTable(
  "shots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scriptId: uuid("script_id")
      .notNull()
      .references(() => scripts.id, { onDelete: "cascade" }),
    sceneId: text("scene_id"),
    order: integer("order").notNull(),
    description: text("description").notNull(),
    cameraDirection: text("camera_direction"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scriptOrderIdx: index("shots_script_order_idx").on(t.scriptId, t.order),
  }),
);

/* -------------------------------------------------------------------------- */
/*  Characters / Locations / Styles / Assets                                  */
/* -------------------------------------------------------------------------- */

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  kind: assetKindEnum("kind").notNull(),
  url: text("url").notNull(),
  mime: text("mime"),
  width: integer("width"),
  height: integer("height"),
  // If the asset originated from a panel generation, link back.
  sourcePanelId: uuid("source_panel_id"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const characters = pgTable("characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  poseSheetAssetId: uuid("pose_sheet_asset_id").references(() => assets.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const styles = pgTable("styles", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  // self-reference for iterative refinement (style v2 improved with reference)
  parentStyleId: uuid("parent_style_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Generic join table: any asset can be linked to any of the entity types
 * below via (entityType, entityId). Avoids 4 separate join tables.
 */
export const assetLinks = pgTable(
  "asset_links",
  {
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(), // character | location | style | panel | shot
    entityId: uuid("entity_id").notNull(),
    role: text("role"), // e.g. "reference", "pose_sheet", "final"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.assetId, t.entityType, t.entityId] }),
    entityIdx: index("asset_links_entity_idx").on(t.entityType, t.entityId),
  }),
);

/* -------------------------------------------------------------------------- */
/*  Storyboards & panels                                                      */
/* -------------------------------------------------------------------------- */

export const storyboards = pgTable("storyboards", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  scriptId: uuid("script_id").references(() => scripts.id, { onDelete: "set null" }),
  styleId: uuid("style_id").references(() => styles.id, { onDelete: "set null" }),
  status: storyboardStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const panels = pgTable(
  "panels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storyboardId: uuid("storyboard_id")
      .notNull()
      .references(() => storyboards.id, { onDelete: "cascade" }),
    shotId: uuid("shot_id").references(() => shots.id, { onDelete: "set null" }),
    order: integer("order").notNull(),
    prompt: text("prompt").notNull(),
    imageAssetId: uuid("image_asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    status: panelStatusEnum("status").notNull().default("pending"),
    version: integer("version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    storyboardOrderIdx: uniqueIndex("panels_storyboard_order_uq").on(
      t.storyboardId,
      t.order,
    ),
  }),
);

export const panelVersions = pgTable("panel_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  panelId: uuid("panel_id")
    .notNull()
    .references(() => panels.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  imageAssetId: uuid("image_asset_id").references(() => assets.id, {
    onDelete: "set null",
  }),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  storyboardId: uuid("storyboard_id").references(() => storyboards.id, {
    onDelete: "cascade",
  }),
  panelId: uuid("panel_id").references(() => panels.id, { onDelete: "cascade" }),
  url: text("url"),
  status: videoStatusEnum("status").notNull().default("queued"),
  model: text("model"),
  jobId: text("job_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Canvas (visual layout layer)                                              */
/* -------------------------------------------------------------------------- */

export const canvasNodes = pgTable(
  "canvas_nodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: canvasNodeTypeEnum("type").notNull(),
    x: real("x").notNull().default(0),
    y: real("y").notNull().default(0),
    w: real("w").notNull().default(320),
    h: real("h").notNull().default(200),
    // Points to a row in another table (e.g. type=panel, refId=panels.id).
    refTable: text("ref_table"),
    refId: uuid("ref_id"),
    data: jsonb("data"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    projectIdx: index("canvas_nodes_project_idx").on(t.projectId),
  }),
);

export const canvasEdges = pgTable(
  "canvas_edges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fromNodeId: uuid("from_node_id")
      .notNull()
      .references(() => canvasNodes.id, { onDelete: "cascade" }),
    toNodeId: uuid("to_node_id")
      .notNull()
      .references(() => canvasNodes.id, { onDelete: "cascade" }),
    kind: text("kind"),
    data: jsonb("data"),
  },
  (t) => ({
    projectIdx: index("canvas_edges_project_idx").on(t.projectId),
  }),
);

/* -------------------------------------------------------------------------- */
/*  AI configuration                                                          */
/* -------------------------------------------------------------------------- */

export const aiSettings = pgTable(
  "ai_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scope: aiSettingScopeEnum("scope").notNull().default("global"),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    key: text("key").notNull(), // e.g. "model.script", "model.image", "model.video"
    value: jsonb("value").notNull(), // { model, temperature, ... }
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scopeKeyIdx: uniqueIndex("ai_settings_scope_key_uq").on(
      t.scope,
      sql`COALESCE(${t.projectId}::text, '')`,
      t.key,
    ),
  }),
);

export const aiRules = pgTable("ai_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  appliesTo: aiRuleAppliesEnum("applies_to").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Blog                                                                      */
/* -------------------------------------------------------------------------- */

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    body: text("body").notNull(), // MDX source
    status: blogStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("blog_posts_status_idx").on(t.status, t.publishedAt),
  }),
);

/* -------------------------------------------------------------------------- */
/*  Relations                                                                 */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  memberships: many(projectMembers),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  members: many(projectMembers),
  ideas: many(ideas),
  scripts: many(scripts),
  storyboards: many(storyboards),
  characters: many(characters),
  locations: many(locations),
  styles: many(styles),
  assets: many(assets),
  canvasNodes: many(canvasNodes),
  canvasEdges: many(canvasEdges),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  project: one(projects, { fields: [scripts.projectId], references: [projects.id] }),
  idea: one(ideas, { fields: [scripts.ideaId], references: [ideas.id] }),
  shots: many(shots),
  storyboards: many(storyboards),
}));

export const shotsRelations = relations(shots, ({ one, many }) => ({
  script: one(scripts, { fields: [shots.scriptId], references: [scripts.id] }),
  panels: many(panels),
}));

export const storyboardsRelations = relations(storyboards, ({ one, many }) => ({
  project: one(projects, {
    fields: [storyboards.projectId],
    references: [projects.id],
  }),
  script: one(scripts, { fields: [storyboards.scriptId], references: [scripts.id] }),
  style: one(styles, { fields: [storyboards.styleId], references: [styles.id] }),
  panels: many(panels),
  videos: many(videos),
}));

export const panelsRelations = relations(panels, ({ one, many }) => ({
  storyboard: one(storyboards, {
    fields: [panels.storyboardId],
    references: [storyboards.id],
  }),
  shot: one(shots, { fields: [panels.shotId], references: [shots.id] }),
  image: one(assets, { fields: [panels.imageAssetId], references: [assets.id] }),
  versions: many(panelVersions),
  videos: many(videos),
}));

export const stylesRelations = relations(styles, ({ one }) => ({
  parent: one(styles, {
    fields: [styles.parentStyleId],
    references: [styles.id],
  }),
}));

export const canvasNodesRelations = relations(canvasNodes, ({ one, many }) => ({
  project: one(projects, {
    fields: [canvasNodes.projectId],
    references: [projects.id],
  }),
  outgoing: many(canvasEdges, { relationName: "from" }),
  incoming: many(canvasEdges, { relationName: "to" }),
}));

export const canvasEdgesRelations = relations(canvasEdges, ({ one }) => ({
  from: one(canvasNodes, {
    fields: [canvasEdges.fromNodeId],
    references: [canvasNodes.id],
    relationName: "from",
  }),
  to: one(canvasNodes, {
    fields: [canvasEdges.toNodeId],
    references: [canvasNodes.id],
    relationName: "to",
  }),
}));

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                            */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Idea = typeof ideas.$inferSelect;
export type Script = typeof scripts.$inferSelect;
export type Shot = typeof shots.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Style = typeof styles.$inferSelect;
export type Storyboard = typeof storyboards.$inferSelect;
export type Panel = typeof panels.$inferSelect;
export type PanelVersion = typeof panelVersions.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type CanvasNode = typeof canvasNodes.$inferSelect;
export type CanvasEdge = typeof canvasEdges.$inferSelect;
export type AiSetting = typeof aiSettings.$inferSelect;
export type AiRule = typeof aiRules.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
