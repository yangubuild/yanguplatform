import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SupportContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { value: "general", label: "General Question" },
  { value: "account", label: "Account Issue" },
  { value: "billing", label: "Billing & Subscription" },
  { value: "publishing", label: "Publishing & Surfaces" },
  { value: "kyc", label: "KYC / Verification" },
  { value: "technical", label: "Technical / Bug Report" },
  { value: "other", label: "Other" },
];

export function SupportContactModal({ open, onOpenChange }: SupportContactModalProps) {
  const { user, profile } = useAuth();
  const [name, setName] = useState((profile as any)?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please describe your issue");
      return;
    }
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    setSubmitting(true);
    try {
      // Create ticket
      const { data: ticket, error: ticketErr } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: `${CATEGORIES.find(c => c.value === category)?.label || "Support"}: ${description.slice(0, 80)}`,
          description,
          category,
          status: "agent_required",
          priority: "normal",
        })
        .select("id")
        .single();

      if (ticketErr) throw ticketErr;

      // Add initial message
      await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_type: "user",
        sender_id: user.id,
        content: `**Contact Form Submission**\n\n**Name:** ${name}\n**Email:** ${email}\n**Category:** ${CATEGORIES.find(c => c.value === category)?.label}\n\n${description}`,
      });

      // Send confirmation email to user
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "support-ticket-received",
          recipientEmail: email || user.email,
          idempotencyKey: `support-confirm-${ticket.id}`,
          templateData: {
            name: name || undefined,
            category: CATEGORIES.find(c => c.value === category)?.label,
            ticketId: ticket.id,
          },
        },
      });

      toast.success("Support request submitted! Our team will respond soon.");
      setDescription("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-lg font-semibold">Submit a Support Request</DialogTitle>
        <p className="text-xs text-muted-foreground -mt-2">
          Describe your issue and our team will follow up.
        </p>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Describe your issue</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe what you need help with..."
              rows={4}
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-accent transition-colors resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
