import { NavLink } from "@/components/NavLink";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { agencyNavGroups } from "./agencyNavConfig";
import yanguYIcon from "@/assets/yangu-y-icon.png";
import { Building2, Shield, Users, DollarSign, Palette, Megaphone } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ROLE_BADGE_MAP: Record<string, { label: string; icon: typeof Shield }> = {
  agency_admin: { label: "Agency Principal", icon: Building2 },
  agency_manager: { label: "Sales Lead", icon: Users },
  foot_soldier: { label: "Foot Soldier", icon: Users },
  finance_officer: { label: "Finance Officer", icon: DollarSign },
  creator: { label: "Creator", icon: Palette },
  influencer: { label: "Influencer", icon: Megaphone },
};

export function AgencySidebar() {
  const { agencyRoles, isAdmin, isAgencyAdmin } = useRoles();
  const { profile } = useAuth();

  const roleBadge = isAdmin
    ? { label: "Platform Admin", icon: Shield }
    : agencyRoles.length > 0
      ? ROLE_BADGE_MAP[agencyRoles[0]] ?? { label: agencyRoles[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), icon: Users }
      : null;

  return (
    <Sidebar className="admin-glass-sidebar border-r-0">
      <SidebarContent className="py-4">
        {/* Logo */}
        <div className="px-4 pb-4 mb-2 border-b border-[hsl(var(--admin-border)/0.3)]">
          <div className="flex items-center gap-2.5">
            <img src={yanguYIcon} alt="yangu" className="h-7 w-7 opacity-80" />
            <span
              className="text-sm font-semibold tracking-wide text-[hsl(var(--admin-text))]"
              style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
              Agency Hub
            </span>
          </div>
        </div>

        {/* Role badge */}
        {roleBadge && (
          <div className="px-4 pb-3 mb-1">
            <div className="flex items-center gap-2 rounded-md bg-[hsl(var(--admin-accent)/0.12)] px-2.5 py-1.5">
              <roleBadge.icon className="h-3.5 w-3.5 text-[hsl(var(--admin-accent))]" />
              <span className="text-xs font-medium text-[hsl(var(--admin-accent))]">
                {roleBadge.label}
              </span>
              {profile?.display_name && (
                <span className="ml-auto text-[10px] text-[hsl(var(--admin-text)/0.5)] truncate max-w-[80px]">
                  {profile.display_name}
                </span>
              )}
            </div>
          </div>
        )}

        {agencyNavGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (isAdmin || isAgencyAdmin) return true;
            return item.allowedRoles.some((r) => agencyRoles.includes(r));
          });

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="py-0.5">
              <div className="admin-section-title">{group.label}</div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.slug}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={`/${item.slug}`.replace(/\/+$/, "") || "/"}
                          end={item.end}
                          className="admin-nav-item flex items-center gap-3 text-sm"
                          activeClassName="admin-nav-item-active">
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
