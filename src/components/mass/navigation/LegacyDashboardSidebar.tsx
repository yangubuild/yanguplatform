import {
  Home,
  BarChart3,
  CreditCard,
  Users,
  Wallet,
  MessageSquare,
  Package,
  Link2,
  FileText,
  Megaphone,
  MoreHorizontal,
  Plus,
  Code,
  Settings,
  ChevronDown,
} from "lucide-react";

const sectionLabelStyle = { color: "hsl(220 10% 42%)" };
const itemColor = "hsl(0 0% 88%)";
const iconColor = "hsl(220 10% 66%)";

const dashboardItems = [
  { icon: BarChart3, label: "Analytics" },
  { icon: CreditCard, label: "Payments" },
  { icon: Users, label: "Users" },
  { icon: Wallet, label: "Balances" },
  { icon: MessageSquare, label: "Support chats" },
];

const pinnedItems = [
  { icon: Package, label: "Products" },
  { icon: Link2, label: "Checkout links" },
  { icon: FileText, label: "Invoices" },
];

export function LegacyDashboardSidebar() {
  return (
    <aside
      className="w-[304px] h-full flex flex-col shrink-0"
      style={{
        background: "hsl(220 26% 5%)",
        borderRight: "1px solid hsl(220 18% 14%)",
      }}
    >
      <div className="p-3 border-b" style={{ borderColor: "hsl(220 18% 13%)" }}>
        <button
          className="w-full h-12 rounded-xl px-3 flex items-center gap-3"
          style={{ background: "hsl(220 22% 8%)", border: "1px solid hsl(220 16% 14%)", color: "hsl(0 0% 95%)" }}
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-semibold">Business home</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        <p className="text-xs uppercase tracking-wider mb-2" style={sectionLabelStyle}>Dashboard</p>
        <div className="space-y-1 mb-4">
          {dashboardItems.map(({ icon: Icon, label }) => (
            <button key={label} className="w-full h-10 rounded-lg px-3 flex items-center gap-3 text-left" style={{ color: itemColor }}>
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <p className="text-xs uppercase tracking-wider mb-2" style={sectionLabelStyle}>Pinned</p>
        <div className="space-y-1 mb-4">
          {pinnedItems.map(({ icon: Icon, label }) => (
            <button key={label} className="w-full h-10 rounded-lg px-3 flex items-center gap-3 text-left" style={{ color: itemColor }}>
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <p className="text-xs uppercase tracking-wider mb-2" style={sectionLabelStyle}>All tools</p>
        <div className="space-y-1 mb-4">
          {[
            { icon: Megaphone, label: "Marketing" },
            { icon: MoreHorizontal, label: "More" },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="w-full h-10 rounded-lg px-3 flex items-center justify-between text-left" style={{ color: itemColor }}>
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" style={{ color: iconColor }} />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: "hsl(220 10% 45%)" }} />
            </button>
          ))}
        </div>

        <p className="text-xs uppercase tracking-wider mb-2" style={sectionLabelStyle}>Apps</p>
        <button className="w-full h-10 rounded-lg px-3 flex items-center gap-3 text-left" style={{ color: itemColor }}>
          <Plus className="w-4 h-4" style={{ color: iconColor }} />
          <span className="text-sm font-medium">Add</span>
        </button>
      </div>

      <div className="px-3 py-3 border-t space-y-1" style={{ borderColor: "hsl(220 18% 13%)" }}>
        {[
          { icon: Code, label: "Developer" },
          { icon: Settings, label: "Settings" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="w-full h-10 rounded-lg px-3 flex items-center gap-3 text-left" style={{ color: itemColor }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
