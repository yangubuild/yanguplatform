import { useMemo, useState } from "react";
import {
  Plus, FileText, Link2, HelpCircle, File, Search, Sparkles, Package, Wrench,
  Globe, Trash2, History, Archive, RotateCcw, ShieldCheck, Upload, ChevronDown, ChevronRight, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type {
  KSource, KSourceKind, KSourceStatus, KPermission, KCollection, KFAQ,
  KProduct, KService, KTestResult,
} from "../data/types";
import { db as mockDb } from "../data/mock";
import { PageHeader } from "../components/PageHeader";
import { toast } from "@/hooks/use-toast";
import {
  useAgents,
  useKnowledgeCollections, useCreateKnowledgeCollection, useUpdateKnowledgeCollection, useDeleteKnowledgeCollection,
  useKnowledgeSources, useCreateKnowledgeSource, useUpdateKnowledgeSource,
  useArchiveKnowledgeSource, useRestoreKnowledgeSource, useDeleteKnowledgeSource,
  useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq,
  useProducts, useCreateProduct, useDeleteProduct,
  useServices, useCreateService, useDeleteService,
  useWebsiteImports, useCreateWebsiteImport, useDeleteWebsiteImport,
} from "../data/hooks";

const KIND_ICON: Record<KSourceKind, typeof FileText> = {
  pdf: FileText, docx: FileText, txt: FileText, csv: FileText, url: Link2, faq: HelpCircle,
  product: Package, service: Wrench, policy: ShieldCheck, sop: File, manual: File, note: File,
};

const STATUS_META: Record<KSourceStatus, { label: string; variant: "secondary" | "outline" | "destructive"; className?: string }> = {
  uploading:  { label: "Uploading",  variant: "outline", className: "text-sky-600 border-sky-500/40" },
  processing: { label: "Processing", variant: "outline", className: "text-amber-600 border-amber-500/40" },
  indexed:    { label: "Indexed",    variant: "secondary" },
  ready:      { label: "Ready",      variant: "secondary" },
  failed:     { label: "Failed",     variant: "destructive" },
  archived:   { label: "Archived",   variant: "outline", className: "text-muted-foreground" },
};

const PERMISSION_LABEL: Record<KPermission, string> = {
  all: "All AI Employees", sales: "Sales Agent only", support: "Support Agent only",
  receptionist: "Receptionist only", internal: "Internal Knowledge Agent", custom: "Custom",
};

const LANGUAGES = ["English","Swahili","French","Arabic","Portuguese","Amharic"];

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card><CardContent className="p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent></Card>
  );
}

export default function KnowledgePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Knowledge"
        description="The intelligence layer for every AI Employee — sources, collections, FAQs, products and testing."
      />
      <Tabs defaultValue="sources">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="website">Website Import</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-5"><SourcesTab /></TabsContent>
        <TabsContent value="collections" className="mt-5"><CollectionsTab /></TabsContent>
        <TabsContent value="faqs" className="mt-5"><FaqTab /></TabsContent>
        <TabsContent value="products" className="mt-5"><ProductsTab /></TabsContent>
        <TabsContent value="services" className="mt-5"><ServicesTab /></TabsContent>
        <TabsContent value="website" className="mt-5"><WebsiteTab /></TabsContent>
        <TabsContent value="search" className="mt-5"><SearchTab /></TabsContent>
        <TabsContent value="test" className="mt-5"><TestTab /></TabsContent>
        <TabsContent value="analytics" className="mt-5"><AnalyticsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── SOURCES ──────────────────────────────────────────────────────────
