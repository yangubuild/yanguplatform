import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link2, Copy } from "lucide-react";
import { toast } from "sonner";
import { ReactNode } from "react";

interface DashboardMoreMenuProps {
  children: ReactNode;
  userId?: string;
}

export function DashboardMoreMenu({ children, userId }: DashboardMoreMenuProps) {
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Copied link");
  };

  const handleCopyId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      toast.success("Copied ID");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-56 p-1.5 border-0"
        style={{ background: "#1a2129", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-white/[0.06] transition-colors">
          <Link2 className="w-4 h-4 text-muted-foreground" />
          Copy link
        </button>
        <button
          onClick={handleCopyId}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-white/[0.06] transition-colors">
          <Copy className="w-4 h-4 text-muted-foreground" />
          Copy ID
        </button>
      </PopoverContent>
    </Popover>
  );
}
