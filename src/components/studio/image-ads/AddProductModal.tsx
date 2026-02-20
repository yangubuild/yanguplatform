import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Download, Edit, ShoppingBag, Upload, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const OPTIONS = [
  {
    icon: Download,
    title: "Import from URL",
    desc: "Paste a product page link and we'll pull the details for you",
    enabled: true,
  },
  {
    icon: Edit,
    title: "Enter Manually",
    desc: "Manually enter all the product details",
    enabled: true,
  },
  {
    icon: ShoppingBag,
    title: "Sync from your yangu business",
    desc: "Automatically import and update all your products from your yangu business",
    enabled: true,
  },
  {
    icon: Upload,
    title: "Bulk Upload",
    desc: "Download a template, fill in your product details, and upload it to add multiple products at once.",
    enabled: true,
  },
];

export function AddProductModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 bg-card border-border/60 rounded-2xl overflow-hidden gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-foreground">How do you want to add product?</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.title}
              disabled={!opt.enabled}
              className={`flex items-center gap-4 w-full rounded-xl border border-border/40 px-4 py-4 text-left transition-colors ${
                opt.enabled
                  ? "hover:border-border bg-card/60 hover:bg-muted/30 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <opt.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{opt.title}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
