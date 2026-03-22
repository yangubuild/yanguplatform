import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TYPING_TIMEOUT_MS = 3000;

interface TypingUser {
  userId: string;
  name: string;
}

/**
 * Typing indicator using Supabase Realtime presence.
 * channelKey: unique key like "dm-<sorted-ids>" or "group-<groupId>"
 */
export function useTypingIndicator(channelKey: string | null, myName?: string) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!channelKey || !user) return;

    const channel = supabase.channel(`typing-${channelKey}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];
        for (const [uid, presences] of Object.entries(state)) {
          if (uid === user.id) continue;
          const p = (presences as any[])[0];
          if (p?.typing) {
            users.push({ userId: uid, name: p.name || "Someone" });
          }
        }
        setTypingUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ typing: false, name: myName || "User" });
        }
      });

    channelRef.current = channel;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
      isTypingRef.current = false;
    };
  }, [channelKey, user?.id, myName]);

  const startTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      channelRef.current.track({ typing: true, name: myName || "User" });
    }
    // Reset timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      channelRef.current?.track({ typing: false, name: myName || "User" });
    }, TYPING_TIMEOUT_MS);
  }, [user?.id, myName]);

  const stopTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      channelRef.current.track({ typing: false, name: myName || "User" });
    }
  }, [user?.id, myName]);

  return { typingUsers, startTyping, stopTyping };
}
