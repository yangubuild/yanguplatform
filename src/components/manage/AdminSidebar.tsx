import { NavLink } from "@/components/NavLink";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { adminNavGroups } from "./adminNavConfig";
import yanguYIcon from "@/assets/yangu-y-icon.png";
import { Shield, Crown, UserCog, Paintbrush } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ROLE_DISPLAY: Record<string, { label: string; icon: typeof Shield }> = {
  owner:    { label: "Owner",    icon: Crown },
  admin:    { label: "Admin",    icon: Shield },
  manager:  { label: "Manager",  icon: UserCog },
  designer: { label: "Designer", icon: Paintbrush },
};

/** Returns the highest-priority role for display */
function primaryRole(manageRoles: string[]): { label: string; icon: typeof Shield } | null {
  for (const key of ["owner", "admin", "manager", "designer"] as const) {
    if (manageRoles.includes(key)) return ROLE_DISPLAY[key];
  }
  return null;
}

export function AdminSidebar() {
  const { manageRoles, isAdmin } = useRoles();
  const { profile } = useAuth();
  const badge = primaryRole(manageRoles);

  return (
    <Sidebar className="admin-glass-sidebar border-r-0">
      <SidebarContent className="py-4">
        {/* Logo mark */}
        <div className="px-4 pb-4 mb-2 border-b border-[hsl(var(--admin-border)/0.3)]">
          <div className="flex items-center gap-2.5">
            <img src={yanguYIcon} alt="Yangu" className="h-7 w-7 opacity-80" />
            <span
              className="text-sm font-semibold tracking-wide text-[hsl(var(--admin-text))]"
              style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
            >
              Command Center
            </span>
          </div>
        </div>

        {/* Role badge */}
        {badge && (
          <div className="px-4 pb-3 mb-1">
            <div className="flex items-center gap-2 rounded-md bg-[hsl(var(--admin-accent)/0.12)] px-2.5 py-1.5">
              <badge.icon className="h-3.5 w-3.5 text-[hsl(var(--admin-accent))]" />
              <span className="text-xs font-medium text-[hsl(var(--admin-accent))]">
                {badge.label}
              </span>
              {profile?.display_name && (
                <span className="ml-auto text-[10px] text-[hsl(var(--admin-text)/0.5)] truncate max-w-[80px]">
                  {profile.display_name}
                </span>
              )}
            </div>
          </div>
        )}

        {adminNavGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (isAdmin) return true;
            return item.allowedRoles.some((r) => manageRoles.includes(r));
          });

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="py-0.5">
              <div className="admin-section-title">{group.label}</div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          className="admin-nav-item flex items-center gap-3 text-sm"
                          activeClassName="admin-nav-item-active"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
