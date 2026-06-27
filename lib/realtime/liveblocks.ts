/**
 * Liveblocks wiring — one room per project, used for live cursors and
 * shared canvas state. The server route mints a token gated by the user's
 * project role.
 *
 * If `LIVEBLOCKS_SECRET_KEY` is not configured, the helpers return null so
 * the app degrades gracefully to single-player mode.
 */
import { createClient } from "@liveblocks/client";

export const liveblocksEnabled = Boolean(
  process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
);

export function createBrowserClient() {
  if (!liveblocksEnabled) return null;
  return createClient({
    publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
    throttle: 16,
  });
}

export function roomIdForProject(projectId: string) {
  return `project:${projectId}`;
}
