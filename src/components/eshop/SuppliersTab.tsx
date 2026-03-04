import { Package, CheckCircle, Clock } from "lucide-react";

const SUPPLIERS = [
  {
    key: "cj",
    name: "CJ Dropshipping",
    description: "Global dropshipping with 400K+ products, warehouses worldwide, and automated fulfillment.",
    status: "connected" as const,
  },
  {
    key: "moderndropship",
    name: "ModernDropship",
    description: "US-based premium dropshipping for branded and curated products.",
    status: "connected" as const,
  },
  {
    key: "dsers",
    name: "DSers",
    description: "AliExpress partner for bulk ordering and supplier management.",
    status: "coming_soon" as const,
  },
];

export default function SuppliersTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {SUPPLIERS.map((s) => (
        <div key={s.key} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{s.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {s.status === "connected" ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-success" />
                    <span className="text-[11px] text-success">Connected</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Coming soon</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
        </div>
      ))}
    </div>
  );
}
