import { useState } from "react";
import { format } from "date-fns";
import {
  Zap, Plus, Trash2, Power, PowerOff, ChevronDown, ChevronRight, Clock,
} from "lucide-react";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useAutomationRules, useAutomationExecutions,
  useCreateAutomationRule, useToggleAutomationRule, useDeleteAutomationRule,
  type AutomationRule,
} from "@/hooks/manage/useManageAutomation";

const TRIGGER_TYPES = [
  { value: "threshold", label: "Threshold" },
  { value: "cron", label: "Scheduled (Cron)" },
  { value: "event", label: "Event-based" },
];

const ACTION_TYPES = [
  { value: "create_incident", label: "Create Incident" },
  { value: "flag_user", label: "Flag User" },
  { value: "alert", label: "Send Alert" },
  { value: "escalate", label: "Escalate Ticket" },
];

function CreateRuleDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("threshold");
  const [actionType, setActionType] = useState("create_incident");
  const [metric, setMetric] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");
  const createRule = useCreateAutomationRule();

  const handleCreate = () => {
    createRule.mutate({
      name,
      description,
      trigger_type: triggerType,
      trigger_config: { metric, threshold: Number(thresholdValue) || 0 },
      action_type: actionType,
      action_config: {},
    }, { onSuccess: () => { setOpen(false); setName(""); setDescription(""); } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> New Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[hsl(var(--admin-surface))] border-[hsl(var(--admin-border)/0.4)]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--admin-text))]">Create Automation Rule</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Input placeholder="Rule name" value={name} onChange={(e) => setName(e.target.value)}
            className="bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]" />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
            className="bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]" />
          <div className="grid grid-cols-2 gap-3">
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger className="text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Metric (e.g. kyc_failures)" value={metric} onChange={(e) => setMetric(e.target.value)}
              className="text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]" />
            <Input placeholder="Threshold value" type="number" value={thresholdValue} onChange={(e) => setThresholdValue(e.target.value)}
              className="text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]" />
          </div>
          <Button onClick={handleCreate} disabled={!name || createRule.isPending} className="w-full">
            {createRule.isPending ? "Creating..." : "Create Rule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RuleCard({ rule }: { rule: AutomationRule }) {
  const [showLogs, setShowLogs] = useState(false);
  const toggleRule = useToggleAutomationRule();
  const deleteRule = useDeleteAutomationRule();
  const { data: executions } = useAutomationExecutions(showLogs ? rule.id : null);

  return (
    <AdminGlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Zap className={`h-4 w-4 ${rule.is_enabled ? "text-[hsl(160,84%,45%)]" : "text-[hsl(var(--admin-text-muted))]"}`} />
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] truncate">{rule.name}</h3>
            <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">
              {rule.trigger_type}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">
              → {rule.action_type.replace("_", " ")}
            </Badge>
          </div>
          {rule.description && <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-0.5">{rule.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-[hsl(var(--admin-text-muted))]">
            <span>Triggered {rule.trigger_count}x</span>
            {rule.last_triggered_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last: {format(new Date(rule.last_triggered_at), "MMM d, HH:mm")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch checked={rule.is_enabled} onCheckedChange={(checked) => toggleRule.mutate({ ruleId: rule.id, enabled: checked })} />
          <button onClick={() => deleteRule.mutate(rule.id)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-[hsl(var(--admin-text-muted))] hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <Collapsible open={showLogs} onOpenChange={setShowLogs}>
        <CollapsibleTrigger className="flex items-center gap-1 mt-3 text-xs text-accent hover:underline">
          {showLogs ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Execution Logs
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-1 max-h-40 overflow-auto">
            {!executions || executions.length === 0 ? (
              <p className="text-xs text-[hsl(var(--admin-text-muted))] py-2">No executions yet</p>
            ) : (
              executions.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between text-xs py-1 border-b border-[hsl(var(--admin-border)/0.15)]">
                  <span className="text-[hsl(var(--admin-text-muted))]">{format(new Date(ex.executed_at), "MMM d, HH:mm:ss")}</span>
                  <Badge variant={ex.status === "success" ? "outline" : "destructive"} className="text-[10px]">{ex.status}</Badge>
                  {ex.error && <span className="text-destructive truncate max-w-[200px]">{ex.error}</span>}
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </AdminGlassCard>
  );
}

export default function ManageAutomation() {
  const { data: rules, isLoading } = useAutomationRules();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <AdminPageHeader title="Automation Engine" description="Configure automated rules for platform monitoring and actions" />
        <CreateRuleDialog />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : !rules || rules.length === 0 ? (
        <AdminGlassCard className="p-8 text-center">
          <Zap className="h-10 w-10 text-[hsl(var(--admin-text-muted))] mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">No automation rules configured</p>
          <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-1">Create a rule to automate platform responses</p>
        </AdminGlassCard>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => <RuleCard key={rule.id} rule={rule} />)}
        </div>
      )}

      <AdminGlassCard className="p-4">
        <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-2">Rule Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { name: "KYC Failure Spike", desc: "IF KYC failures > 5 in 1h → Create incident", trigger: "threshold", action: "create_incident" },
            { name: "Payment Failure Alert", desc: "IF payment failures > 3 in 1h → Alert admin", trigger: "threshold", action: "alert" },
            { name: "AI Abuse Detection", desc: "IF AI generations > 50 per user/day → Flag user", trigger: "threshold", action: "flag_user" },
            { name: "Support SLA Breach", desc: "IF support ticket > 24h unanswered → Escalate", trigger: "threshold", action: "escalate" },
          ].map((tpl) => (
            <div key={tpl.name} className="rounded-lg border border-[hsl(var(--admin-border)/0.3)] p-3 bg-[hsl(var(--admin-surface-elevated)/0.3)]">
              <p className="text-xs font-medium text-[hsl(var(--admin-text))]">{tpl.name}</p>
              <p className="text-[11px] text-[hsl(var(--admin-text-muted))] mt-0.5">{tpl.desc}</p>
            </div>
          ))}
        </div>
      </AdminGlassCard>
    </div>
  );
}
