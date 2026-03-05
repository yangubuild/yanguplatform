import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VisionaireGrid } from "@/components/visionaire/VisionaireGrid";
import { useVisionaireItems } from "@/hooks/useVisionaireItems";

export default function ProductMockups() {
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useVisionaireItems("mockups");

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Product Mockups</h1>
        <p className="text-sm text-muted-foreground mt-1">Professional mockups for your digital products</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search mockups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <VisionaireGrid items={filtered} isLoading={isLoading} />
    </div>
  );
}
