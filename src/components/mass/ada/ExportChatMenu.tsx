import { useState } from "react";
import { FileDown, FileText, Download, HardDrive, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { isDriveConnected, uploadToDrive } from "@/lib/integrations/googleDrive";

interface ExportChatMenuProps {
  chatId: string | null;
  onDriveConnect: () => void;
}

export function ExportChatMenu({ chatId, onDriveConnect }: ExportChatMenuProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [lastExport, setLastExport] = useState<{ url: string; filename: string; format: string } | null>(null);

  if (!chatId) return null;

  const handleExport = async (format: "pdf" | "docx") => {
    if (!user) return;
    setExporting(format);
    setOpen(false);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const session = (await supabase.auth.getSession()).data.session;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/ada-export-${format}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ chat_id: chatId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast({ title: err?.error || `Export to ${format.toUpperCase()} failed`, variant: "destructive" });
        return;
      }

      const data = await res.json();
      if (data.ok && data.file_url) {
        setLastExport({ url: data.file_url, filename: data.filename || `ada-chat.${format}`, format });
        toast({ title: `${format.toUpperCase()} exported successfully` });
      } else {
        toast({ title: data.error || "Export failed", variant: "destructive" });
      }
    } catch (err) {
      console.error(`[Export ${format}] Error:`, err);
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadExport = () => {
    if (!lastExport) return;
    const a = document.createElement("a");
    a.href = lastExport.url;
    a.download = lastExport.filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveExportToDrive = async () => {
    if (!lastExport) return;
    if (!isDriveConnected()) {
      onDriveConnect();
      return;
    }
    const result = await uploadToDrive({
      fileUrl: lastExport.url,
      fileName: lastExport.filename,
      folder: "/YANGU/AdaAI/Exports/",
    });
    if (result.ok) {
      toast({ title: `Saved to Google Drive: ${result.fileName}` });
    } else {
      toast({ title: result.error || "Failed to save to Drive", variant: "destructive" });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 transition-colors"
        style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
        title="Export chat"
      >
        {exporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileDown className="w-3.5 h-3.5" />
        )}
        Export
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-44 rounded-xl py-1 z-50 shadow-xl"
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <button
            onClick={() => handleExport("pdf")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Export as PDF
          </button>
          <button
            onClick={() => handleExport("docx")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Export as DOCX
          </button>

          {lastExport && (
            <>
              <div className="border-t border-white/5 my-1" />
              <p className="px-3 py-1 text-[10px] text-white/30">Last export: {lastExport.format.toUpperCase()}</p>
              <button
                onClick={handleDownloadExport}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={handleSaveExportToDrive}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
              >
                <HardDrive className="w-3.5 h-3.5" />
                Save to Google Drive
              </button>
            </>
          )}
        </div>
      )}

      {/* Close dropdown on outside click */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
