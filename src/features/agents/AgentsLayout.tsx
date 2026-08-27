import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Bot, Inbox, PhoneCall, Users, Calendar,
  BookOpen, Workflow as WorkflowIcon, BarChart3, Puzzle,
  Sparkles, Smartphone, UsersRound, CreditCard, Settings, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceOrb } from "./VoiceOrb";

const NAV = [
  { to: "/dashboard/agents", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/agents/agents", label: "Agents", icon: Bot },
  { to: "/dashboard/agents/inbox", label: "Inbox", icon: Inbox },
  { to: "/dashboard/agents/calls", label: "Calls", icon: PhoneCall },
  { to: "/dashboard/agents/leads", label: "Leads", icon: Users },
  { to: "/dashboard/agents/appointments", label: "Appointments", icon: Calendar },
  { to: "/dashboard/agents/knowledge", label: "Knowledge", icon: BookOpen },
  { to: "/dashboard/agents/workflows", label: "Workflows", icon: WorkflowIcon },
  { to: "/dashboard/agents/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/agents/integrations", label: "Integrations", icon: Puzzle },
  { to: "/dashboard/agents/assistant", label: "Assistant", icon: Sparkles },
  { to: "/dashboard/agents/mobile", label: "Mobile & Pendant", icon: Smartphone },
  { to: "/dashboard/agents/team", label: "Team", icon: UsersRound },
  { to: "/dashboard/agents/billing", label: "Billing", icon: CreditCard },
  { to: "/dashboard/agents/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/agents/account", label: "Account", icon: UserCircle },
];

export default function AgentsLayout() {
  return (
    <div className="relative min-h-full">
      <div className="border-b border-border bg-background/60 backdrop-blur sticky top-0 z-20">
        <div className="px-4 lg:px-6 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none">AI Agents</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Your AI workforce for sales, support and voice.</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex !min-w-max !shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm rounded-t-md border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )
                }
              >
                <item.icon className="h-4 w-4 flex-none" />
                <span className="whitespace-nowrap">{item.label}</span>

              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <div className="p-4 lg:p-6">
        <Outlet />
      </div>
      <VoiceOrb />
    </div>
  );
}