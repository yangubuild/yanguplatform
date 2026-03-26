import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageSquare, BookOpen, Mail, Newspaper, Users, Shield, ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/primitives/MarketingShell";
import { LandingTestFooter } from "@/components/landing-test/LandingTestFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import yanguLogo from "@/assets/yangu-logo-full.png";

/* ── Contact Support Modal ── */
function ContactSupportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in subject and message");
      return;
    }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to submit a support request");
        setSending(false);
        return;
      }
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: subject.trim(),
        description: message.trim(),
        category,
        status: "pending",
        priority: "normal",
      });
      if (error) throw error;

      // Send acknowledgement email to support@yangu.io
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "support-ticket-confirmation",
          recipientEmail: user.email,
          idempotencyKey: `support-confirm-${Date.now()}`,
          templateData: { subject: subject.trim(), category },
        },
      }).catch(() => {});

      toast.success("Support request submitted! We'll get back to you soon.");
      setSubject("");
      setMessage("");
      setCategory("general");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit request");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">Contact Support</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Estimated response time: instant for AI, within 24 hours for human support.
          <br />
          <span className="text-xs">Or email us directly at <a href="mailto:support@yangu.io" className="underline">support@yangu.io</a></span>
        </p>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="general">General</option>
              <option value="billing">Billing & Payments</option>
              <option value="kyc">KYC / Verification</option>
              <option value="publishing">Publishing & Surfaces</option>
              <option value="account">Account & Security</option>
              <option value="technical">Technical Issue</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Subject *</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="bg-muted border-border"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Message *</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={4}
              className="bg-muted border-border resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={sending}
              size="sm"
              className="text-white"
              style={{ background: "#F46D2A" }}>
              {sending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Support Page ── */
export default function SupportPage() {
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/help-center?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleOpenSupportChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate("/dashboard/messages", { state: { openChannel: "support" } });
    } else {
      navigate("/auth/login", { state: { redirectAfterLogin: "/dashboard/messages", openChannel: "support" } });
    }
  };

  const handleOpenCommunity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate("/dashboard/community");
    } else {
      navigate("/auth/login", { state: { redirectAfterLogin: "/dashboard/community" } });
    }
  };

  const cards = [
    {
      icon: MessageSquare,
      title: "Ask YANGU Support",
      description: "Instant support inside the platform for setup help, troubleshooting, and urgent questions.",
      cta: "Open Support Chat",
      action: handleOpenSupportChat,
    },
    {
      icon: BookOpen,
      title: "Help Center",
      description: "Step-by-step guides, FAQs, onboarding help, and platform documentation.",
      cta: "Open Help Center",
      action: () => navigate("/help-center"),
    },
    {
      icon: Mail,
      title: "Contact Support",
      description: "Send a support request for billing, KYC, publishing, account, or technical issues.",
      cta: "Email Support",
      action: () => setContactOpen(true),
    },
  ];

  const resources = [
    { icon: Newspaper, label: "Platform Updates", description: "Latest features and improvements", action: () => navigate("/updates") },
    { icon: Users, label: "Community", description: "Connect with other YANGU users", action: handleOpenCommunity },
    { icon: Shield, label: "Safety & Policies", description: "AI Safety, Terms, and Privacy", action: () => navigate("/aisafety") },
  ];

  return (
    <MarketingShell
      header={
        <header className="w-full px-6 py-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <img
              src={yanguLogo}
              alt="yangu"
              className="h-12 w-auto cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => navigate("/")}
            />
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => navigate("/dashboard/home")}>
              Dashboard
            </Button>
          </div>
        </header>
      }
      footer={
        <div className="max-w-[1200px] mx-auto px-6">
          <LandingTestFooter />
        </div>
      }>

      {/* ── SECTION 1: Hero / Search ── */}
      <section className="pt-16 pb-12 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
          Help & Support
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto mb-8">
          Find answers, get help, or reach our team.
        </p>
        <div className="max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Ask anything..."
            className="w-full pl-11 pr-12 py-3.5 rounded-full text-sm bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <ArrowRight className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      </section>

      {/* ── SECTION 2: 3 Primary Support Cards ── */}
      <section className="max-w-[1000px] mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <button
              key={card.title}
              onClick={card.action}
              className="group text-left p-6 rounded-xl border border-border transition-colors hover:border-primary/30"
              style={{ background: "rgba(255,255,255,0.02)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}>
              <card.icon className="w-6 h-6 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-1.5">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{card.description}</p>
              <span className="text-sm font-medium inline-flex items-center gap-1" style={{ color: "#F46D2A" }}>
                {card.cta} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: Additional Resources ── */}
      <section className="max-w-[1000px] mx-auto px-4 pb-20">
        <h2 className="text-xl font-semibold text-foreground text-center mb-8">More Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {resources.map((r) => (
            <button
              key={r.label}
              onClick={r.action}
              className="text-left p-5 rounded-xl border border-border/50 transition-colors hover:border-border"
              style={{ background: "rgba(255,255,255,0.015)" }}>
              <r.icon className="w-5 h-5 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-0.5">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.description}</p>
            </button>
          ))}
        </div>
      </section>

      <ContactSupportModal open={contactOpen} onOpenChange={setContactOpen} />
    </MarketingShell>
  );
}
