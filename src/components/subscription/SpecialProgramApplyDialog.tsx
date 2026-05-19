import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, FileText, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ProgramType = "student" | "campus" | "non_profit";

const TYPE_LABELS: Record<ProgramType, string> = {
  student: "Student",
  campus: "Campus",
  non_profit: "Non-Profit",
};

const REQUIRED_DOCS: Record<ProgramType, string[]> = {
  student: ["Student ID", "Enrollment Proof"],
  campus: ["Institution verification letter", "Admin/official authorization document"],
  non_profit: ["Registration certificate", "Tax / NGO verification", "Supporting organization proof"],
};

interface Props {
  open: boolean;
  type: ProgramType;
  onOpenChange: (open: boolean) => void;
}

type UploadedDoc = { label: string; path: string; name: string };

export function SpecialProgramApplyDialog({ open, type, onOpenChange }: Props) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [consent, setConsent] = useState(false);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    organization_name: "",
    country: "",
    phone: "",
    website: "",
    role: "",
    explanation: "",
  });
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const requiredDocs = REQUIRED_DOCS[type];

  const handleFile = async (label: string, file: File) => {
    if (!file) return;
    setUploading(label);
    try {
      const folder = user?.id ?? "anon";
      const path = `${folder}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("special-program-docs")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      setDocs((prev) => [...prev.filter((d) => d.label !== label), { label, path, name: file.name }]);
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const removeDoc = (label: string) => setDocs((prev) => prev.filter((d) => d.label !== label));

  const reset = () => {
    setForm({ full_name: "", email: "", organization_name: "", country: "", phone: "", website: "", role: "", explanation: "" });
    setDocs([]);
    setConsent(false);
    setSuccess(false);
  };

  const submit = async () => {
    if (!form.full_name || !form.email || !form.organization_name) {
      toast.error("Please fill in required fields");
      return;
    }
    if (docs.length < requiredDocs.length) {
      toast.error("Please upload all required documents");
      return;
    }
    if (!consent) {
      toast.error("Please confirm the consent checkbox");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("special_program_applications").insert({
        user_id: user?.id ?? null,
        ...form,
        application_type: type,
        uploaded_documents: docs,
        consent_given: consent,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <DialogTitle className="text-xl mb-2">Application Received</DialogTitle>
            <p className="text-sm text-muted-foreground mb-6">
              Our YANGU team will review your application and get back to you if you qualify.
            </p>
            <button
              onClick={() => handleClose(false)}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Apply for YANGU for {TYPE_LABELS[type]}</DialogTitle>
              <DialogDescription>Fill in the form below. Our team reviews applications within 5–7 business days.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Name *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                <Field label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Organization / School *" value={form.organization_name} onChange={(v) => setForm({ ...form, organization_name: v })} />
                <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
                <Field label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="Website (optional)" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
                <Field label="Role / Position" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
                <div>
                  <Label className="text-xs mb-1.5 block">Application Type</Label>
                  <Input value={TYPE_LABELS[type]} readOnly className="bg-muted/40 cursor-not-allowed" />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Why are you applying?</Label>
                <Textarea
                  rows={3}
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  placeholder="Tell us briefly about your needs and how YANGU will help."
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Required Documents</Label>
                {requiredDocs.map((label) => {
                  const uploaded = docs.find((d) => d.label === label);
                  return (
                    <div key={label} className="rounded-lg border border-dashed border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          {uploaded ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                              <FileText className="w-3 h-3 shrink-0" /> {uploaded.name}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-0.5">PDF, PNG, or JPG</p>
                          )}
                        </div>
                        {uploaded ? (
                          <button onClick={() => removeDoc(label)} className="text-muted-foreground hover:text-foreground p-1">
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <input
                              ref={(el) => (fileRefs.current[label] = el)}
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleFile(label, e.target.files[0])}
                            />
                            <button
                              onClick={() => fileRefs.current[label]?.click()}
                              disabled={uploading === label}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {uploading === label ? "Uploading..." : "Upload"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
                <span className="text-xs text-muted-foreground">
                  I confirm the submitted information is valid and YANGU may review my application.
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => handleClose(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-xs mb-1.5 block">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
