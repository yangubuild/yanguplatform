import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Edit, ShoppingBag, Upload, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onEnterManually?: () => void;
  onSyncBusiness?: () => void;
  onBulkUpload?: () => void;
}

const OPTIONS = [
  {
    icon: Download,
    title: "Import from URL",
    desc: "Paste a product page link and we'll pull the details for you",
    key: "url",
  },
  {
    icon: Edit,
    title: "Enter Manually",
    desc: "Manually enter all the product details",
    key: "manual",
  },
  {
    icon: ShoppingBag,
    title: "Sync from your yangu business",
    desc: "Automatically import and update all your products from your yangu business",
    key: "sync",
  },
  {
    icon: Upload,
    title: "Bulk Upload",
    desc: "Download a template, fill in your product details, and upload it to add multiple products at once.",
    key: "bulk",
  },
];

export function AddProductModal({ open, onClose, onEnterManually, onSyncBusiness, onBulkUpload }: Props) {
  const handleClick = (key: string) => {
    onClose();
    if (key === "manual" && onEnterManually) onEnterManually();
    if (key === "sync" && onSyncBusiness) onSyncBusiness();
    if (key === "bulk" && onBulkUpload) onBulkUpload();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 bg-card border-border/60 rounded-2xl overflow-hidden gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-foreground">How do you want to add product?</h2>
        </div>

        {/* Options */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleClick(opt.key)}
              className="flex items-center gap-4 w-full rounded-xl border border-border/40 px-4 py-4 text-left transition-colors hover:border-border bg-card/60 hover:bg-muted/30 cursor-pointer"
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
