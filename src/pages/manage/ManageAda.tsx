import { useRoles } from "@/hooks/useRoles";
import { AdaCommandHeader } from "@/components/manage/ada/AdaCommandHeader";
import { ConversationIntelligence } from "@/components/manage/ada/ConversationIntelligence";
import { UsageCostMonitoring } from "@/components/manage/ada/UsageCostMonitoring";
import { ContentSafetyPanel } from "@/components/manage/ada/ContentSafetyPanel";
import { ActionCompletionTracking } from "@/components/manage/ada/ActionCompletionTracking";
import { QualityFeedback } from "@/components/manage/ada/QualityFeedback";
import { PerformancePanel } from "@/components/manage/ada/PerformancePanel";

export default function ManageAda() {
  const { isAdmin } = useRoles();

  return (
    <div className="space-y-6">
      <AdaCommandHeader isAdmin={isAdmin} />
      <ConversationIntelligence />
      <UsageCostMonitoring />
      <ContentSafetyPanel />
      <ActionCompletionTracking />
      <QualityFeedback />
      <PerformancePanel isAdmin={isAdmin} />
    </div>
  );
}
