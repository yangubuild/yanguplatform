import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SocialTopicCategory } from "@/types/socialMedia";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description?: string; category_id?: string }) => void;
  categories: SocialTopicCategory[];
  defaultCategoryId?: string;
  isSaving?: boolean;
}

export function TopicEditorModal({ open, onClose, onSave, categories, defaultCategoryId, isSaving }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() || undefined, category_id: categoryId || undefined });
    setTitle("");
    setDescription("");
    setCategoryId("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Topic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Title</Label>
            <div className="relative mt-1.5">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                placeholder="Title of the topic"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {title.length} / 50
              </span>
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Couple sentence explanation of your topic. This will be used as the starting point for a new post."
              className="mt-1.5 min-h-[100px]"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <span className="text-sm">Import Topics</span>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
