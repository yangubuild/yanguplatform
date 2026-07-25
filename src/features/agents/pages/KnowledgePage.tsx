import { useMemo, useState } from "react";
import {
  Plus, FileText, Link2, HelpCircle, File, Search, Sparkles, Package, Wrench,
  Globe, Trash2, History, Archive, RotateCcw, ShieldCheck, Upload, ChevronDown, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { db } from "../data/mock";
import type {
  KSource, KSourceKind, KSourceStatus, KPermission, KCollection, KFAQ,
  KProduct, KService, KTestResult,
} from "../data/types";
import { PageHeader } from "../components/PageHeader";
import { toast } from "@/hooks/use-toast";

const KIND_ICON: Record<KSourceKind, typeof FileText> = {
  pdf: FileText, docx: FileText, txt: FileText, csv: FileText, url: Link2, faq: HelpCircle,
  product: Package, service: Wrench, policy: ShieldCheck, sop: File, manual: File, note: File,
};

const STATUS_META: Record<KSourceStatus, { label: string; variant: "secondary" | "outline" | "destructive"; className?: string }> = {
  uploading:  { label: "Uploading",  variant: "outline",     className: "text-sky-600 border-sky-500/40" },
  processing: { label: "Processing", variant: "outline",     className: "text-amber-600 border-amber-500/40" },
  indexed:    { label: "Indexed",    variant: "secondary" },
  ready:      { label: "Ready",      variant: "secondary" },
  failed:     { label: "Failed",     variant: "destructive" },
  archived:   { label: "Archived",   variant: "outline",     className: "text-muted-foreground" },
};

const PERMISSION_LABEL: Record<KPermission, string> = {
  all: "All AI Employees",
  sales: "Sales Agent only",
  support: "Support Agent only",
  receptionist: "Receptionist only",
  internal: "Internal Knowledge Agent",
  custom: "Custom",
};

const LANGUAGES = ["English","Swahili","French","Arabic","Portuguese","Amharic"];

export default function KnowledgePage() {
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

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

        <TabsContent value="sources" className="mt-5"><SourcesTab onChange={refresh} /></TabsContent>
        <TabsContent value="collections" className="mt-5"><CollectionsTab onChange={refresh} /></TabsContent>
        <TabsContent value="faqs" className="mt-5"><FaqTab onChange={refresh} /></TabsContent>
        <TabsContent value="products" className="mt-5"><ProductsTab onChange={refresh} /></TabsContent>
        <TabsContent value="services" className="mt-5"><ServicesTab onChange={refresh} /></TabsContent>
        <TabsContent value="website" className="mt-5"><WebsiteTab onChange={refresh} /></TabsContent>
        <TabsContent value="search" className="mt-5"><SearchTab /></TabsContent>
        <TabsContent value="test" className="mt-5"><TestTab /></TabsContent>
        <TabsContent value="analytics" className="mt-5"><AnalyticsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── SOURCES ──────────────────────────────────────────────────────────
function SourcesTab({ onChange }: { onChange: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCol, setFilterCol] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "archived">("all");
  const [query, setQuery] = useState("");
  const collections = db.knowledge.collections.list();
  const sources = db.knowledge.sources.list().filter((s) => {
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
        {sources.length === 0 && <p className="text-sm text-muted-foreground p-8 text-center">No sources match your filters.</p>}
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
                  <SourceMenu source={s} onChange={onChange} />
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
                  <SourceDetail source={s} onChange={onChange} />
                </div>
              )}
            </div>
          );
        })}
      </CardContent></Card>

      <AddSourceDialog open={addOpen} onOpenChange={setAddOpen} onDone={onChange} />
    </div>
  );
}

