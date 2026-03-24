import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { LogOut, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

function getRoleLabel(roles: ReturnType<typeof useRoles>): string {
  if (roles.isAdmin) return "Admin";
  if (roles.isContentEditor) return "Content Editor";
  if (roles.isAgencyAdmin) return "Agency Admin";
  if (roles.isAgencyManager) return "Agency Manager";
  if (roles.isFootSoldier) return "Foot Soldier";
  return "Member";
}

export function UserMenu() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const roles = useRoles();
  const roleLabel = getRoleLabel(roles);
  const email = session?.user?.email ?? "—";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-[hsl(var(--admin-border)/0.3)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-3.5 w-3.5" />
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-medium border-[hsl(var(--admin-border)/0.5)] text-[hsl(var(--admin-text-muted))]"
          >
            {roleLabel}
          </Badge>
          <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--admin-text-muted))]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{roleLabel}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
