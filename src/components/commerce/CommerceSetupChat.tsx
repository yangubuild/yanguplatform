/**
 * CommerceSetupChat — focused, deterministic Ada-style setup chat for
 * payment methods + WhatsApp support. Saves each answer immediately to
 * surface_commerce_config via useSurfaceCommerceConfig.upsert.
 *
 * NOT an LLM chat — the question machine is hard-coded for reliability.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSurfaceCommerceConfig } from "@/hooks/useSurfaceCommerceConfig";
import { toast } from "sonner";

type Msg = { id: string; role: "ada" | "user"; content: string };

type StepId =
  | "intro"
  | "methods"
  | "mm_country"
  | "mm_provider"
  | "mm_number"
  | "mm_name"
  | "stripe_account"
  | "stripe_key"
  | "paypal_email"
  | "whatsapp"
  | "done";

const COUNTRIES = ["Uganda", "Kenya", "Tanzania", "Rwanda", "Nigeria", "Ghana", "South Africa", "Other"];
const PROVIDERS = ["MTN MoMo", "Airtel Money", "M-Pesa", "Other"];

interface CommerceSetupChatProps {
  open: boolean;
  onClose: () => void;
  surfaceId: string;
  ownerId: string;
}

export function CommerceSetupChat({ open, onClose, surfaceId, ownerId }: CommerceSetupChatProps) {
  const navigate = useNavigate();
  const { config, upsert, isSaving } = useSurfaceCommerceConfig(surfaceId);

  const [step, setStep] = useState<StepId>("intro");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    // Already completed? Don't restart the wizard from the beginning.
    const alreadyComplete =
      !!config?.ordering_enabled &&
      Array.isArray(config?.payment_methods) &&
      config!.payment_methods.length > 0 &&
      !!config?.support_whatsapp;
    if (alreadyComplete) {
      setMessages([
        {
          id: "done-1",
          role: "ada",
          content:
            "Your payment setup is already complete. You can change any of these details anytime from your dashboard settings.",
        },
      ]);
      setStep("done");
      setTextValue("");
      return;
    }
    setMessages([
      {
        id: "intro-1",
        role: "ada",
        content:
          "Hi! I'm Ada. Let's set up how you'll receive payments and how customers reach you. This takes about a minute, and each answer saves as you go.",
      },
      {
        id: "intro-2",
        role: "ada",
        content: "How would you like customers to pay you? Pick any combination — they'll all appear at checkout.",
      },
    ]);
    setMethods(config?.payment_methods || []);
    setStep("methods");
    setTextValue("");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  const persist = async (partial: Record<string, unknown>) => {
    try {
      await upsert({ surface_id: surfaceId, owner_id: ownerId, ...partial } as any);
    } catch (e) {
      console.error("[CommerceSetupChat] save failed:", e);
      toast.error("Couldn't save that answer. We'll keep going — try again from Settings later.");
    }
  };

  const pushAda = (content: string) =>
    setMessages((m) => [...m, { id: `${Date.now()}-a`, role: "ada", content }]);
  const pushUser = (content: string) =>
    setMessages((m) => [...m, { id: `${Date.now()}-u`, role: "user", content }]);

  const toggleMethod = (key: string) => {
    setMethods((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  };

  // ───────── Step machine: advance() picks the next step from current state ─────────
  const advanceFromMethods = async () => {
    if (methods.length === 0) {
      toast.error("Pick at least one payment method.");
      return;
    }
    pushUser(methods.map(humanMethod).join(", "));
    await persist({
      payment_methods: methods,
      ordering_enabled: true,
      stripe_enabled: methods.includes("card"),
      paypal_enabled: methods.includes("paypal"),
    });
    nextAfterMethods();
  };

  const nextAfterMethods = () => {
    if (methods.includes("mobile_money")) {
      pushAda("Great. Which country is your Mobile Money account in?");
      setStep("mm_country");
    } else if (methods.includes("card")) {
      pushAda("Got it. What's your Stripe Account ID? It looks like `acct_…`.");
      setStep("stripe_account");
    } else if (methods.includes("paypal")) {
      pushAda("Perfect. What's the PayPal email customers should send to?");
      setStep("paypal_email");
    } else {
      askWhatsapp();
    }
  };

  const nextAfterMobileMoney = () => {
    if (methods.includes("card")) {
      pushAda("Now Stripe — what's your Stripe Account ID? (`acct_…`)");
      setStep("stripe_account");
    } else if (methods.includes("paypal")) {
      pushAda("And your PayPal email?");
      setStep("paypal_email");
    } else askWhatsapp();
  };

  const nextAfterStripe = () => {
    if (methods.includes("paypal")) {
      pushAda("Finally, your PayPal email?");
      setStep("paypal_email");
    } else askWhatsapp();
  };

  const askWhatsapp = () => {
    pushAda(
      "Almost done. What WhatsApp number should customers use to reach you about orders? Include the country code, e.g. +256 700 000 000.",
    );
    setStep("whatsapp");
  };

  const finish = () => {
    // Mark setup complete: ordering on = the banner's completion contract is
    // satisfied server-side, plus a local flag so the popup never reappears.
    void persist({ ordering_enabled: true });
    try {
      localStorage.setItem(`yangu_setup_complete_${surfaceId}`, "1");
    } catch { /* ignore */ }
    pushAda("All set! Your payment options are live. Want to edit your page design now?");
    setStep("done");
  };

  const handleSendText = async () => {
    const val = textValue.trim();
    if (!val) return;
    pushUser(val);
    setTextValue("");

    switch (step) {
      case "mm_number":
        await persist({ mobile_money_phone: val });
        pushAda("And what name is registered on that Mobile Money account?");
        setStep("mm_name");
        break;
      case "mm_name":
        await persist({ mobile_money_account_name: val });
        nextAfterMobileMoney();
        break;
      case "stripe_account":
        await persist({ stripe_account_id: val, stripe_enabled: true });
        pushAda("And your Stripe Publishable Key? It looks like `pk_live_…` or `pk_test_…`.");
        setStep("stripe_key");
        break;
      case "stripe_key":
        await persist({ stripe_publishable_key: val });
        nextAfterStripe();
        break;
      case "paypal_email":
        await persist({ paypal_email: val, paypal_enabled: true });
        askWhatsapp();
        break;
      case "whatsapp":
        await persist({ support_whatsapp: val, whatsapp_enabled: true });
        finish();
        break;
    }
  };

  const handleSelectAnswer = async (value: string) => {
    pushUser(value);
    switch (step) {
      case "mm_country":
        await persist({ mobile_money_country: value });
        pushAda("Which network?");
        setStep("mm_provider");
        break;
      case "mm_provider":
        await persist({ mobile_money_provider: value });
        pushAda("What's your Mobile Money number? Include the country code.");
        setStep("mm_number");
        break;
    }
  };

  const inputMode: "checkbox" | "select" | "text" | "none" = useMemo(() => {
    if (step === "methods") return "checkbox";
    if (step === "mm_country" || step === "mm_provider") return "select";
    if (step === "done" || step === "intro") return "none";
    return "text";
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 py-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
            </span>
            Ada — Payment Setup
          </DialogTitle>
        </DialogHeader>

        {/* Transcript */}
        <div ref={scrollRef} className="px-4 py-4 space-y-3 overflow-y-auto max-h-[55vh] min-h-[280px]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`text-sm rounded-lg px-3 py-2 max-w-[90%] whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
          ))}
          {isSaving && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border px-4 py-3 bg-background">
          {inputMode === "checkbox" && (
            <div className="space-y-2">
              {[
                { key: "cash", label: "Cash on Delivery" },
                { key: "mobile_money", label: "Mobile Money" },
                { key: "card", label: "Card / Stripe" },
                { key: "paypal", label: "PayPal" },
              ].map((m) => (
                <label key={m.key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox checked={methods.includes(m.key)} onCheckedChange={() => toggleMethod(m.key)} />
                  {m.label}
                </label>
              ))}
              <Button onClick={advanceFromMethods} className="w-full mt-2" disabled={methods.length === 0 || isSaving}>
                Continue
              </Button>
            </div>
          )}

          {inputMode === "select" && (
            <Select onValueChange={handleSelectAnswer}>
              <SelectTrigger>
                <SelectValue placeholder="Pick an option…" />
              </SelectTrigger>
              <SelectContent>
                {(step === "mm_country" ? COUNTRIES : PROVIDERS).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {inputMode === "text" && (
            <div className="flex items-center gap-2">
              <Input
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                placeholder="Type your answer…"
                autoFocus
                disabled={isSaving}
              />
              <Button
                size="icon"
                onClick={handleSendText}
                disabled={!textValue.trim() || isSaving}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          {inputMode === "none" && step === "done" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Setup complete
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    navigate(`/builder/${surfaceId}`);
                  }}
                >
                  Open editor →
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function humanMethod(key: string): string {
  switch (key) {
    case "cash":
      return "Cash on Delivery";
    case "mobile_money":
      return "Mobile Money";
    case "card":
      return "Card / Stripe";
    case "paypal":
      return "PayPal";
    default:
      return key;
  }
}