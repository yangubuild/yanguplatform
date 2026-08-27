import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bot, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceOrb } from "./VoiceOrb";

// Persistent navigation is deliberately minimal: the Composer is the workspace,
// Agents is the secondary directory. Everything else is reached contextually
// from the conversation (those routes still exist for direct links).
const NAV = [
  { to: "/dashboard/agents", label: "Composer", icon: MessageSquare, end: true },
  { to: "/dashboard/agents/agents", label: "Agents", icon: Bot },
];


export default function AgentsLayout() {
  const { pathname } = useLocation();
  const composerActive = pathname === "/dashboard/agents" || pathname.startsWith("/dashboard/agents/build");

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
                    (item.end ? composerActive : isActive)
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