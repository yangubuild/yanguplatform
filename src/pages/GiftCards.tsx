import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import giftCardClassic from "@/assets/gift-card-classic.png";
import giftCardBuild from "@/assets/gift-card-build.png";
import giftCardAbstract from "@/assets/gift-card-abstract.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const DESIGNS = [
  { id: "classic", label: "Gift Card", img: giftCardClassic },
  { id: "build", label: "Build with Yangu", img: giftCardBuild },
  { id: "abstract", label: "Abstract Y", img: giftCardAbstract },
] as const;

const AMOUNTS = [25, 50, 100, 200];

export default function GiftCards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [design, setDesign] = useState<(typeof DESIGNS)[number]["id"]>("classic");
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [delivery, setDelivery] = useState<"recipient" | "self_pdf">("recipient");
  const [form, setForm] = useState({
    recipient_name: "",
    recipient_email: "",
    sender_name: "",
    message: "",
    delivery_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const activeDesign = useMemo(() => DESIGNS.find((d) => d.id === design)!, [design]);
  const finalAmount = isCustom ? Number(customAmount) : amount;

  const handleSubmit = async () => {
    if (!finalAmount || finalAmount <= 0) return toast.error("Enter a valid amount");
    if (delivery === "recipient" && (!form.recipient_name || !form.recipient_email)) {
      return toast.error("Recipient name and email required");
    }
    if (!form.sender_name) return toast.error("Your name is required");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("gift_card_orders").insert({
        buyer_user_id: user?.id ?? null,
        card_design: design,
        amount_cents: Math.round(finalAmount * 100),
        delivery_method: delivery,
        recipient_name: form.recipient_name || null,
        recipient_email: form.recipient_email || null,
        sender_name: form.sender_name,
        message: form.message || null,
        delivery_date: form.delivery_date || null,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-8">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold text-foreground mb-2">Gift card ordered</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We've recorded your order. Check your email shortly for confirmation and next steps.
          </p>
          <button
            onClick={() => navigate("/dashboard/profile/subscription")}
            className="rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-foreground">Gift cards</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero card stack */}
        <div className="relative h-[200px] sm:h-[240px] mb-6">
          {DESIGNS.filter((d) => d.id !== design).map((d, i) => (
            <img
              key={d.id}
              src={d.img}
              alt=""
              className="absolute top-4 left-1/2 -translate-x-1/2 w-[200px] sm:w-[240px] rounded-xl shadow-lg opacity-70"
              style={{ transform: `translateX(calc(-50% + ${(i === 0 ? -40 : 40)}px)) rotate(${i === 0 ? -8 : 8}deg)` }}
            />
          ))}
          <img
            src={activeDesign.img}
            alt={activeDesign.label}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[240px] sm:w-[300px] rounded-xl shadow-2xl"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-foreground mb-8">
            Buy a yangu gift card
          </h2>

          {/* Card design selector */}
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-3 block">Choose card design</Label>
            <div className="flex flex-wrap gap-3">
              {DESIGNS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDesign(d.id)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    design === d.id ? "border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={d.img} alt={d.label} className="w-[110px] h-[70px] object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-3 block">Amount</Label>
            <div className="flex flex-wrap gap-2">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setIsCustom(false); }}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    !isCustom && amount === a
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-foreground border-border hover:bg-muted"
                  }`}
                >
                  ${a}
                </button>
              ))}
              <div className={`flex items-center rounded-lg border ${isCustom ? "border-foreground" : "border-border"} px-3`}>
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  placeholder="Custom"
                  value={customAmount}
                  onFocus={() => setIsCustom(true)}
                  onChange={(e) => { setIsCustom(true); setCustomAmount(e.target.value); }}
                  className="w-20 bg-transparent border-0 outline-none text-sm py-2 px-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This amount will be applied as account balance and automatically used for yangu subscription payments.
            </p>
          </div>

          {/* Delivery method */}
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-3 block">Choose delivery method</Label>
            <div className="space-y-2">
              {[
                { v: "recipient" as const, label: "Send email to recipient (immediately after purchase)" },
                { v: "self_pdf" as const, label: "Send email to me (PDF to print)" },
              ].map((opt) => (
                <label key={opt.v} className="flex items-center gap-3 cursor-pointer">
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      delivery === opt.v ? "border-blue-500" : "border-border"
                    }`}
                  >
                    {delivery === opt.v && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </span>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={delivery === opt.v}
                    onChange={() => setDelivery(opt.v)}
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Recipient */}
          {delivery === "recipient" && (
            <div className="mb-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">To</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Name</Label>
                  <Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Email</Label>
                  <Input type="email" value={form.recipient_email} onChange={(e) => setForm({ ...form, recipient_email: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">From</h3>
            <div>
              <Label className="text-xs mb-1.5 block">Name</Label>
              <Input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Message (optional)</Label>
              <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Delivery Date (optional)</Label>
              <Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? "Processing..." : `Purchase Gift Card${finalAmount ? ` · $${finalAmount}` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
