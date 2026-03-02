import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PaymentConfig {
  mobile_money?: {
    enabled: boolean;
    provider: string;
    account: string;
    instructions: string;
  };
  stripe?: {
    enabled: boolean;
    connected: boolean;
  };
  cod?: {
    enabled: boolean;
    instructions: string;
  };
  paypal?: {
    enabled: boolean;
    link: string;
  };
}

interface PaymentMethodsEditorProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
}

export function PaymentMethodsEditor({ schema, update }: PaymentMethodsEditorProps) {
  const config = (schema.payment_methods as PaymentConfig) || {};

  const updateMethod = (method: keyof PaymentConfig, partial: Record<string, unknown>) => {
    update({
      payment_methods: {
        ...config,
        [method]: { ...((config[method] as any) || {}), ...partial },
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Payment Methods</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Configure how buyers can pay</p>
      </div>

      {/* Mobile Money */}
      <div className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">📱 Mobile Money</Label>
          <Switch
            checked={config.mobile_money?.enabled || false}
            onCheckedChange={(v) => updateMethod("mobile_money", { enabled: v })}
          />
        </div>
        {config.mobile_money?.enabled && (
          <div className="space-y-2 pt-1">
            <Input
              placeholder="Provider (e.g. M-Pesa, MTN MoMo)"
              value={config.mobile_money?.provider || ""}
              onChange={(e) => updateMethod("mobile_money", { provider: e.target.value })}
              className="text-sm h-8"
            />
            <Input
              placeholder="Phone / Account number"
              value={config.mobile_money?.account || ""}
              onChange={(e) => updateMethod("mobile_money", { account: e.target.value })}
              className="text-sm h-8"
            />
            <Textarea
              placeholder="Payment instructions (optional)"
              value={config.mobile_money?.instructions || ""}
              onChange={(e) => updateMethod("mobile_money", { instructions: e.target.value })}
              rows={2}
              className="text-sm"
            />
          </div>
        )}
      </div>

      {/* Stripe */}
      <div className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">💳 Stripe</Label>
          <Switch
            checked={config.stripe?.enabled || false}
            onCheckedChange={(v) => updateMethod("stripe", { enabled: v })}
          />
        </div>
        {config.stripe?.enabled && (
          <p className="text-[11px] text-muted-foreground">
            {config.stripe?.connected
              ? "✅ Stripe connected"
              : "Stripe will be available when connected. Saved as enabled."}
          </p>
        )}
      </div>

      {/* Cash on Delivery */}
      <div className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">🚚 Cash on Delivery</Label>
          <Switch
            checked={config.cod?.enabled || false}
            onCheckedChange={(v) => updateMethod("cod", { enabled: v })}
          />
        </div>
        {config.cod?.enabled && (
          <Textarea
            placeholder="Delivery / pickup instructions"
            value={config.cod?.instructions || ""}
            onChange={(e) => updateMethod("cod", { instructions: e.target.value })}
            rows={2}
            className="text-sm"
          />
        )}
      </div>

      {/* PayPal */}
      <div className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">🅿️ PayPal</Label>
          <Switch
            checked={config.paypal?.enabled || false}
            onCheckedChange={(v) => updateMethod("paypal", { enabled: v })}
          />
        </div>
        {config.paypal?.enabled && (
          <Input
            placeholder="PayPal.me link or merchant email"
            value={config.paypal?.link || ""}
            onChange={(e) => updateMethod("paypal", { link: e.target.value })}
            className="text-sm h-8"
          />
        )}
      </div>
    </div>
  );
}
