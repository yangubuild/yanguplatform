import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePlus, ExternalLink } from "lucide-react";

interface BlogEventEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlogEventEditor({ open, onOpenChange }: BlogEventEditorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Event Editor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="Header Title">
            <Input placeholder="Event name…" />
          </Field>
          <Field label="Description">
            <Textarea placeholder="Event details…" rows={3} />
          </Field>
          <Field label="Image">
            <div className="flex items-center justify-center h-24 rounded-md border border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Upload image</span>
              </div>
            </div>
          </Field>
          <Field label="Event Date">
            <Input type="date" />
          </Field>
          <Field label="Registration Link">
            <Input placeholder="https://…" />
          </Field>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" className="gap-1.5" disabled>
            <ExternalLink className="h-3.5 w-3.5" /> Open Registration Page
          </Button>
          <Button disabled>Save Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
