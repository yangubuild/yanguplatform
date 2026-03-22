import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleApi } from "@/hooks/useGoogleApi";
import { ArrowLeft, RefreshCw, Mail, Send, Loader2, ChevronLeft, ExternalLink, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type GmailMessage = {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  subject: string;
  date: string;
  isUnread: boolean;
};

type GmailDetail = GmailMessage & {
  to: string;
  body: string;
};

export default function GmailPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { callApi, loading, error } = useGoogleApi();

  const [view, setView] = useState<"inbox" | "detail" | "compose">("inbox");
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailDetail | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchInbox = useCallback(async (pageToken?: string) => {
    const result = await callApi<{ messages: GmailMessage[]; nextPageToken?: string }>("gmail/messages", {
      query: "in:inbox",
      pageToken,
    });
    if (result) {
      if (pageToken) {
        setMessages(prev => [...prev, ...result.messages]);
      } else {
        setMessages(result.messages || []);
      }
      setNextPageToken(result.nextPageToken || null);
      setHasLoaded(true);
    }
  }, [callApi]);

  useEffect(() => {
    if (user?.id) fetchInbox();
  }, [user?.id, fetchInbox]);

  const openMessage = async (msg: GmailMessage) => {
    const detail = await callApi<GmailDetail>("gmail/message-detail", { messageId: msg.id });
    if (detail) {
      setSelectedMessage(detail);
      setView("detail");
    }
  };

  const handleSend = async () => {
    if (!composeTo.trim()) return;
    setSending(true);
    const result = await callApi<{ ok: boolean }>("gmail/send", {
      to: composeTo,
      subject: composeSubject,
      message: composeBody,
    });
    setSending(false);
    if (result?.ok) {
      toast.success("Email sent!");
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setView("inbox");
      fetchInbox();
    }
  };

  const formatSender = (from: string) => {
    const match = from.match(/^(.+?)\s*<.*>$/);
    return match ? match[1].replace(/"/g, "") : from;
  };

  return (
    <div className="w-full min-h-screen px-6 py-6 bg-background">
      <button
        onClick={() => navigate("/dashboard/my-apps")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Apps
      </button>

      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Gmail</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your inbox inside YANGU</p>
          </div>
          <div className="flex items-center gap-2">
              <Button
                variant="accent"
                size="sm"
                onClick={() => { setView("compose"); setComposeTo(""); setComposeSubject(""); setComposeBody(""); }}>
                <Send className="w-4 h-4" />
                Compose
              </Button>
            {view === "inbox" && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchInbox()}
                disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg p-4 mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        {/* COMPOSE VIEW */}
        {view === "compose" && (
          <div className="rounded-xl p-5 bg-card border border-border">
            <button onClick={() => setView("inbox")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4">
              <ChevronLeft className="w-4 h-4" /> Back to inbox
            </button>
            <div className="space-y-3">
              <Input
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="To (email)"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subject"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                rows={8}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
              />
              <Button
                variant="accent"
                size="default"
                onClick={handleSend}
                disabled={sending || !composeTo.trim()}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </Button>
            </div>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && selectedMessage && (
          <div className="rounded-xl p-5 bg-card border border-border">
            <button onClick={() => { setView("inbox"); setSelectedMessage(null); }} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4">
              <ChevronLeft className="w-4 h-4" /> Back to inbox
            </button>
            <h2 className="text-base font-medium text-foreground mb-1">{selectedMessage.subject || "(no subject)"}</h2>
            <p className="text-sm text-muted-foreground mb-1">From: {selectedMessage.from}</p>
            <p className="text-sm text-muted-foreground mb-4">To: {selectedMessage.to}</p>
            <div
              className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: selectedMessage.body }}
            />
          </div>
        )}

        {/* INBOX VIEW */}
        {view === "inbox" && (
          <>
            {loading && !hasLoaded ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            ) : messages.length === 0 && hasLoaded ? (
              <div className="text-center py-20">
                <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Your inbox is empty</p>
              </div>
            ) : (
              <div className="rounded-xl bg-card border border-border divide-y divide-border">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left first:rounded-t-xl last:rounded-b-xl">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: msg.isUnread ? "hsl(var(--accent))" : "transparent" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${msg.isUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {formatSender(msg.from)}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {msg.date ? new Date(msg.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                        </span>
                      </div>
                      <p className="text-sm truncate text-muted-foreground">{msg.subject || "(no subject)"}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.snippet}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {nextPageToken && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="dark-green"
                  size="default"
                  onClick={() => fetchInbox(nextPageToken)}
                  disabled={loading}>
                  {loading ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