function SourceMenu({ source, onChange }: { source: KSource; onChange: () => void }) {
  return (
    <div className="flex gap-1">
      <Button variant="outline" size="sm" onClick={() => {
        db.knowledge.sources.addVersion(source.id, "Manual re-upload");
        toast({ title: "New version queued", description: `${source.name} is being re-indexed.` });
        onChange();
      }}><Upload className="h-4 w-4 mr-1" />Re-upload</Button>
      {source.status === "archived" ? (
        <Button variant="outline" size="sm" onClick={() => { db.knowledge.sources.restore(source.id); toast({ title: "Restored" }); onChange(); }}>
          <RotateCcw className="h-4 w-4 mr-1" />Restore
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => { db.knowledge.sources.archive(source.id); toast({ title: "Archived" }); onChange(); }}>
          <Archive className="h-4 w-4 mr-1" />Archive
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${source.name}?`)) { db.knowledge.sources.remove(source.id); toast({ title: "Deleted" }); onChange(); } }}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SourceDetail({ source, onChange }: { source: KSource; onChange: () => void }) {
  const collections = db.knowledge.collections.list();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Collection</Label>
          <Select value={source.collectionId} onValueChange={(v) => { db.knowledge.sources.update(source.id, { collectionId: v }); onChange(); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Language</Label>
          <Select value={source.language} onValueChange={(v) => { db.knowledge.sources.update(source.id, { language: v }); onChange(); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Permission</Label>
          <Select value={source.permission} onValueChange={(v) => { db.knowledge.sources.setPermission(source.id, v as KPermission); onChange(); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(PERMISSION_LABEL) as KPermission[]).map((p) =>
                <SelectItem key={p} value={p}>{PERMISSION_LABEL[p]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs flex items-center gap-1"><History className="h-3 w-3" />Version history</Label>
        <div className="mt-2 rounded-lg border border-border divide-y divide-border">
          {source.history.slice().reverse().map((v) => (
            <div key={v.id} className="flex items-center justify-between px-3 py-2 text-xs">
              <div>
                <span className="font-medium">v{v.version}</span> · {v.note} · {v.size} · {new Date(v.createdAt).toLocaleString()}
                <Badge variant={STATUS_META[v.status].variant} className={"ml-2 " + (STATUS_META[v.status].className ?? "")}>{STATUS_META[v.status].label}</Badge>
              </div>
              <div className="flex gap-1">
                {v.version !== source.version && (
                  <Button variant="outline" size="sm" onClick={() => { db.knowledge.sources.restoreVersion(source.id, v.id); toast({ title: `Restoring v${v.version}` }); onChange(); }}>
                    <RotateCcw className="h-3 w-3 mr-1" />Restore
                  </Button>
                )}
                {v.status !== "archived" && v.version !== source.version && (
                  <Button variant="ghost" size="sm">Archive</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddSourceDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; onDone: () => void }) {
  const collections = db.knowledge.collections.list();
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
    db.knowledge.sources.add({
      name: finalName, kind, collectionId, language, permission,
      sourceUrl: kind === "url" ? urlOrText : undefined,
      size: kind === "faq" ? "1 entry" : kind === "url" ? "1 page" : "—",
    });
    toast({ title: "Source added", description: "Processing will complete shortly." });
    setName(""); setUrlOrText(""); onOpenChange(false); onDone();
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Button onClick={submit}>Add source</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── COLLECTIONS ──────────────────────────────────────────────────────
function CollectionsTab({ onChange }: { onChange: () => void }) {
  const collections = db.knowledge.collections.list();
  const sources = db.knowledge.sources.list();
  const agents = db.agents.list();
  const [editing, setEditing] = useState<KCollection | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1.5" />New collection</Button></div>
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
                <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${c.name}?`)) { db.knowledge.collections.remove(c.id); onChange(); } }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent></Card>
          );
        })}
      </div>

      <CollectionEditor open={!!editing} value={editing} agents={agents}
        onOpenChange={(v) => !v && setEditing(null)}
        onSave={(agentIds) => { if (editing) { db.knowledge.collections.assignAgents(editing.id, agentIds); toast({ title: "Agents updated" }); onChange(); setEditing(null); } }} />
      <CollectionCreator open={creating} onOpenChange={setCreating}
        onSave={(v) => { db.knowledge.collections.add(v); toast({ title: "Collection created" }); onChange(); setCreating(false); }} />
    </div>
  );
}

