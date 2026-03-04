import { Search, Package, CheckCircle, Clock, Globe, ShieldCheck } from "lucide-react";
import { useState } from "react";

const SUPPLIERS = [
  {
    key: "cj",
    name: "CJ Dropshipping",
    description: "Global dropshipping with 400K+ products, warehouses worldwide, and automated fulfillment.",
    region: "China, US, EU",
    categories: ["Electronics", "Fashion", "Home"],
    status: "connected" as const,
    verified: true,
  },
  {
    key: "moderndropship",
    name: "ModernDropship",
    description: "US-based premium dropshipping for branded and curated products.",
    region: "United States",
    categories: ["Premium", "Branded", "Lifestyle"],
    status: "connected" as const,
    verified: true,
  },
  {
    key: "estores",
    name: "YANGU Estores",
    description: "Internal marketplace source. Browse products from YANGU sellers directly.",
    region: "Worldwide",
    categories: ["All categories"],
    status: "connected" as const,
    verified: true,
  },
  {
    key: "dsers",
    name: "DSers",
    description: "AliExpress partner for bulk ordering and supplier management.",
    region: "China",
    categories: ["All categories"],
    status: "coming_soon" as const,
    verified: false,
  },
];

export default function ManufacturersTab() {
  const [searchQ, setSearchQ] = useState("");

  const filtered = SUPPLIERS.filter((s) =>
    s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="p-5 space-y-5">
      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search manufacturers and suppliers..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {filtered.map((s) => (
          <div
            key={s.key}
            className={`rounded-xl border bg-card p-5 space-y-3 transition-colors ${
              s.status === "coming_soon" ? "border-border/40 opacity-60" : "border-border hover:border-accent/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {s.status === "connected" ? (
                    <span className="flex items-center gap-1 text-[11px] text-success">
                      <CheckCircle className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3" /> Coming soon
                    </span>
                  )}
                  {s.verified && (
                    <span className="flex items-center gap-1 text-[11px] text-accent">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Globe className="w-3 h-3" />
              {s.region}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {s.categories.map((c) => (
                <span key={c} className="px-2 py-0.5 text-[10px] rounded-full border border-border bg-muted/30 text-muted-foreground">
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
