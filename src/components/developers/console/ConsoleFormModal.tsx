import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

/* ── Form Modal ─────────────────────────────────────────────── */

interface FormField {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox";
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  pattern?: RegExp;
  patternMessage?: string;
  min?: number;
}

interface ConsoleFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

export function ConsoleFormModal({
  open,
  onClose,
  title,
  fields,
  values,
  onChange,
  onSubmit,
  isSubmitting = false,
  errors = {},
}: ConsoleFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {fields.map((f) => (
            <div key={f.key}>
              <Label className="text-muted-foreground text-xs mb-1.5 block">{f.label}{f.required && " *"}</Label>
              {f.type === "select" ? (
                <select
                  value={String(values[f.key] ?? "")}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 text-foreground text-sm px-3"
                >
                  <option value="">Select…</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!values[f.key]}
                    onChange={(e) => onChange(f.key, e.target.checked)}
                    className="rounded border-white/20"
                  />
                  Enabled
                </label>
              ) : (
                <Input
                  type={f.type === "number" ? "number" : "text"}
                  placeholder={f.placeholder}
                  value={String(values[f.key] ?? "")}
                  onChange={(e) => onChange(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  min={f.min}
                  className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground text-sm h-9"
                />
              )}
              {errors[f.key] && <p className="text-red-400 text-xs mt-1">{errors[f.key]}</p>}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground" disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isSubmitting} variant="accent" className="gap-1.5">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Delete Confirm ─────────────────────────────────────────── */

interface ConsoleDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  itemName?: string;
}

export function ConsoleDeleteDialog({ open, onClose, onConfirm, isDeleting = false, itemName }: ConsoleDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Delete {itemName || "item"}?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This action cannot be undone. This will permanently remove this record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white/5 border-white/10 text-foreground hover:bg-white/10" disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-foreground gap-1.5">
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
