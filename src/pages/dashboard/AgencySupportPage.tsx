import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Send,
  User,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const mockTickets = [
  {
    id: "T-001",
    subject: "Cannot access community resources",
    member: "Atukunda Blessing",
    status: "open",
    priority: "high",
    created: "2 hours ago",
    lastReply: "1 hour ago",
    messages: 3,
  },
  {
    id: "T-002",
    subject: "Subscription payment failed",
    member: "kalindaemma92",
    status: "open",
    priority: "medium",
    created: "5 hours ago",
    lastReply: "3 hours ago",
    messages: 2,
  },
  {
    id: "T-003",
    subject: "Request to upgrade plan",
    member: "Agnes Murungi",
    status: "pending",
    priority: "low",
    created: "1 day ago",
    lastReply: "12 hours ago",
    messages: 4,
  },
  {
    id: "T-004",
    subject: "Cannot publish surface",
    member: "lutherombekahanguzi",
    status: "resolved",
    priority: "medium",
    created: "3 days ago",
    lastReply: "2 days ago",
    messages: 6,
  },
];

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  open: { color: "hsl(0 72% 51%)", icon: AlertCircle },
  pending: { color: "hsl(38 92% 50%)", icon: Clock },
  resolved: { color: "hsl(142 71% 45%)", icon: CheckCircle2 },
};

export default function AgencySupportPage() {
  const navigate = useNavigate();
  const [replyOpen, setReplyOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null);

  const openReply = (ticket: typeof mockTickets[0]) => {
    setSelectedTicket(ticket);
    setReplyOpen(true);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <button
        onClick={() => navigate("/dashboard/dashboard/agency")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Agency Management
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
          Member Support
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and respond to member support tickets and inquiries.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-2xl font-bold" style={{ color: "hsl(0 72% 51%)" }}>2</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold" style={{ color: "hsl(38 92% 50%)" }}>1</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold" style={{ color: "hsl(142 71% 45%)" }}>1</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Avg. Response</p>
            <p className="text-2xl font-bold text-foreground">2h</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({mockTickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open (2)</TabsTrigger>
          <TabsTrigger value="pending">Pending (1)</TabsTrigger>
          <TabsTrigger value="resolved">Resolved (1)</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search tickets by subject or member..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {/* Ticket List */}
      <div className="space-y-3">
        {mockTickets.map((ticket) => {
          const cfg = statusConfig[ticket.status] || statusConfig.open;
          const StatusIcon = cfg.icon;
          return (
            <Card
              key={ticket.id}
              className="border border-border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openReply(ticket)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50">
                  <StatusIcon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground truncate">{ticket.subject}</p>
                    <Badge variant="outline" className="text-xs shrink-0">{ticket.id}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <User className="w-3 h-3 inline mr-1" />
                    {ticket.member} · {ticket.created} · {ticket.messages} messages
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs capitalize shrink-0"
                  style={{ color: cfg.color }}
                >
                  {ticket.status}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              {selectedTicket?.member} · {selectedTicket?.id}
            </div>

            {/* Mock conversation */}
            <div className="space-y-3 max-h-48 overflow-y-auto border border-border rounded-lg p-3 bg-muted/20">
              <div className="text-sm">
                <p className="font-medium text-foreground">{selectedTicket?.member}</p>
                <p className="text-muted-foreground mt-0.5">I'm having trouble accessing the community resources. Can you help?</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedTicket?.created}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Your Reply</label>
              <Textarea placeholder="Type your response..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>Close</Button>
            <Button onClick={() => setReplyOpen(false)}>
              <Send className="w-4 h-4 mr-2" /> Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
