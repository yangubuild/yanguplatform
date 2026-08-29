import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  useCustomer, useCustomerIdentities, useCustomerTimeline, useCustomerMemories,
  useCustomerCalls, useCustomerConversations, useCustomerAppointments,
  useUpdateCustomer, useSaveCustomerMemory, useDeleteCustomerMemory,
} from "../data/customersHooks";

const MEMORY_TYPES = [
  "preference", "fact", "request", "issue", "product_interest",
  "appointment_context", "relationship", "channel_preference", "unresolved",
];

function Empty({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id = "" } = useParams();
  const { data: customer, isLoading, error, refetch } = useCustomer(id);
  const { data: identities = [] } = useCustomerIdentities(id);
  const { data: timeline = [] } = useCustomerTimeline(id);
  const { data: memories = [] } = useCustomerMemories(id);
  const { data: calls = [] } = useCustomerCalls(id);
  const { data: conversations = [] } = useCustomerConversations(id);
  const { data: appointments = [] } = useCustomerAppointments(id);

  const update = useUpdateCustomer(id);
  const saveMemory = useSaveCustomerMemory(id);
  const deleteMemory = useDeleteCustomerMemory(id);

  const [memoryType, setMemoryType] = useState("fact");
  const [memoryContent, setMemoryContent] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading customer…</div>;
  }
  if (error || !customer) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm">Could not load this customer.</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const field = (key: string, fallback: string | null) =>
    details[key] ?? fallback ?? "";

  const saveDetails = () => {
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(details)) patch[k] = v === "" ? null : v;
    if (Object.keys(patch).length) update.mutate(patch);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={customer.name ?? "Unnamed customer"}
        description={[customer.company, customer.jobTitle].filter(Boolean).join(" · ") || "Customer 360"}
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link to="/dashboard/agents/customers">All customers</Link>
          </Button>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Phone", customer.phoneE164 ?? customer.phone],
              ["Email", customer.email],
              ["Language", customer.language],
              ["Last interaction", customer.lastInteractionAt ? new Date(customer.lastInteractionAt).toLocaleString() : null],
            ].map(([label, value]) => (
              <Card key={label as string}>
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm">{(value as string) || "—"}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Known identifiers</p>
              {identities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No identifiers recorded yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {identities.map((i) => (
                    <Badge key={i.id} variant="outline" className="font-normal">
                      {i.identityType}: {i.identityValue}{i.isVerified ? " ✓" : ""}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Calls</p><p className="mt-1 text-lg">{calls.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Conversations</p><p className="mt-1 text-lg">{conversations.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Appointments</p><p className="mt-1 text-lg">{appointments.length}</p></CardContent></Card>
          </div>

          {timeline.length === 0 && <Empty>No interactions yet.</Empty>}
        </TabsContent>

        {/* ── Timeline ─────────────────────────────────────────── */}
        <TabsContent value="timeline" className="pt-4">
          {timeline.length === 0 ? (
            <Empty>No interactions yet.</Empty>
          ) : (
            <Card>
              <CardContent className="space-y-3 p-4">
                {timeline.map((e) => (
                  <div key={e.id} className="flex gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <span className="w-36 shrink-0 text-xs text-muted-foreground">
                      {new Date(e.occurredAt).toLocaleString()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm">{e.title ?? e.eventType}</p>
                      <p className="text-xs text-muted-foreground">{e.eventType}{e.refType ? ` · ${e.refType}` : ""}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Conversations ────────────────────────────────────── */}
        <TabsContent value="conversations" className="pt-4">
          {conversations.length === 0 ? (
            <Empty>No conversations yet.</Empty>
          ) : (
            <Card>
              <CardContent className="space-y-2 p-4">
                {conversations.map((c: any) => (
                  <Link
                    key={c.id}
                    to={`/dashboard/agents/inbox?conversation=${c.id}`}
                    className="block rounded-md border border-border p-3 text-sm hover:border-primary"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="capitalize">{c.channel ?? "unknown"} · {c.status}</span>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Calls ────────────────────────────────────────────── */}
        <TabsContent value="calls" className="pt-4">
          {calls.length === 0 ? (
            <Empty>No calls yet.</Empty>
          ) : (
            <Card>
              <CardContent className="space-y-2 p-4">
                {calls.map((c: any) => (
                  <div key={c.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="capitalize">{c.direction ?? "call"} · {c.status ?? "—"}{c.outcome ? ` · ${c.outcome}` : ""}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.started_at ? new Date(c.started_at).toLocaleString() : "—"}
                        {c.duration_sec ? ` · ${c.duration_sec}s` : ""}
                      </span>
                    </div>
                    {c.meta?.summary && <p className="mt-2 text-xs text-muted-foreground">{c.meta.summary}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Appointments ─────────────────────────────────────── */}
        <TabsContent value="appointments" className="pt-4">
          {appointments.length === 0 ? (
            <Empty>No appointments yet.</Empty>
          ) : (
            <Card>
              <CardContent className="space-y-2 p-4">
                {appointments.map((a: any) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                    <span>{a.title ?? "Appointment"}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : "—"} · {a.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Memory ───────────────────────────────────────────── */}
        <TabsContent value="memory" className="space-y-4 pt-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium">Add a durable memory</p>
              <div className="grid gap-3 sm:grid-cols-[200px,1fr]">
                <Select value={memoryType} onValueChange={setMemoryType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEMORY_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  rows={2}
                  placeholder="Only lasting, useful facts — no sensitive data such as passwords, keys or card details."
                  value={memoryContent}
                  onChange={(e) => setMemoryContent(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                disabled={!memoryContent.trim() || saveMemory.isPending}
                onClick={() => {
                  saveMemory.mutate(
                    { memoryType, content: memoryContent.trim(), confidence: 1 },
                    { onSuccess: () => setMemoryContent("") },
                  );
                }}
              >
                {saveMemory.isPending ? "Saving…" : "Save memory"}
              </Button>
            </CardContent>
          </Card>

          {memories.length === 0 ? (
            <Empty>No customer memory has been created yet.</Empty>
          ) : (
            <Card>
              <CardContent className="space-y-2 p-4">
                {memories.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="capitalize">{m.memoryType.replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {m.sourceType ? `from ${m.sourceType}` : "manual"} · {new Date(m.updatedAt).toLocaleDateString()} · confidence {Math.round(m.confidence * 100)}%
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{m.content}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete memory"
                      onClick={() => deleteMemory.mutate(m.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Details ──────────────────────────────────────────── */}
        <TabsContent value="details" className="pt-4">
          <Card>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
              {([
                ["firstName", "First name", customer.firstName],
                ["lastName", "Last name", customer.lastName],
                ["email", "Email", customer.email],
                ["phone", "Phone", customer.phone],
                ["company", "Company", customer.company],
                ["jobTitle", "Job title", customer.jobTitle],
                ["language", "Preferred language", customer.language],
                ["timezone", "Timezone", customer.timezone],
                ["location", "Location", customer.location],
                ["source", "Source", customer.source],
              ] as Array<[string, string, string | null]>).map(([key, label, value]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    value={field(key, value)}
                    onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Button size="sm" onClick={saveDetails} disabled={update.isPending || Object.keys(details).length === 0}>
                  {update.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
