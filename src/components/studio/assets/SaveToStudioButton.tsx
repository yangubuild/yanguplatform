/**
 * "Save to Studio" button for ADA images — reusable component.
 */
import { useState } from "react";
import { CloudUpload, Loader2, Check } from "lucide-react";
import { useSaveToStudio } from "@/hooks/useStudioAssets";

interface SaveToStudioButtonProps {
  fileUrl: string;
  storagePath?: string;
  assetType?: string;
  title?: string;
  prompt?: string;
  provider?: string;
  className?: string;
}

export function SaveToStudioButton({
  fileUrl,
  storagePath,
  assetType = "image",
  title,
  prompt,
  provider,
  className = "",
}: SaveToStudioButtonProps) {
  const saveToStudio = useSaveToStudio();
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved || saveToStudio.isPending) return;

    await saveToStudio.mutateAsync({
      fileUrl,
      storagePath,
      assetType,
      title,
      prompt,
      provider,
    });
    setSaved(true);
  };

  return (
    <button
      onClick={handleSave}
      disabled={saveToStudio.isPending || saved}
      className={`p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors disabled:opacity-50 ${className}`}
      title={saved ? "Saved to Studio" : "Save to Studio"}
    >
      {saveToStudio.isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : saved ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <CloudUpload className="w-3 h-3" />
      )}
    </button>
  );
}
