import * as React from "react";
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
import { ImagePlus } from "lucide-react";

interface ContentCardFields {
  headerTitle: string;
  headerDescription: string;
  imageTitle: string;
  imageDescription: string;
  writerName: string;
  linkUrl: string;
  buttonLabel: string;
}

interface BlogContentCardEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<ContentCardFields>;
  title?: string;
}

const defaultValues: ContentCardFields = {
  headerTitle: "",
  headerDescription: "",
  imageTitle: "",
  imageDescription: "",
  writerName: "",
  linkUrl: "",
  buttonLabel: "",
};

export function BlogContentCardEditor({
  open,
  onOpenChange,
  initialValues,
  title = "Edit Content Card",
}: BlogContentCardEditorProps) {
  const [values, setValues] = React.useState<ContentCardFields>({
    ...defaultValues,
    ...initialValues,
  });

  const update = (key: keyof ContentCardFields, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="Header Title">
            <Input value={values.headerTitle} onChange={(e) => update("headerTitle", e.target.value)} placeholder="Section header…" />
          </Field>
          <Field label="Header Description">
            <Textarea value={values.headerDescription} onChange={(e) => update("headerDescription", e.target.value)} placeholder="Subtitle…" rows={2} />
          </Field>

          {/* Image upload placeholder */}
          <Field label="Image">
            <div className="flex items-center justify-center h-28 rounded-md border border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">Click to upload</span>
              </div>
            </div>
          </Field>

          <Field label="Image Title">
            <Input value={values.imageTitle} onChange={(e) => update("imageTitle", e.target.value)} placeholder="Alt text / title…" />
          </Field>
          <Field label="Image Description">
            <Textarea value={values.imageDescription} onChange={(e) => update("imageDescription", e.target.value)} placeholder="Caption…" rows={2} />
          </Field>

          {/* Writer */}
          <div className="grid grid-cols-[80px_1fr] gap-3 items-center">
            <div className="h-12 w-12 rounded-full border border-dashed border-border bg-muted/20 flex items-center justify-center">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
            </div>
            <Field label="Writer Name">
              <Input value={values.writerName} onChange={(e) => update("writerName", e.target.value)} placeholder="Author name…" />
            </Field>
          </div>

          <Field label="Link URL">
            <Input value={values.linkUrl} onChange={(e) => update("linkUrl", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Button Label">
            <Input value={values.buttonLabel} onChange={(e) => update("buttonLabel", e.target.value)} placeholder="Read more" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled>Save Card</Button>
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
