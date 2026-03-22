import { useState, useRef, useCallback } from "react";
import { Upload, ChevronDown, ChevronUp, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [uploading, setUploading] = useState(false);
  const [bookFileOpen, setBookFileOpen] = useState(true);
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverLogoOpen, setCoverLogoOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = useCallback(() => {
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
        const link = document.createElement("a");
        link.download = "branded-cover.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      img.src = logoPreview;
    } else {
      const link = document.createElement("a");
      link.download = "branded-cover.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }, [pdfFile, logoPreview]);

  return (
    <VisionairePageContainer className="!px-0 !pt-0 !pb-0 !max-w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h1 className="text-base font-semibold text-foreground">PDF Rebrander</h1>
        <Button
          size="sm"
          className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90 rounded-full px-5 text-xs font-medium"
          onClick={handleExport}
          disabled={!pdfFile}
        >
          Download PDF
        </Button>
      </div>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-120px)]">
        {/* Left sidebar */}
        <div className="w-full md:w-[280px] md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-background">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-sm font-medium text-foreground">Design Controls</span>
          </div>

          {/* Book File section */}
          <div className="border-b border-border">
            <button
              onClick={() => setBookFileOpen(!bookFileOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Book File
              {bookFileOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {bookFileOpen && (
              <div className="px-4 pb-4">
                <label className="flex flex-col items-center justify-center py-6 rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    ref={pdfInputRef}
                    onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
                  />
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : pdfFile ? (
                    <div className="flex flex-col items-center gap-1">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground truncate max-w-[180px]">{pdfFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Upload Ebook PDF</span>
                      <span className="text-[11px] text-muted-foreground">Drag & drop PDF</span>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Cover section */}
          <div className="border-b border-border">
            <button
              onClick={() => setCoverOpen(!coverOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Cover
              {coverOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {coverOpen && (
              <div className="px-4 pb-4 text-xs text-muted-foreground">
                Cover customization options will appear here after uploading a PDF.
              </div>
            )}
          </div>

          {/* Cover Logo section */}
          <div className="border-b border-border">
            <button
              onClick={() => setCoverLogoOpen(!coverLogoOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Cover Logo
              {coverLogoOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {coverLogoOpen && (
              <div className="px-4 pb-4">
                <label className="flex flex-col items-center justify-center py-6 rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  />
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-12 object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Upload Logo</span>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Main preview area */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          {pdfFile ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="w-[400px] aspect-[3/4] rounded-lg shadow-lg overflow-hidden" style={{ background: "#1a1a2e" }}>
                <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
                  {logoPreview && <img src={logoPreview} alt="Logo" className="h-16 object-contain" />}
                  <p className="text-foreground font-bold text-lg text-center">{pdfFile.name.replace(".pdf", "")}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              {/* Empty state icons */}
              <div className="flex items-end gap-1 text-muted-foreground/40">
                <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="38" height="46" rx="4" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10" y1="14" x2="30" y2="14" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10" y1="22" x2="30" y2="22" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10" y1="30" x2="22" y2="30" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="42" height="50" rx="4" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="22" cy="22" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10" y1="38" x2="34" y2="38" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10" y1="44" x2="28" y2="44" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-foreground mt-2">No PDF Selected</h2>
              <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                Upload a PDF file to customize its cover and add your branding assets.
              </p>
              <Button
                size="sm"
                className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90 rounded-md px-5 text-xs font-medium mt-1"
                onClick={() => pdfInputRef.current?.click()}
              >
                Upload PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </VisionairePageContainer>
  );
}