function CollectionEditor({ open, onOpenChange, value, agents, onSave }:{
  open: boolean; onOpenChange: (v: boolean) => void; value: KCollection | null;
  agents: { id: string; name: string; type: string }[]; onSave: (agentIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  useMemo(() => { setSelected(value?.agentIds ?? []); }, [value?.id]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Assign to AI Employees</DialogTitle></DialogHeader>
        <div className="space-y-2">
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
          <Button onClick={() => onSave(selected)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CollectionCreator({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (v: Partial<KCollection>) => void }) {
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
          <Button onClick={() => { if (!name.trim()) return; onSave({ name, description: desc }); setName(""); setDesc(""); }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── FAQs ─────────────────────────────────────────────────────────────
function FaqTab({ onChange }: { onChange: () => void }) {
  const collections = db.knowledge.collections.list();
  const faqs = db.knowledge.faqs.list();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(""); const [a, setA] = useState("");
  const [cat, setCat] = useState("General"); const [colId, setColId] = useState(collections[0]?.id ?? "");
  const [lang, setLang] = useState("English");

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add FAQ</Button></div>
      <Card><CardContent className="p-0 divide-y divide-border">
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
              <Switch checked={f.active} onCheckedChange={(v) => { db.knowledge.faqs.update(f.id, { active: v }); onChange(); }} />
              <Button variant="ghost" size="icon" onClick={() => { db.knowledge.faqs.remove(f.id); onChange(); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {faqs.length === 0 && <p className="text-sm text-muted-foreground p-8 text-center">No FAQs yet.</p>}
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
                <Select value={colId} onValueChange={setColId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!q.trim() || !a.trim()) { toast({ title: "Question and answer are required", variant: "destructive" }); return; }
              db.knowledge.faqs.add({ question: q, answer: a, category: cat, language: lang, collectionId: colId });
              setQ(""); setA(""); setOpen(false); onChange();
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────
function ProductsTab({ onChange }: { onChange: () => void }) {
  const products = db.knowledge.products.list();
  const collections = db.knowledge.collections.list();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add product</Button></div>
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
              <Button variant="ghost" size="icon" onClick={() => { db.knowledge.products.remove(p.id); onChange(); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
      <ProductDialog open={open} onOpenChange={setOpen} collections={collections} onDone={onChange} />
    </div>
  );
}

function ProductDialog({ open, onOpenChange, collections, onDone }: {
  open: boolean; onOpenChange: (v:boolean)=>void; collections: KCollection[]; onDone: () => void;
}) {
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [price, setPrice] = useState(""); const [cat, setCat] = useState("General");
  const [features, setFeatures] = useState("");
  const [availability, setAvailability] = useState<KProduct["availability"]>("in_stock");
  const [colId, setColId] = useState(collections[0]?.id ?? "");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Select value={colId} onValueChange={setColId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
            db.knowledge.products.add({
              name, description: desc, price, category: cat, availability, collectionId: colId,
              features: features.split("\n").map(s => s.trim()).filter(Boolean),
            });
            setName(""); setDesc(""); setPrice(""); setFeatures(""); onOpenChange(false); onDone();
          }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SERVICES ─────────────────────────────────────────────────────────
function ServicesTab({ onChange }: { onChange: () => void }) {
  const services = db.knowledge.services.list();
  const collections = db.knowledge.collections.list();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [price, setPrice] = useState(""); const [features, setFeatures] = useState("");
  const [avail, setAvail] = useState<KService["availability"]>("available");
  const [colId, setColId] = useState(collections[0]?.id ?? "");

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add service</Button></div>
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
              <Button variant="ghost" size="icon" onClick={() => { db.knowledge.services.remove(s.id); onChange(); }}><Trash2 className="h-4 w-4" /></Button>
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
              <Select value={colId} onValueChange={setColId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
              db.knowledge.services.add({
                name, description: desc, price, availability: avail, collectionId: colId,
                features: features.split("\n").map(s => s.trim()).filter(Boolean),
              });
              setName(""); setDesc(""); setPrice(""); setFeatures(""); setOpen(false); onChange();
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── WEBSITE IMPORT ───────────────────────────────────────────────────
function WebsiteTab({ onChange }: { onChange: () => void }) {
  const imports = db.knowledge.websiteImports.list();
  const collections = db.knowledge.collections.list();
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"homepage" | "entire_site" | "selected">("homepage");
  const [pages, setPages] = useState("");
  const [colId, setColId] = useState(collections[0]?.id ?? "");

  function run() {
    if (!url.trim()) { toast({ title: "Root URL is required", variant: "destructive" }); return; }
    const pageList = mode === "selected"
      ? pages.split("\n").map(p => p.trim()).filter(Boolean)
      : mode === "entire_site" ? [`${url}/*`] : [url];
    db.knowledge.websiteImports.add({ rootUrl: url, mode, collectionId: colId, pages: pageList });
    toast({ title: "Website import queued", description: `${pageList.length} page(s) will be crawled.` });
    setUrl(""); setPages(""); onChange();
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
            <Select value={colId} onValueChange={setColId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
        <div className="flex justify-end"><Button onClick={run}><Sparkles className="h-4 w-4 mr-1.5" />Start import</Button></div>
      </CardContent></Card>

      <Card><CardContent className="p-0 divide-y divide-border">
        {imports.map((w) => (
          <div key={w.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{w.rootUrl}</p>
              <p className="text-xs text-muted-foreground">Mode: {w.mode.replace("_"," ")} · {w.pages.length} page(s) · {new Date(w.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_META[w.status].variant} className={STATUS_META[w.status].className}>{STATUS_META[w.status].label}</Badge>
              <Button variant="ghost" size="icon" onClick={() => { db.knowledge.websiteImports.remove(w.id); onChange(); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {imports.length === 0 && <p className="text-sm text-muted-foreground p-8 text-center">No imports yet.</p>}
      </CardContent></Card>
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────
function SearchTab() {
  const [q, setQ] = useState("");
  const [colId, setColId] = useState<string>("all");
  const collections = db.knowledge.collections.list();
  const results = useMemo(() => q.trim() ? db.knowledge.search(q, colId === "all" ? undefined : { collectionId: colId }) : [], [q, colId]);

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
function TestTab() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<KTestResult | null>(null);
  const [running, setRunning] = useState(false);

  function ask() {
    if (!q.trim()) return;
    setRunning(true);
    setTimeout(() => {
      const r = db.knowledge.test(q);
      setResult(r); setRunning(false);
    }, 400);
  }

  return (
    <div className="space-y-4">
      <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="p-4 text-sm">
        <p className="font-medium">Admin-only sandbox</p>
        <p className="text-xs text-muted-foreground mt-1">Ask questions to test your knowledge base. Nothing here is shown to customers.</p>
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
          {result.sources.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Sources</p>
              <div className="space-y-2">
                {result.sources.map((s) => {
                  const Icon = KIND_ICON[s.kind] ?? FileText;
                  return (
                    <div key={s.sourceId} className="flex items-start justify-between gap-3 border border-border rounded-lg p-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.sourceName}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{s.snippet}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{Math.round(s.score * 100)}%</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────
function AnalyticsTab() {
  const a = db.knowledge.analytics();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["Sources", a.totals.sources],
          ["Indexed", a.totals.indexed],
          ["FAQs", a.totals.faqs],
          ["Products", a.totals.products],
          ["Services", a.totals.services],
        ].map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-4"><div className="text-2xl font-semibold">{v}</div><p className="text-xs text-muted-foreground mt-1">{l}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-5 space-y-3">
          <p className="font-semibold text-sm">Most used sources</p>
          <div className="space-y-2">
            {a.mostUsedSources.length === 0 && <p className="text-xs text-muted-foreground">Not enough test data yet.</p>}
            {a.mostUsedSources.map((s) => (
              <div key={s.sourceId} className="flex items-center justify-between text-sm">
                <span className="truncate">{s.name}</span>
                <Badge variant="secondary">{s.uses}</Badge>
              </div>
            ))}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5 space-y-3">
          <p className="font-semibold text-sm">Top searches</p>
          <div className="space-y-2">
            {a.topSearches.map((s) => (
              <div key={s.query} className="flex items-center justify-between text-sm">
                <span className="truncate">{s.query}</span>
                <Badge variant="secondary">{s.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5 space-y-3">
          <p className="font-semibold text-sm">Unanswered questions</p>
          <div className="space-y-2">
            {a.unanswered.length === 0 && <p className="text-xs text-muted-foreground">No unanswered questions.</p>}
            {a.unanswered.map((u) => (
              <div key={u.query} className="flex items-center justify-between text-sm">
                <span className="truncate">{u.query}</span>
                <span className="text-xs text-muted-foreground">×{u.count} · {new Date(u.lastAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5 space-y-3">
          <p className="font-semibold text-sm">Low-confidence answers</p>
          <div className="space-y-2">
            {a.lowConfidence.length === 0 && <p className="text-xs text-muted-foreground">No low-confidence answers.</p>}
            {a.lowConfidence.map((l) => (
              <div key={l.query + l.at} className="flex items-center justify-between text-sm">
                <span className="truncate">{l.query}</span>
                <Badge variant="outline" className="text-amber-600 border-amber-500/40">{Math.round(l.confidence * 100)}%</Badge>
              </div>
            ))}
          </div>
        </CardContent></Card>
        <Card className="md:col-span-2"><CardContent className="p-5 space-y-3">
          <p className="font-semibold text-sm">Missing knowledge areas</p>
          <div className="flex flex-wrap gap-2">
            {a.missingAreas.map((m) => <Badge key={m} variant="outline" className="text-amber-600 border-amber-500/40">{m}</Badge>)}
          </div>
        </CardContent></Card>
        <Card className="md:col-span-2"><CardContent className="p-5 space-y-3">
          <p className="font-semibold text-sm">Uploads (last 7 days)</p>
          <div className="flex items-end gap-2 h-24">
            {a.uploads.map((u) => (
              <div key={u.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary/70 rounded-t" style={{ height: `${Math.max(4, u.count * 20)}px` }} />
                <p className="text-[10px] text-muted-foreground">{u.day.slice(5)}</p>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}