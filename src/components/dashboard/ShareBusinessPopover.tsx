import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users } from "lucide-react";
import { ReactNode } from "react";

interface ShareBusinessPopoverProps {
  children: ReactNode;
  avatarUrl?: string | null;
  initials?: string;
}

export function ShareBusinessPopover({ children, avatarUrl, initials = "Y" }: ShareBusinessPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-56 p-4 border-0"
        style={{ background: "#111a15", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-sm font-bold text-white mb-3">Share business</p>
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Team" className="w-12 h-12 rounded-full object-cover bg-white" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-lg font-bold text-gray-800">
                {initials}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: "#6b7280", border: "2px solid #1a2129" }} />
          </div>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Team</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
