import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Link2, HelpCircle, File } from "lucide-react";
import { db } from "../data/mock";
import { PageHeader } from "../components/PageHeader";

const typeIcon = { doc: FileText, url: Link2, faq: HelpCircle, file: File };

export default function KnowledgePage() {
  const [open, setOpen] = useState(false);
  const items = db.knowledge.list();
  return (
    <div className="space-y-5">
      <PageHeader title="Knowledge" description="What your agents know."
        actions={<Button onClick={()=>setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add source</Button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((k) => {
          const Icon = typeIcon[k.type];
          return (
            <Card key={k.id}><CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Icon className="h-4 w-4" /></div>
                  <div><p className="font-semibold text-sm">{k.title}</p><p className="text-xs text-muted-foreground">{k.type} · {k.size}</p></div>
                </div>
                <Badge variant={k.status==="indexed"?"secondary":k.status==="processing"?"outline":"destructive"} className="capitalize">{k.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Used by {k.agents.length} agent(s) · Updated {new Date(k.updatedAt).toLocaleDateString()}</p>
              <Button variant="outline" size="sm" className="w-full">Attach to agent</Button>
            </CardContent></Card>
          );
        })}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add source</DialogTitle></DialogHeader>
          <Tabs defaultValue="upload" className="mt-2">
            <TabsList className="grid grid-cols-4 w-full"><TabsTrigger value="upload">Upload</TabsTrigger><TabsTrigger value="url">URL</TabsTrigger><TabsTrigger value="text">Text/FAQ</TabsTrigger><TabsTrigger value="drive">Drive</TabsTrigger></TabsList>
            <TabsContent value="upload" className="pt-4"><div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">Drop files or click to upload</div></TabsContent>
            <TabsContent value="url" className="pt-4"><Input placeholder="https://…" /></TabsContent>
            <TabsContent value="text" className="pt-4"><Textarea rows={6} placeholder="Paste text or FAQ pairs…" /></TabsContent>
            <TabsContent value="drive" className="pt-4"><Button variant="outline" className="w-full">Connect Google Drive</Button></TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}