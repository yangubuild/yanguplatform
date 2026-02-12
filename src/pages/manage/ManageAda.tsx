import { useState } from "react";
import {
  Bot, Send, Shield, Users, FileWarning, ServerCrash,
  AlertTriangle, Activity, ChevronRight, Clock, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";

const departments = ["Platform", "Content", "Users", "Finance", "Support", "Security"] as const;
type Dept = typeof departments[number];

const mockAlerts = [
  { id: "1", type: "Content flagged", dept: "Content" as Dept, severity: "warning", time: "2m ago", detail: "Blog post #412 flagged for policy violation" },
  { id: "2", type: "System anomaly", dept: "Platform" as Dept, severity: "error", time: "5m ago", detail: "Spike in 5xx errors on /api/payments" },
  { id: "3", type: "Risky user", dept: "Users" as Dept, severity: "warning", time: "12m ago", detail: "User #8291 multiple failed login attempts" },
  { id: "4", type: "Content flagged", dept: "Content" as Dept, severity: "info", time: "18m ago", detail: "AI review passed for Studio asset batch #77" },
  { id: "5", type: "System anomaly", dept: "Security" as Dept, severity: "error", time: "25m ago", detail: "Unusual API key usage pattern detected" },
  { id: "6", type: "Risky user", dept: "Finance" as Dept, severity: "warning", time: "30m ago", detail: "Chargeback dispute opened on order #9102" },
];

const mockHistory = [
  { role: "user" as const, text: "How many users signed up today?" },
  { role: "ada" as const, text: "47 new users signed up in the last 24 hours, a 12% increase from yesterday." },
  { role: "user" as const, text: "Any flagged content?" },
  { role: "ada" as const, text: "7 items are currently flagged — 3 blog posts and 4 studio assets. 2 require manual review." },
];

const monitors = [
  { label: "Flagged Content", icon: FileWarning, count: 7, status: "warning" },
  { label: "System Anomalies", icon: ServerCrash, count: 2, status: "error" },
  { label: "Risky Users", icon: Users, count: 3, status: "warning" },
];

const severityColor: Record<string, string> = {
  error: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-accent/10 text-accent border-accent/20",
};

export default function ManageAda() {
  const [dept, setDept] = useState<Dept>("Platform");
  const [query, setQuery] = useState("");

  const filteredAlerts = mockAlerts.filter(
    (a) => dept === "Platform" || a.dept === dept,
  );

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Main area */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Department selector */}
        <Tabs value={dept} onValueChange={(v) => setDept(v as Dept)}>
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {departments.map((d) => (
              <TabsTrigger key={d} value={d} className="text-xs">{d}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Monitors */}
        <div className="grid gap-4 sm:grid-cols-3">
          {monitors.map((m) => (
            <Card key={m.label} className="p-4 overflow-hidden">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${m.status === "error" ? "bg-destructive/10" : "bg-warning/10"}`}>
                  <m.icon className={`h-5 w-5 ${m.status === "error" ? "text-destructive" : "text-warning"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{m.label}</p>
                    <AdminStatusBadge status={m.status === "error" ? "rejected" : "pending"} />
                  </div>
                  <p className="text-2xl font-bold mt-1">{m.count}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Alert stream */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alert Stream
              <Badge variant="outline" className="ml-auto text-xs">{filteredAlerts.length} alerts</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredAlerts.map((a) => (
              <button
                key={a.id}
                className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${severityColor[a.severity]}`}>
                    {a.severity}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.detail}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {a.time} · {a.dept}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Right docked ADA panel */}
      <Card className="w-80 shrink-0 flex flex-col hidden lg:flex">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              ADA Assistant
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
              <Activity className="h-3 w-3 mr-1" /> Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mockHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted border border-border"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask ADA…"
              className="text-xs h-8"
            />
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
