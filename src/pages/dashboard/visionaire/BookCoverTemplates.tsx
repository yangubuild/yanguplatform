import { useState, useMemo } from "react";
import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";

const TOTAL_COVERS = 120;
const covers = Array.from({ length: TOTAL_COVERS }, (_, i) => ({
  id: i + 1,
  label: `Cover-${i + 1}`,
  url: `https://entrepedia-products.com/app/book-cover-templates/Cover-${i + 1}.jpeg`,
}));

export default function BookCoverTemplates() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return covers;
    const q = search.toLowerCase();
    return covers.filter((c) => c.label.toLowerCase().includes(q));
  }, [search]);

  const handleDownload = async (url: string, name: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.jpeg`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <VisionairePageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Book Cover Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">{TOTAL_COVERS} ready-to-use book cover designs</p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search covers (e.g. Cover-42)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
          {filtered.map((cover) => (
            <div key={cover.id} className="group rounded-xl border border-border bg-card overflow-hidden">
              <div className="aspect-[3/4] overflow-hidden bg-muted">
                <img src={cover.url} alt={cover.label} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{cover.label}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(cover.url, cover.label)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VisionairePageContainer>
  );
}
