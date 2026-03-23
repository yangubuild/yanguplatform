import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface SupportMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sender_type: "user" | "ai" | "agent";
  created_at: string;
}

export type TicketStatus = "pending" | "agent_required" | "in_progress" | "resolved" | "closed";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;

export function useSupportChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>("pending");
  const [isEscalated, setIsEscalated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Derived states for UI
  const isAgentHandling = ticketStatus === "agent_required" || ticketStatus === "in_progress";
  const isResolved = ticketStatus === "resolved" || ticketStatus === "closed";

  const ensureTicket = useCallback(async (): Promise<string | null> => {
    if (ticketId) return ticketId;
    if (!user) return null;

    // Check for existing open ticket
    const { data: existing } = await supabase
      .from("support_tickets")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "agent_required", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      setTicketId(existing.id);
      const status = existing.status as TicketStatus;
      setTicketStatus(status);
      if (status === "agent_required" || status === "in_progress") {
        setIsEscalated(true);
      }
      // Load existing messages
      const { data: msgs } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", existing.id)
        .order("created_at", { ascending: true });

      if (msgs?.length) {
        setMessages(
          msgs.map((m: any) => ({
            id: m.id,
            role: m.sender_type === "user" ? "user" as const : "assistant" as const,
            content: m.content,
            sender_type: m.sender_type,
            created_at: m.created_at,
          }))
        );
      }
      return existing.id;
    }

    // Create new ticket — starts as pending (AI-only)
    const { data: newTicket, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject: "Support Chat", category: "general" })
      .select("id")
      .single();

    if (error || !newTicket) {
      toast.error("Failed to create support conversation");
      return null;
    }

    setTicketId(newTicket.id);
    setTicketStatus("pending");
    return newTicket.id;
  }, [ticketId, user]);

  const saveMessage = useCallback(async (tId: string, content: string, senderType: "user" | "ai" | "agent") => {
    await supabase.from("support_messages").insert({
      ticket_id: tId,
      sender_type: senderType,
      sender_id: senderType === "user" ? user?.id : null,
      content,
    });
  }, [user]);

  const escalateTicket = useCallback(async (tId: string) => {
    await supabase
      .from("support_tickets")
      .update({ status: "agent_required", updated_at: new Date().toISOString() })
      .eq("id", tId);
    setTicketStatus("agent_required");
    setIsEscalated(true);
  }, []);

  // Poll for new agent messages and status changes on the active ticket
  useEffect(() => {
    if (!ticketId) return;
    const interval = setInterval(async () => {
      // Refresh ticket status
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("status")
        .eq("id", ticketId)
        .maybeSingle();

      if (ticket) {
        const newStatus = ticket.status as TicketStatus;
        setTicketStatus(newStatus);
        if (newStatus === "agent_required" || newStatus === "in_progress") {
          setIsEscalated(true);
        }
      }

      // Refresh messages (check for new agent replies)
      const { data: msgs } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (msgs?.length) {
        setMessages(
          msgs.map((m: any) => ({
            id: m.id,
            role: m.sender_type === "user" ? "user" as const : "assistant" as const,
            content: m.content,
            sender_type: m.sender_type,
            created_at: m.created_at,
          }))
        );
      }
    }, 8000); // Poll every 8 seconds

    return () => clearInterval(interval);
  }, [ticketId]);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const tId = await ensureTicket();
    if (!tId) return;

    const userMsg: SupportMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      sender_type: "user",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Save user message
    await saveMessage(tId, input, "user");

    // Build conversation for AI
    const conversationMsgs = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, {
          id: assistantId,
          role: "assistant" as const,
          content: assistantContent,
          sender_type: "ai" as const,
          created_at: new Date().toISOString(),
        }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: conversationMsgs,
          ticket_id: tId,
          ticket_status: ticketStatus,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Support unavailable" }));
        throw new Error(err.error || "Support unavailable");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Check for escalation signal
      if (assistantContent.includes("[ESCALATE]")) {
        assistantContent = assistantContent.replace(/\[ESCALATE\]/g, "").trim();
        if (!assistantContent) {
          assistantContent = "I'm connecting you with a support agent who can help further. Your conversation history has been preserved so they can see what we've discussed.";
        }
        // Update the final message content
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
        );
        await escalateTicket(tId);
        // Save system escalation notice
        await saveMessage(tId, "⚡ This conversation has been escalated to a human support agent.", "ai");
      }

      // Save AI response
      if (assistantContent) {
        await saveMessage(tId, assistantContent, "ai");
      }
    } catch (err) {
      console.error("Support chat error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to get support response");
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, ensureTicket, saveMessage, escalateTicket, ticketStatus]);

  const startNewConversation = useCallback(() => {
    setTicketId(null);
    setMessages([]);
    setIsEscalated(false);
    setTicketStatus("pending");
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    isEscalated,
    isAgentHandling,
    isResolved,
    ticketId,
    ticketStatus,
    ensureTicket,
    startNewConversation,
  };
}
