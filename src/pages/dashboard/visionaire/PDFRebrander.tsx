import { useState, useRef, useCallback } from "react";
import { Upload, Image, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function PDFRebrander() {
  const { user } = useAuth();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [ctaText, setCtaText] = useState("Visit our website");
  const [ctaEnabled, setCtaEnabled] = useState(true);
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePdfUpload = async (file: File) => {
    if (!user) return toast.error("Please log in");
    setPdfFile(file);
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("visionaire-uploads").upload(path, file);
      if (error) throw error;
      setPdfUrl(path);
      toast.success("PDF uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = (file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleExportCoverPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 800;
    canvas.height = 1100;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 800, 1100);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pdfFile?.name?.replace(".pdf", "") || "Your Product", 400, 200);
    if (logoPreview) {
      const img = new window.Image();
      img.onload = () => {
        const logoW = 200;
        const logoH = (img.height / img.width) * logoW;
        ctx.drawImage(img, 300, 400, logoW, logoH);
        if (ctaEnabled && ctaText) {
          ctx.fillStyle = "#e94560";
          ctx.roundRect(250, 800, 300, 50, 12);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 18px sans-serif";
          ctx.fillText(ctaText, 400, 830);
        }
        const link = document.createElement("a");
        link.download = "branded-cover.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      img.src = logoPreview;
    } else {
      if (ctaEnabled && ctaText) {
        ctx.fillStyle = "#e94560";
        ctx.roundRect(250, 800, 300, 50, 12);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(ctaText, 400, 830);
      }
      const link = document.createElement("a");
      link.download = "branded-cover.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }, [pdfFile, logoPreview, ctaEnabled, ctaText]);

  return (
    <VisionairePageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">PDF Rebrander</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload, rebrand, and export PDFs with your branding</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5 rounded-xl border border-border bg-card p-5">
            <div className="space-y-2">
              <Label>Upload PDF</Label>
              <label className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                <input type="file" accept=".pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])} />
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : pdfFile ? (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <FileText className="h-5 w-5" />
                    <span className="truncate max-w-[200px]">{pdfFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to upload PDF</span>
                  </div>
                )}
              </label>
            </div>
            <div className="space-y-2">
              <Label>Upload Logo</Label>
              <label className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-16 object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Image className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to upload logo</span>
                  </div>
                )}
              </label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={ctaEnabled} onChange={(e) => setCtaEnabled(e.target.checked)} className="rounded" />
                <Label>Add CTA Button</Label>
              </div>
              {ctaEnabled && (
                <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="CTA text..." />
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="accent" onClick={handleExportCoverPng} disabled={!pdfFile}>
                <Download className="h-4 w-4 mr-2" /> Download Cover PNG
              </Button>
              <Button variant="outline" onClick={() => toast.info("Export branded PDF coming soon")} disabled={!pdfFile}>
                Export Branded PDF
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Preview</h3>
            <div className="aspect-[3/4] rounded-lg bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
              {pdfFile ? (
                <div className="text-center space-y-3 p-6">
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: "#1a1a2e", borderRadius: 8, padding: 24 }}>
                    {logoPreview && <img src={logoPreview} alt="Logo" className="h-16 object-contain" />}
                    <p className="text-white font-bold text-lg">{pdfFile.name.replace(".pdf", "")}</p>
                    {ctaEnabled && ctaText && (
                      <div className="px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: "#e94560" }}>
                        {ctaText}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Upload a PDF to see preview</p>
              )}
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </VisionairePageContainer>
  );
}
