import { useRoles } from "@/hooks/useRoles";
import { AdaCommandHeader } from "@/components/manage/ada/AdaCommandHeader";
import { ConversationIntelligence } from "@/components/manage/ada/ConversationIntelligence";
import { UsageCostMonitoring } from "@/components/manage/ada/UsageCostMonitoring";
import { ContentSafetyPanel } from "@/components/manage/ada/ContentSafetyPanel";
import { ActionCompletionTracking } from "@/components/manage/ada/ActionCompletionTracking";
import { QualityFeedback } from "@/components/manage/ada/QualityFeedback";
import { PerformancePanel } from "@/components/manage/ada/PerformancePanel";
import { CreditsBillingPanel } from "@/components/manage/ada/CreditsBillingPanel";
import { ModerationActionsPanel } from "@/components/manage/ada/ModerationActionsPanel";
import { LiveOpsPanel } from "@/components/manage/ada/LiveOpsPanel";
import { UserMessagingPanel } from "@/components/manage/ada/UserMessagingPanel";
import { DevE2ETestPanel } from "@/components/manage/ada/DevE2ETestPanel";
import { UsageLimitsPanel } from "@/components/manage/ada/UsageLimitsPanel";
import { Badge } from "@/components/ui/badge";

export default function ManageAda() {
  const { isAdmin } = useRoles();

  return (
    <div className="space-y-6">
      <AdaCommandHeader isAdmin={isAdmin} />

      {/* Backend status badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))] bg-[hsl(var(--admin-surface-elevated)/0.3)]">
          Backend not connected yet
        </Badge>
      </div>

      <ConversationIntelligence />
      <UsageCostMonitoring />

      {/* Admin-only management panels */}
      {isAdmin && (
        <>
          <UsageLimitsPanel />
          <CreditsBillingPanel />
          <ModerationActionsPanel />
          <LiveOpsPanel />
          <UserMessagingPanel />
        </>
      )}

      <ContentSafetyPanel />
      <ActionCompletionTracking />
      <QualityFeedback />
      <PerformancePanel isAdmin={isAdmin} />

      {/* Dev-only E2E test panel – admin only */}
      {isAdmin && <DevE2ETestPanel />}
    </div>
  );
}