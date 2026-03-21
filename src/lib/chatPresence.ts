export type ChatPresenceStatus = "live" | "offline";

interface PresenceMessage {
  user_id: string;
  created_at: string;
}

const LIVE_WINDOW_MS = 5 * 60 * 1000;

export function buildChatPresenceMap<T extends PresenceMessage>(
  messages: T[],
  currentUserId?: string,
): Record<string, ChatPresenceStatus> {
  const latestByUser = new Map<string, number>();

  for (const message of messages) {
    const timestamp = new Date(message.created_at).getTime();
    if (!Number.isFinite(timestamp)) continue;
    const existing = latestByUser.get(message.user_id) ?? 0;
    if (timestamp > existing) latestByUser.set(message.user_id, timestamp);
  }

  const now = Date.now();
  const presence: Record<string, ChatPresenceStatus> = {};

  latestByUser.forEach((timestamp, userId) => {
    presence[userId] = now - timestamp <= LIVE_WINDOW_MS ? "live" : "offline";
  });

  if (currentUserId) presence[currentUserId] = "live";

  return presence;
}