function SourcesTab() {
  const [addOpen, setAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCol, setFilterCol] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "archived">("all");
  const [query, setQuery] = useState("");
  const { data: collections = [] } = useKnowledgeCollections();
  const { data: allSources = [], isLoading } = useKnowledgeSources();
  const archive = useArchiveKnowledgeSource();
  const restore = useRestoreKnowledgeSource();
  const del = useDeleteKnowledgeSource();

  // Sources tab hides derived kinds (they have dedicated tabs).
  const HIDDEN: KSourceKind[] = ["faq", "product", "service"];
  const sources = allSources.filter((s) => {
    if (HIDDEN.includes(s.kind)) return false;
    if (filterCol !== "all" && s.collectionId !== filterCol) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterActive === "active" && !s.active) return false;
    if (filterActive === "archived" && s.status !== "archived") return false;
    if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sources…" className="pl-8 w-64" />
          </div>
          <Select value={filterCol} onValueChange={setFilterCol}>
            <SelectTrigger className="w-52"><SelectValue placeholder="All collections" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              {collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              {(Object.keys(STATUS_META) as KSourceStatus[]).map((s) =>
                <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterActive} onValueChange={(v) => setFilterActive(v as any)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add source</Button>
      </div>

      <Card><CardContent className="p-0 divide-y divide-border">
        {isLoading && (
          <p className="text-sm text-muted-foreground p-8 text-center flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />Loading sources…
          </p>
        )}
        {!isLoading && sources.length === 0 && (
          <p className="text-sm text-muted-foreground p-8 text-center">
            {allSources.length === 0 ? "No knowledge sources yet — add your first document, policy or URL." : "No sources match your filters."}
          </p>
        )}
        {sources.map((s) => {
          const Icon = KIND_ICON[s.kind] ?? FileText;
          const col = collections.find(c => c.id === s.collectionId);
          const status = STATUS_META[s.status];
          const expanded = expandedId === s.id;
          return (
            <div key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="font-medium text-sm truncate">{s.name}</p>
                      <Badge variant="outline" className="capitalize">{s.kind}</Badge>
                      <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                      {!s.active && <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>}
                      <Badge variant="outline">v{s.version}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {col?.name ?? "—"} · {s.language} · {s.size} · {s.chunks} chunks · updated {new Date(s.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permission: {PERMISSION_LABEL[s.permission]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex gap-1">
                    {s.status === "archived" ? (
                      <Button variant="outline" size="sm" onClick={() => restore.mutate(s.id)}><RotateCcw className="h-4 w-4 mr-1" />Restore</Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => archive.mutate(s.id)}><Archive className="h-4 w-4 mr-1" />Archive</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${s.name}?`)) del.mutate(s.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setExpandedId(expanded ? null : s.id)}>
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {s.status === "processing" && (
                <div className="pl-12 pr-4 pt-2"><Progress value={65} className="h-1.5" /></div>
              )}
              {expanded && (
                <div className="pl-12 pt-3 space-y-3">
                  <SourceDetail source={s} collections={collections} />
                </div>
              )}
            </div>
          );
        })}
      </CardContent></Card>

      <AddSourceDialog open={addOpen} onOpenChange={setAddOpen} collections={collections} />
    </div>
  );
}

function SourceDetail({ source, collections }: { source: KSource; collections: KCollection[] }) {
  const update = useUpdateKnowledgeSource();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Collection</Label>
          <Select value={source.collectionId} onValueChange={(v) => update.mutate({ id: source.id, patch: { collectionId: v } })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Language</Label>
          <Select value={source.language} onValueChange={(v) => update.mutate({ id: source.id, patch: { language: v } })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Permission</Label>
          <Select value={source.permission} onValueChange={(v) => update.mutate({ id: source.id, patch: { permission: v as KPermission } })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(PERMISSION_LABEL) as KPermission[]).map((p) =>
                <SelectItem key={p} value={p}>{PERMISSION_LABEL[p]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {source.history.length > 0 && (
        <div>
          <Label className="text-xs flex items-center gap-1"><History className="h-3 w-3" />Version history</Label>
          <div className="mt-2 rounded-lg border border-border divide-y divide-border">
            {source.history.slice().reverse().map((v) => (
              <div key={v.id} className="flex items-center justify-between px-3 py-2 text-xs">
                <div>
                  <span className="font-medium">v{v.version}</span> · {v.note} · {v.size} · {new Date(v.createdAt).toLocaleString()}
                  <Badge variant={STATUS_META[v.status].variant} className={"ml-2 " + (STATUS_META[v.status].className ?? "")}>{STATUS_META[v.status].label}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddSourceDialog({ open, onOpenChange, collections }: { open: boolean; onOpenChange: (v: boolean) => void; collections: KCollection[] }) {
  const create = useCreateKnowledgeSource();
  const [kind, setKind] = useState<KSourceKind>("pdf");
  const [name, setName] = useState("");
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [language, setLanguage] = useState("English");
  const [permission, setPermission] = useState<KPermission>("all");
  const [urlOrText, setUrlOrText] = useState("");

  function submit() {
    const finalName = name || (kind === "url" ? urlOrText : "Untitled source");
    if (!finalName.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (!collectionId) { toast({ title: "Pick a collection", variant: "destructive" }); return; }
    create.mutate({
      name: finalName, kind, collectionId, language, permission,
      sourceUrl: kind === "url" ? urlOrText : undefined,
      size: kind === "url" ? "1 page" : "—",
    } as any, {
      onSuccess: () => { setName(""); setUrlOrText(""); onOpenChange(false); },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add knowledge source</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as KSourceKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word (.docx)</SelectItem>
                  <SelectItem value="txt">Text file</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="url">Website URL</SelectItem>
                  <SelectItem value="policy">Company policy</SelectItem>
                  <SelectItem value="sop">SOP</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="note">Internal note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger><SelectValue placeholder="Pick a collection" /></SelectTrigger>
                <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Refund policy" /></div>
          {kind === "url" && (
            <div><Label className="text-xs">URL</Label><Input value={urlOrText} onChange={(e) => setUrlOrText(e.target.value)} placeholder="https://…" /></div>
          )}
          {["pdf","docx","txt","csv"].includes(kind) && (
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Drop file here or click to upload
            </div>
          )}
          {["note","policy","sop","manual"].includes(kind) && (
            <div><Label className="text-xs">Content</Label><Textarea rows={5} value={urlOrText} onChange={(e) => setUrlOrText(e.target.value)} /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Permission</Label>
              <Select value={permission} onValueChange={(v) => setPermission(v as KPermission)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERMISSION_LABEL) as KPermission[]).map((p) =>
                    <SelectItem key={p} value={p}>{PERMISSION_LABEL[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Add source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── COLLECTIONS ──────────────────────────────────────────────────────
function CollectionsTab() {
  const { data: collections = [], isLoading } = useKnowledgeCollections();
  const { data: sources = [] } = useKnowledgeSources();
  const { data: agents = [] } = useAgents();
  const del = useDeleteKnowledgeCollection();
  const [editing, setEditing] = useState<KCollection | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1.5" />New collection</Button></div>
      {isLoading && <EmptyState title="Loading collections…" />}
      {!isLoading && collections.length === 0 && (
        <EmptyState title="No collections yet" hint="Group knowledge into collections like Sales, Support or Pricing." />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {collections.map((c) => {
          const count = sources.filter(s => s.collectionId === c.id).length;
          return (
            <Card key={c.id}><CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                </div>
                <Badge variant="outline">{count} src</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {c.agentIds.length === 0 && <Badge variant="outline" className="text-muted-foreground">No agents assigned</Badge>}
                {c.agentIds.map((id) => {
                  const a = agents.find(x => x.id === id);
                  return a ? <Badge key={id} variant="secondary">{a.name}</Badge> : null;
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(c)}>Assign agents</Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${c.name}?`)) del.mutate(c.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent></Card>
          );
        })}
      </div>

      <CollectionEditor open={!!editing} value={editing} agents={agents}
        onOpenChange={(v) => !v && setEditing(null)} onDone={() => setEditing(null)} />
      <CollectionCreator open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function CollectionEditor({ open, onOpenChange, value, agents, onDone }:{
  open: boolean; onOpenChange: (v: boolean) => void; value: KCollection | null;
  agents: { id: string; name: string; type: string }[]; onDone: () => void;
}) {
  const update = useUpdateKnowledgeCollection();
  const [selected, setSelected] = useState<string[]>([]);
  useMemo(() => { setSelected(value?.agentIds ?? []); }, [value?.id]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Assign to AI Employees</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {agents.length === 0 && <p className="text-xs text-muted-foreground">No agents yet.</p>}
          {agents.map((a) => {
            const on = selected.includes(a.id);
            return (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{a.type} agent</p>
                </div>
                <Switch checked={on} onCheckedChange={(v) => setSelected(v ? [...selected, a.id] : selected.filter(x => x !== a.id))} />
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={update.isPending} onClick={() => {
            if (!value) return;
            update.mutate({ id: value.id, patch: { agentIds: selected } }, { onSuccess: () => onDone() });
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CollectionCreator({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateKnowledgeCollection();
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New collection</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Field Ops" /></div>
          <div><Label className="text-xs">Description</Label><Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={create.isPending} onClick={() => {
            if (!name.trim()) return;
            create.mutate({ name, description: desc }, { onSuccess: () => { setName(""); setDesc(""); onOpenChange(false); } });
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── FAQs ─────────────────────────────────────────────────────────────
function FaqTab() {
  const { data: collections = [] } = useKnowledgeCollections();
  const { data: faqs = [], isLoading } = useFaqs();
  const create = useCreateFaq();
  const update = useUpdateFaq();
  const del = useDeleteFaq();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(""); const [a, setA] = useState("");
  const [cat, setCat] = useState("General"); const [colId, setColId] = useState("");
  const [lang, setLang] = useState("English");

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add FAQ</Button></div>
      <Card><CardContent className="p-0 divide-y divide-border">
        {isLoading && <p className="text-sm text-muted-foreground p-8 text-center">Loading FAQs…</p>}
        {!isLoading && faqs.length === 0 && <p className="text-sm text-muted-foreground p-8 text-center">No FAQs yet.</p>}
        {faqs.map((f) => (
          <div key={f.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm">{f.question}</p>
              <p className="text-sm text-muted-foreground mt-1">{f.answer}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{f.category}</Badge>
                <Badge variant="outline">{f.language}</Badge>
                <Badge variant="outline">{collections.find(c => c.id === f.collectionId)?.name ?? "—"}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch checked={f.active} onCheckedChange={(v) => update.mutate({ id: f.id, patch: { active: v } })} />
              <Button variant="ghost" size="icon" onClick={() => del.mutate(f.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add FAQ</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Question</Label><Input value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div><Label className="text-xs">Answer</Label><Textarea rows={4} value={a} onChange={(e) => setA(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Category</Label><Input value={cat} onChange={(e) => setCat(e.target.value)} /></div>
              <div>
                <Label className="text-xs">Language</Label>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Collection</Label>
                <Select value={colId || collections[0]?.id || ""} onValueChange={setColId}>
                  <SelectTrigger><SelectValue placeholder="Pick collection" /></SelectTrigger>
                  <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={create.isPending} onClick={() => {
              if (!q.trim() || !a.trim()) { toast({ title: "Question and answer are required", variant: "destructive" }); return; }
              const targetCol = colId || collections[0]?.id;
              if (!targetCol) { toast({ title: "Create a collection first", variant: "destructive" }); return; }
              create.mutate({ question: q, answer: a, category: cat, language: lang, collectionId: targetCol }, {
                onSuccess: () => { setQ(""); setA(""); setOpen(false); },
              });
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────
function ProductsTab() {
  const { data: products = [], isLoading } = useProducts();
  const { data: collections = [] } = useKnowledgeCollections();
  const create = useCreateProduct();
  const del = useDeleteProduct();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [price, setPrice] = useState(""); const [cat, setCat] = useState("General");
  const [features, setFeatures] = useState("");
  const [availability, setAvailability] = useState<KProduct["availability"]>("in_stock");
  const [colId, setColId] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add product</Button></div>
      {isLoading && <EmptyState title="Loading products…" />}
      {!isLoading && products.length === 0 && <EmptyState title="No products yet" hint="Add structured product records so AI Employees can answer product questions accurately." />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => (
          <Card key={p.id}><CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm">{p.name}</p>
              <Badge variant={p.availability === "in_stock" ? "secondary" : "outline"} className="capitalize">{p.availability.replace("_"," ")}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
            <p className="text-sm font-medium">{p.price}</p>
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
              {p.features.slice(0,3).map((f) => <li key={f}>{f}</li>)}
            </ul>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">{collections.find(c => c.id === p.collectionId)?.name ?? "—"} · {p.category}</p>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label className="text-xs">Description</Label><Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Price</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$—" /></div>
              <div><Label className="text-xs">Category</Label><Input value={cat} onChange={(e) => setCat(e.target.value)} /></div>
            </div>
            <div><Label className="text-xs">Features (one per line)</Label><Textarea rows={3} value={features} onChange={(e) => setFeatures(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Availability</Label>
                <Select value={availability} onValueChange={(v) => setAvailability(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of stock</SelectItem>
                    <SelectItem value="preorder">Preorder</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Collection</Label>
                <Select value={colId || collections[0]?.id || ""} onValueChange={setColId}>
                  <SelectTrigger><SelectValue placeholder="Pick collection" /></SelectTrigger>
                  <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={create.isPending} onClick={() => {
              if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
              const target = colId || collections[0]?.id;
              if (!target) { toast({ title: "Create a collection first", variant: "destructive" }); return; }
              create.mutate({
                name, description: desc, price, category: cat, availability, collectionId: target,
                features: features.split("\n").map(s => s.trim()).filter(Boolean),
              }, { onSuccess: () => { setName(""); setDesc(""); setPrice(""); setFeatures(""); setOpen(false); } });
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── SERVICES ─────────────────────────────────────────────────────────
function ServicesTab() {
  const { data: services = [], isLoading } = useServices();
  const { data: collections = [] } = useKnowledgeCollections();
  const create = useCreateService();
  const del = useDeleteService();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [price, setPrice] = useState(""); const [features, setFeatures] = useState("");
  const [avail, setAvail] = useState<KService["availability"]>("available");
  const [colId, setColId] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add service</Button></div>
      {isLoading && <EmptyState title="Loading services…" />}
      {!isLoading && services.length === 0 && <EmptyState title="No services yet" hint="Add services your AI Employees can describe and quote for customers." />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map((s) => (
          <Card key={s.id}><CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm">{s.name}</p>
              <Badge variant={s.availability === "available" ? "secondary" : "outline"} className="capitalize">{s.availability}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
            <p className="text-sm font-medium">{s.price}</p>
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
              {s.features.slice(0,3).map((f) => <li key={f}>{f}</li>)}
            </ul>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">{collections.find(c => c.id === s.collectionId)?.name ?? "—"}</p>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add service</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label className="text-xs">Description</Label><Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Price</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} /></div>
              <div>
                <Label className="text-xs">Availability</Label>
                <Select value={avail} onValueChange={(v) => setAvail(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Features (one per line)</Label><Textarea rows={3} value={features} onChange={(e) => setFeatures(e.target.value)} /></div>
            <div>
              <Label className="text-xs">Collection</Label>
              <Select value={colId || collections[0]?.id || ""} onValueChange={setColId}>
                <SelectTrigger><SelectValue placeholder="Pick collection" /></SelectTrigger>
                <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={create.isPending} onClick={() => {
              if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
              const target = colId || collections[0]?.id;
              if (!target) { toast({ title: "Create a collection first", variant: "destructive" }); return; }
              create.mutate({
                name, description: desc, price, availability: avail, collectionId: target,
                features: features.split("\n").map(s => s.trim()).filter(Boolean),
              }, { onSuccess: () => { setName(""); setDesc(""); setPrice(""); setFeatures(""); setOpen(false); } });
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── WEBSITE IMPORT ───────────────────────────────────────────────────
function WebsiteTab() {
  const { data: imports = [], isLoading } = useWebsiteImports();
  const { data: collections = [] } = useKnowledgeCollections();
  const create = useCreateWebsiteImport();
  const del = useDeleteWebsiteImport();
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"homepage" | "entire_site" | "selected">("homepage");
  const [pages, setPages] = useState("");
  const [colId, setColId] = useState("");

  function run() {
    if (!url.trim()) { toast({ title: "Root URL is required", variant: "destructive" }); return; }
    const target = colId || collections[0]?.id;
    if (!target) { toast({ title: "Create a collection first", variant: "destructive" }); return; }
    const pageList = mode === "selected"
      ? pages.split("\n").map(p => p.trim()).filter(Boolean)
      : mode === "entire_site" ? [`${url}/*`] : [url];
    create.mutate({ rootUrl: url, mode, collectionId: target, pages: pageList }, {
      onSuccess: () => { setUrl(""); setPages(""); },
    });
  }

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <p className="font-semibold text-sm">Import from a website</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2"><Label className="text-xs">Root URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yangu.io" /></div>
          <div>
            <Label className="text-xs">Collection</Label>
            <Select value={colId || collections[0]?.id || ""} onValueChange={setColId}>
              <SelectTrigger><SelectValue placeholder="Pick collection" /></SelectTrigger>
              <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["homepage","entire_site","selected"] as const).map((m) => (
            <Card key={m} className={"cursor-pointer " + (mode === m ? "border-primary" : "hover:border-primary/40")} onClick={() => setMode(m)}>
              <CardContent className="p-4">
                <p className="text-sm font-medium capitalize">{m.replace("_"," ")}</p>
                <p className="text-xs text-muted-foreground">
                  {m === "homepage" && "Only crawl the homepage."}
                  {m === "entire_site" && "Crawl every reachable page under the root URL."}
                  {m === "selected" && "Only crawl the pages you list below."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        {mode === "selected" && (
          <div>
            <Label className="text-xs">Pages (one URL per line)</Label>
            <Textarea rows={4} value={pages} onChange={(e) => setPages(e.target.value)} placeholder="https://…" />
          </div>
        )}
        <div className="flex justify-end"><Button onClick={run} disabled={create.isPending}><Sparkles className="h-4 w-4 mr-1.5" />Start import</Button></div>
      </CardContent></Card>

      <Card><CardContent className="p-0 divide-y divide-border">
        {isLoading && <p className="text-sm text-muted-foreground p-8 text-center">Loading imports…</p>}
        {!isLoading && imports.length === 0 && <p className="text-sm text-muted-foreground p-8 text-center">No imports yet.</p>}
        {imports.map((w) => (
          <div key={w.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{w.rootUrl}</p>
              <p className="text-xs text-muted-foreground">Mode: {w.mode.replace("_"," ")} · {w.pages.length} page(s) · {new Date(w.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_META[w.status].variant} className={STATUS_META[w.status].className}>{STATUS_META[w.status].label}</Badge>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(w.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────
// Client-side scoring over the live remote knowledge base. When the real
// retrieval engine ships, this switches to a server RPC — the surface stays.
function SearchTab() {
  const [q, setQ] = useState("");
  const [colId, setColId] = useState<string>("all");
  const { data: collections = [] } = useKnowledgeCollections();
  const { data: sources = [] } = useKnowledgeSources();
  const { data: faqs = [] } = useFaqs();
  const { data: products = [] } = useProducts();
  const { data: services = [] } = useServices();

  const results = useMemo(() => {
    if (!q.trim()) return [] as { sourceId: string; sourceName: string; kind: KSourceKind; snippet: string; score: number }[];
    const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const score = (text: string) => {
      const t = text.toLowerCase(); let hits = 0;
      for (const tok of tokens) if (t.includes(tok)) hits++;
      return tokens.length ? hits / tokens.length : 0;
    };
    const out: { sourceId: string; sourceName: string; kind: KSourceKind; snippet: string; score: number }[] = [];
    for (const s of sources) {
      if (!s.active || s.status === "archived") continue;
      if (colId !== "all" && s.collectionId !== colId) continue;
      const sc = score([s.name, s.tags.join(" "), s.kind].join(" "));
      if (sc > 0) out.push({ sourceId: s.id, sourceName: s.name, kind: s.kind,
        snippet: `${s.name} · ${s.tags.slice(0,3).join(", ") || s.kind}`, score: Math.min(1, sc + 0.15) });
    }
    for (const f of faqs) {
      if (!f.active) continue;
      if (colId !== "all" && f.collectionId !== colId) continue;
      const sc = Math.max(score(f.question), score(f.answer) * 0.9);
      if (sc > 0) out.push({ sourceId: f.id, sourceName: f.question, kind: "faq", snippet: f.answer, score: Math.min(1, sc + 0.1) });
    }
    for (const p of products) {
      if (colId !== "all" && p.collectionId !== colId) continue;
      const sc = score([p.name, p.description, p.features.join(" "), p.category, p.price].join(" "));
      if (sc > 0) out.push({ sourceId: p.id, sourceName: p.name, kind: "product", snippet: p.description, score: Math.min(1, sc + 0.1) });
    }
    for (const sv of services) {
      if (colId !== "all" && sv.collectionId !== colId) continue;
      const sc = score([sv.name, sv.description, sv.features.join(" ")].join(" "));
      if (sc > 0) out.push({ sourceId: sv.id, sourceName: sv.name, kind: "service", snippet: sv.description, score: Math.min(1, sc + 0.1) });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 20);
  }, [q, colId, sources, faqs, products, services]);

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search across all your knowledge…" className="pl-8" />
          </div>
          <Select value={colId} onValueChange={setColId}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              {collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">Searches across sources, FAQs, products, and services in your active knowledge.</p>
      </CardContent></Card>

      {q.trim() && results.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No matches. Try a different phrasing or add a knowledge source.</CardContent></Card>
      )}
      <div className="space-y-2">
        {results.map((r) => {
          const Icon = KIND_ICON[r.kind] ?? FileText;
          return (
            <Card key={r.sourceId}><CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><Icon className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.sourceName}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.snippet}</p>
                </div>
              </div>
              <Badge variant="secondary">{Math.round(r.score * 100)}%</Badge>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── TEST ─────────────────────────────────────────────────────────────
// Heuristic responder while the real retrieval + LLM stage is not yet wired.
function TestTab() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const { data: agents = [] } = useAgents();
  const firstAgentId = agents[0]?.id;

  async function ask() {
    if (!q.trim() || !firstAgentId) return;
    setRunning(true);
    const { answerViaEngine } = await import("../data/aiEngine");
    const r = await answerViaEngine({ agentId: firstAgentId, text: q, testMode: true });
    setResult({
      question: q,
      answer: r.reply,
      confidence: r.confidence,
      processingMs: r.latencyMs,
      sources: (r.sources ?? []).map((s: any) => ({ sourceId: s.id, sourceName: s.name, score: s.score, kind: "chunk", snippet: "" })),
      missing: !!r.missingKnowledge,
      language: r.language,
      decision: r.decision,
      model: r.model,
      tokens: r.tokensEstimate,
      cost: r.estimatedCost,
    });
    setRunning(false);
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-500/40 bg-emerald-500/5"><CardContent className="p-4 text-sm">
        <p className="font-medium">Live retrieval sandbox</p>
        <p className="text-xs text-muted-foreground mt-1">Runs against your indexed knowledge base with the real AI engine. Sources, confidence, language and cost are actual.</p>
      </CardContent></Card>

      <Card><CardContent className="p-5 space-y-3">
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="e.g. What is your refund policy?" className="flex-1" />
          <Button onClick={ask} disabled={running || !q.trim()}>{running ? "Asking…" : "Ask"}</Button>
        </div>
      </CardContent></Card>

      {result && (
        <Card><CardContent className="p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Your question</p>
            <p className="text-sm font-medium mt-1">{result.question}</p>
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Answer</p>
            <p className="text-sm mt-1 leading-relaxed">{result.answer}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className={"text-lg font-semibold " + (result.confidence >= 0.7 ? "text-emerald-600" : result.confidence >= 0.4 ? "text-amber-600" : "text-destructive")}>{Math.round(result.confidence * 100)}%</p>
              <Progress value={result.confidence * 100} className="h-1.5 mt-2" />
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Processing time</p>
              <p className="text-lg font-semibold">{result.processingMs} ms</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Sources used</p>
              <p className="text-lg font-semibold">{result.sources.length}</p>
            </div>
          </div>
          {result.missing && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
              <p className="font-medium">Missing knowledge</p>
              <p className="text-xs text-muted-foreground mt-1">Your AI Employees don't have enough context to answer this well. Add a source or FAQ covering this topic.</p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <div className="rounded-lg bg-muted/40 px-2 py-1"><p className="text-muted-foreground">Language</p><p className="font-medium">{result.language}</p></div>
            <div className="rounded-lg bg-muted/40 px-2 py-1"><p className="text-muted-foreground">Decision</p><p className="font-medium">{result.decision}</p></div>
            <div className="rounded-lg bg-muted/40 px-2 py-1"><p className="text-muted-foreground">Model</p><p className="font-medium truncate">{result.model}</p></div>
            <div className="rounded-lg bg-muted/40 px-2 py-1"><p className="text-muted-foreground">Tokens · Cost</p><p className="font-medium">~{result.tokens} · ${(result.cost ?? 0).toFixed(5)}</p></div>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { data: sources = [] } = useKnowledgeSources();
  const { data: faqs = [] } = useFaqs();
  const { data: products = [] } = useProducts();
  const { data: services = [] } = useServices();
  const indexed = sources.filter(s => s.status === "indexed" || s.status === "ready").length;
  const totals = [
    ["Sources", sources.length],
    ["Indexed", indexed],
    ["FAQs", faqs.length],
    ["Products", products.length],
    ["Services", services.length],
  ] as const;

  const uploads: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000);
    const key = day.toISOString().slice(0, 10);
    const count = sources.filter(s => s.uploadedAt.slice(0, 10) === key).length;
    uploads.push({ day: key, count });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {totals.map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-4"><div className="text-2xl font-semibold">{v}</div><p className="text-xs text-muted-foreground mt-1">{l}</p></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-5 space-y-3">
        <p className="font-semibold text-sm">Uploads (last 7 days)</p>
        <div className="flex items-end gap-2 h-24">
          {uploads.map((u) => (
            <div key={u.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary/70 rounded-t" style={{ height: `${Math.max(4, u.count * 20)}px` }} />
              <p className="text-[10px] text-muted-foreground">{u.day.slice(5)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Usage & retrieval analytics (most-used sources, missing knowledge, low-confidence answers) unlock once the retrieval engine is connected.</p>
      </CardContent></Card>
    </div>
  );
}