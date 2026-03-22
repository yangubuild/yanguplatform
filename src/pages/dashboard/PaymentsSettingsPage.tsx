import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, CreditCard, Banknote, Smartphone, DollarSign, Zap } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethods {
  cod: { enabled: boolean };
  bank: { enabled: boolean; bank_name: string; account_name: string; account_number: string; country: string };
  mobile_money: { enabled: boolean; provider: string; name: string; number: string };
  paypal: { enabled: boolean; email: string };
  stripe: { enabled: boolean };
  flutterwave: { enabled: boolean };
}

const DEFAULT_METHODS: PaymentMethods = {
  cod: { enabled: false },
  bank: { enabled: false, bank_name: "", account_name: "", account_number: "", country: "" },
  mobile_money: { enabled: false, provider: "", name: "", number: "" },
  paypal: { enabled: false, email: "" },
  stripe: { enabled: false },
  flutterwave: { enabled: false },
};

export default function PaymentsSettingsPage() {
  const [methods, setMethods] = useState<PaymentMethods>(DEFAULT_METHODS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("creator_payment_profiles")
        .select("methods")
        .eq("creator_id", user.id)
        .maybeSingle();
      if (data?.methods) {
        setMethods({ ...DEFAULT_METHODS, ...(data.methods as Record<string, unknown>) } as PaymentMethods);
      }
      setLoading(false);
    })();
  }, []);

  const update = <K extends keyof PaymentMethods>(key: K, partial: Partial<PaymentMethods[K]>) => {
    setMethods((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("upsert_creator_payment_profile", {
      p_methods: methods as unknown as Parameters<typeof supabase.rpc<"upsert_creator_payment_profile">>[1] extends { p_methods: infer T } ? T : never,
    } as any);
    setSaving(false);
    if (error) {
      toast.error("Failed to save payment settings");
    } else {
      toast.success("Payment settings saved");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 min-h-screen bg-background" >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose how customers pay you directly.</p>
        </div>
        <Button variant="accent" onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>

      {/* COD */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Banknote className="h-4 w-4 text-primary" /></div>
            <div>
              <Label className="text-sm font-semibold">Cash on Delivery</Label>
              <p className="text-xs text-muted-foreground">Buyer pays when they receive the order</p>
            </div>
          </div>
          <Switch checked={methods.cod.enabled} onCheckedChange={(v) => update("cod", { enabled: v })} />
        </div>
      </Card>

      {/* Bank Transfer */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><CreditCard className="h-4 w-4 text-primary" /></div>
            <div>
              <Label className="text-sm font-semibold">Bank Transfer</Label>
              <p className="text-xs text-muted-foreground">Buyers will see these instructions at checkout</p>
            </div>
          </div>
          <Switch checked={methods.bank.enabled} onCheckedChange={(v) => update("bank", { enabled: v })} />
        </div>
        {methods.bank.enabled && (
          <div className="grid gap-3 sm:grid-cols-2 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name</Label>
              <Input placeholder="e.g. Equity Bank" value={methods.bank.bank_name} onChange={(e) => update("bank", { bank_name: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name</Label>
              <Input placeholder="Account holder name" value={methods.bank.account_name} onChange={(e) => update("bank", { account_name: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number</Label>
              <Input placeholder="0123456789" value={methods.bank.account_number} onChange={(e) => update("bank", { account_number: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Country</Label>
              <Input placeholder="e.g. Kenya" value={methods.bank.country} onChange={(e) => update("bank", { country: e.target.value })} className="h-9 text-sm" />
            </div>
          </div>
        )}
      </Card>

      {/* Mobile Money */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Smartphone className="h-4 w-4 text-primary" /></div>
            <div>
              <Label className="text-sm font-semibold">Mobile Money</Label>
              <p className="text-xs text-muted-foreground">Buyers will pay directly to this number</p>
            </div>
          </div>
          <Switch checked={methods.mobile_money.enabled} onCheckedChange={(v) => update("mobile_money", { enabled: v })} />
        </div>
        {methods.mobile_money.enabled && (
          <div className="grid gap-3 sm:grid-cols-2 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Provider</Label>
              <Select value={methods.mobile_money.provider} onValueChange={(v) => update("mobile_money", { provider: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MTN">MTN MoMo</SelectItem>
                  <SelectItem value="Airtel">Airtel Money</SelectItem>
                  <SelectItem value="Safaricom">M-Pesa (Safaricom)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input placeholder="Account holder name" value={methods.mobile_money.name} onChange={(e) => update("mobile_money", { name: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Number</Label>
              <Input placeholder="+256 700 000 000" value={methods.mobile_money.number} onChange={(e) => update("mobile_money", { number: e.target.value })} className="h-9 text-sm" />
            </div>
          </div>
        )}
      </Card>

      {/* PayPal */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><DollarSign className="h-4 w-4 text-primary" /></div>
            <div>
              <Label className="text-sm font-semibold">PayPal</Label>
              <p className="text-xs text-muted-foreground">Buyers will send payment to your PayPal</p>
            </div>
          </div>
          <Switch checked={methods.paypal.enabled} onCheckedChange={(v) => update("paypal", { enabled: v })} />
        </div>
        {methods.paypal.enabled && (
          <div className="pt-1 space-y-1.5">
            <Label className="text-xs">PayPal Email</Label>
            <Input type="email" placeholder="you@example.com" value={methods.paypal.email} onChange={(e) => update("paypal", { email: e.target.value })} className="h-9 text-sm" />
          </div>
        )}
      </Card>

      {/* Stripe */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Zap className="h-4 w-4 text-primary" /></div>
            <div>
              <Label className="text-sm font-semibold">Stripe</Label>
              <p className="text-xs text-muted-foreground">Accept card payments via Stripe</p>
            </div>
          </div>
          <Switch checked={methods.stripe.enabled} onCheckedChange={(v) => update("stripe", { enabled: v })} />
        </div>
        {methods.stripe.enabled && (
          <p className="text-xs text-muted-foreground pl-11">
            Stripe is managed through My Apps. Ensure it's connected there to accept payments.
          </p>
        )}
      </Card>

      {/* Flutterwave - placeholder */}
      <Card className="p-5 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2"><Zap className="h-4 w-4 text-muted-foreground" /></div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">Flutterwave</Label>
              <p className="text-xs text-muted-foreground">Coming next</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
