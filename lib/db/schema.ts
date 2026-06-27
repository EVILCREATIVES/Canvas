import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  real,
  json,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  role: text('role', { enum: ['admin', 'user'] })
    .notNull()
    .default('user'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [
    {
      compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    },
  ]
);

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: uuid('ownerId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const projectCollaborators = pgTable(
  'projectCollaborators',
  {
    projectId: uuid('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['owner', 'editor', 'viewer'] })
      .notNull()
      .default('viewer'),
    joinedAt: timestamp('joinedAt').notNull().defaultNow(),
  },
  (pc) => [
    {
      compoundKey: primaryKey({ columns: [pc.projectId, pc.userId] }),
    },
  ]
);

export const scripts = pgTable('scripts', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('projectId')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  generatedFromIdea: text('generatedFromIdea'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const shotLists = pgTable('shotLists', {
  id: uuid('id').defaultRandom().primaryKey(),
  scriptId: uuid('scriptId')
    .notNull()
    .references(() => scripts.id, { onDelete: 'cascade' }),
  orderIndex: integer('orderIndex').notNull().default(0),
  sceneNumber: text('sceneNumber'),
  location: text('location'),
  timeOfDay: text('timeOfDay'),
  action: text('action'),
  dialogue: text('dialogue'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('projectId')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  referenceImages: json('referenceImages').$type<string[]>().default([]),
  poseSheetUrl: text('poseSheetUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('projectId')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  referenceImages: json('referenceImages').$type<string[]>().default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const styleSettings = pgTable('styleSettings', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('projectId')
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: 'cascade' }),
  style: text('style'),
  description: text('description'),
  referenceImages: json('referenceImages').$type<string[]>().default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const storyboards = pgTable('storyboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('projectId')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('Storyboard'),
  status: text('status', { enum: ['draft', 'approved', 'archived'] })
    .notNull()
    .default('draft'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const storyboardPanels = pgTable('storyboardPanels', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyboardId: uuid('storyboardId')
    .notNull()
    .references(() => storyboards.id, { onDelete: 'cascade' }),
  orderIndex: integer('orderIndex').notNull().default(0),
  imageUrl: text('imageUrl'),
  prompt: text('prompt'),
  status: text('status', {
    enum: ['pending', 'generating', 'generated', 'approved'],
  })
    .notNull()
    .default('pending'),
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const canvasElements = pgTable('canvasElements', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('projectId')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  elementType: text('elementType', {
    enum: ['text', 'image', 'panel', 'shape'],
  }).notNull(),
  data: json('data').$type<Record<string, unknown>>().default({}),
  positionX: real('positionX').notNull().default(0),
  positionY: real('positionY').notNull().default(0),
  width: real('width').notNull().default(100),
  height: real('height').notNull().default(100),
  zIndex: integer('zIndex').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const adminSettings = pgTable('adminSettings', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelName: text('modelName').notNull().default('gemini-2.0-flash'),
  imageModel: text('imageModel').notNull().default('imagen-3.0-generate-002'),
  videoModel: text('videoModel').notNull().default('veo-2.0-generate-001'),
  aiRules: text('aiRules'),
  systemPrompt: text('systemPrompt'),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const blogPosts = pgTable('blogPosts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  coverImageUrl: text('coverImageUrl'),
  authorId: uuid('authorId').references(() => users.id, {
    onDelete: 'set null',
  }),
  publishedAt: timestamp('publishedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Script = typeof scripts.$inferSelect;
export type ShotList = typeof shotLists.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type StyleSetting = typeof styleSettings.$inferSelect;
export type Storyboard = typeof storyboards.$inferSelect;
export type StoryboardPanel = typeof storyboardPanels.$inferSelect;
export type CanvasElement = typeof canvasElements.$inferSelect;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
