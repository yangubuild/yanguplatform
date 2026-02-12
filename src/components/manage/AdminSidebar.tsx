import { NavLink } from "@/components/NavLink";
import { useRoles } from "@/hooks/useRoles";
import { adminNavGroups } from "./adminNavConfig";
import yanguYIcon from "@/assets/yangu-y-icon.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AdminSidebar() {
  const { manageRoles, isAdmin } = useRoles();

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
