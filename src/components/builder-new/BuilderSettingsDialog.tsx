import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface BuilderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  onBusinessNameChange: (name: string) => void;
  category: string | null;
}

export function BuilderSettingsDialog({
  open,
  onOpenChange,
  businessName,
  onBusinessNameChange,
  category,
}: BuilderSettingsDialogProps) {
  const [name, setName] = useState(businessName);
  const [seoTitle, setSeoTitle] = useState(businessName || "My Website");
  const [seoDesc, setSeoDesc] = useState("");

  const handleSave = () => {
    if (name.trim()) onBusinessNameChange(name.trim());
    toast.success("Settings saved");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Site Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="biz-name">Business Name</Label>
              <Input id="biz-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <p className="text-sm text-muted-foreground capitalize">{category || "Website"}</p>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="seo-title">Page Title</Label>
              <Input id="seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="My Restaurant" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-desc">Meta Description</Label>
              <Input id="seo-desc" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="Delicious food..." />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
