import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SocialTopicCategory } from "@/types/socialMedia";

const COLORS = [
  "#10B981", "#F59E0B", "#F97316", "#F87171", "#8B5CF6",
  "#3B82F6", "#06B6D4", "#84CC16", "#EC4899", "#9CA3AF",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; color?: string }) => void;
  editing?: SocialTopicCategory | null;
}

export function TopicCategoryModal({ open, onClose, onSave, editing }: Props) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[COLORS.length - 1]);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setColor(editing.color || COLORS[COLORS.length - 1]);
    } else {
      setTitle("");
      setColor(COLORS[COLORS.length - 1]);
    }
  }, [editing, open]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), color });
    setTitle("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <div className="relative">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="Enter category name"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {title.length} / 100
              </span>
            </div>
          </div>
          <div>
            <Label>Select Color</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className="w-9 h-9 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "hsl(var(--primary))" : "transparent",
                    transform: color === c ? "scale(1.1)" : "scale(1)",
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            {editing ? "Save" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
