import { useParams, useNavigate } from "react-router-dom";
import { DocsPage, PlaceholderBlock } from "@/components/developers/DocsPage";
import { ArrowLeft } from "lucide-react";

export default function StoreInstall() {
  const { appSlug } = useParams<{ appSlug: string }>();
  const navigate = useNavigate();

  return (
    <DocsPage breadcrumb="App Store → Install" title={`Install ${appSlug}`} subtitle="Configure and install this app on your surface.">
      <button onClick={() => navigate(`/developers/store/${appSlug}`)} className="text-sm text-white/50 hover:text-white/70 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to listing
      </button>

      <PlaceholderBlock title="Installation steps" items={[
        "Select target surface",
        "Review required permissions",
        "Configure app settings",
        "Confirm installation",
      ]} />
    </DocsPage>
  );
}
