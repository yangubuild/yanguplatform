import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  Compass,
  Bot,
  ShoppingBag,
  Palette,
  BookOpen,
  Store,
  Menu as MenuIcon,
  Search,
  Wallet,
  Bell,
  Settings,
  User,
  GripVertical,
  Plus,
  Trash2,
  Eye,
  Save,
  Upload,
  Image,
  ExternalLink,
  FlaskConical,
  AppWindow,
  CheckCircle2,
  XCircle,
  Star,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────
type VisibilityRule = "all" | "logged_in" | "builder" | "seller" | "organization" | "creator" | "viewer" | "admin";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  visibility: VisibilityRule;
  badge: string;
  enabled: boolean;
  section: string;
}

interface TopBarControl {
  id: string;
  label: string;
  enabled: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  route: string;
}

interface BannerCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaLink: string;
  targetRoles: VisibilityRule[];
  startDate: string;
  endDate: string;
  enabled: boolean;
  pinned: boolean;
  offerBadge: string;
}

interface AppEntry {
  id: string;
  name: string;
  icon: string;
  link: string;
  status: "approved" | "pending" | "rejected" | "featured";
}

interface Experiment {
  id: string;
  label: string;
  enabled: boolean;
  targetRole: VisibilityRule;
  variant: "A" | "B";
}

// ─── Icon map ────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Compass,
  Bot,
  ShoppingBag,
  Palette,
  BookOpen,
  Store,
  MenuIcon,
  Search,
  Wallet,
  Bell,
  Settings,
  User,
  AppWindow,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const SECTIONS = ["Explore", "Seller", "Influencer", "Studio", "Visionaire", "App Store", "Community"];

const VISIBILITY_OPTIONS: { value: VisibilityRule; label: string }[] = [
  { value: "all", label: "All users" },
  { value: "logged_in", label: "Logged-in only" },
  { value: "builder", label: "Builder" },
  { value: "seller", label: "Seller" },
  { value: "organization", label: "Organization" },
  { value: "creator", label: "Creator" },
  { value: "viewer", label: "Viewer" },
  { value: "admin", label: "Admin" },
];

// ─── Mock data ────────────────────────────────────────────────────
const MOCK_NAV_ITEMS: NavItem[] = [
  { id: "1", label: "Dashboard", icon: "LayoutDashboard", route: "/dashboard", visibility: "logged_in", badge: "", enabled: true, section: "Explore" },
  { id: "2", label: "Explore", icon: "Compass", route: "/discover", visibility: "all", badge: "", enabled: true, section: "Explore" },
  { id: "3", label: "Ada AI", icon: "Bot", route: "/ada-ai", visibility: "all", badge: "New", enabled: true, section: "Explore" },
  { id: "4", label: "Seller Hub", icon: "ShoppingBag", route: "/seller", visibility: "seller", badge: "", enabled: true, section: "Seller" },
  { id: "5", label: "yangu Studio", icon: "Palette", route: "/studio", visibility: "logged_in", badge: "", enabled: true, section: "Studio" },
  { id: "6", label: "Visionaire", icon: "BookOpen", route: "/visionaire", visibility: "all", badge: "3", enabled: true, section: "Visionaire" },
  { id: "7", label: "App Store", icon: "AppWindow", route: "/apps", visibility: "all", badge: "", enabled: false, section: "App Store" },
  { id: "8", label: "Community", icon: "Store", route: "/community", visibility: "all", badge: "", enabled: true, section: "Community" },
];

const MOCK_TOPBAR: TopBarControl[] = [
  { id: "search", label: "Search", enabled: true },
  { id: "wallet", label: "Wallet balance", enabled: true },
  { id: "deposit", label: "Deposit button", enabled: true },
  { id: "notifications", label: "Notifications", enabled: true },
  { id: "settings", label: "Settings", enabled: true },
  { id: "profile", label: "Profile menu", enabled: true },
];

const MOCK_QUICK_ACTIONS: QuickAction[] = [
  { id: "1", label: "Create Surface", route: "/dashboard" },
  { id: "2", label: "View Blog", route: "/blog" },
];

const MOCK_BANNERS: BannerCard[] = [
  {
    id: "1", title: "Launch Offer", description: "Get 120% bonus credits on your first deposit",
    imageUrl: "", ctaLabel: "Claim Now", ctaLink: "/billing", targetRoles: ["all"],
    startDate: "2026-02-01", endDate: "2026-03-01", enabled: true, pinned: true, offerBadge: "+120%",
  },
  {
    id: "2", title: "New Studio Features", description: "AI-powered brand kit generation",
    imageUrl: "", ctaLabel: "Try Studio", ctaLink: "/studio", targetRoles: ["builder", "seller"],
    startDate: "2026-02-10", endDate: "2026-04-01", enabled: true, pinned: false, offerBadge: "",
  },
];

const MOCK_APPS: AppEntry[] = [
  { id: "1", name: "Cora Analytics", icon: "LayoutDashboard", link: "/apps/cora", status: "approved" },
  { id: "2", name: "Mail Pro", icon: "Bell", link: "/apps/mail", status: "featured" },
  { id: "3", name: "Sparkle CRM", icon: "Star" as any, link: "/apps/sparkle", status: "pending" },
  { id: "4", name: "Budget Tracker", icon: "Wallet", link: "/apps/budget", status: "rejected" },
];

const MOCK_EXPERIMENTS: Experiment[] = [
  { id: "1", label: "Sidebar compact mode", enabled: true, targetRole: "all", variant: "A" },
  { id: "2", label: "New search UX", enabled: false, targetRole: "logged_in", variant: "B" },
  { id: "3", label: "Seller quick actions", enabled: false, targetRole: "seller", variant: "A" },
];

// ─── Sub-components ───────────────────────────────────────────────

function DisabledActionBar() {
  return (
    <div className="flex items-center gap-2 pt-4 border-t border-border">
      <Button disabled className="gap-2"><Save className="h-4 w-4" /> Save Draft</Button>
      <Button disabled variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Publish</Button>
      <span className="text-xs text-muted-foreground ml-2">Backend not connected yet</span>
    </div>
  );
}

function IconPreview({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? Compass;
  return <Icon className="h-4 w-4 text-muted-foreground" />;
}

// ─── Tab: Sidebar Builder ─────────────────────────────────────────
function SidebarBuilderTab() {
  const [items, setItems] = useState<NavItem[]>(MOCK_NAV_ITEMS);
  const [previewRole, setPreviewRole] = useState<VisibilityRule>("all");

  const updateItem = (id: string, patch: Partial<NavItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const addItem = () => {
    const newId = String(Date.now());
    setItems((prev) => [
      ...prev,
      { id: newId, label: "New Item", icon: "Compass", route: "/", visibility: "all", badge: "", enabled: true, section: "Explore" },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredForPreview = items.filter((i) => {
    if (!i.enabled) return false;
    if (i.visibility === "all") return true;
    if (previewRole === "all") return true;
    return i.visibility === previewRole;
  });

  const groupedSections = SECTIONS.map((s) => ({
    section: s,
    items: items.filter((i) => i.section === s),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Item list */}
      <div className="xl:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Navigation Items</h3>
          <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Item
          </Button>
        </div>

        {groupedSections.map((group) => (
          <div key={group.section} className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">{group.section}</p>
            {group.items.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="pt-2 cursor-grab text-muted-foreground"><GripVertical className="h-4 w-4" /></div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <Input value={item.label} onChange={(e) => updateItem(item.id, { label: e.target.value })} placeholder="Label" className="text-sm" />
                    <Select value={item.icon} onValueChange={(v) => updateItem(item.id, { icon: v })}>
                      <SelectTrigger className="text-sm"><div className="flex items-center gap-2"><IconPreview name={item.icon} /><SelectValue /></div></SelectTrigger>
                      <SelectContent>{ICON_OPTIONS.map((ic) => (<SelectItem key={ic} value={ic}><div className="flex items-center gap-2"><IconPreview name={ic} /> {ic}</div></SelectItem>))}</SelectContent>
                    </Select>
                    <Input value={item.route} onChange={(e) => updateItem(item.id, { route: e.target.value })} placeholder="/route" className="text-sm font-mono" />
                    <Select value={item.visibility} onValueChange={(v) => updateItem(item.id, { visibility: v as VisibilityRule })}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{VISIBILITY_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={item.section} onValueChange={(v) => updateItem(item.id, { section: v })}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{SECTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
                    <Input value={item.badge} onChange={(e) => updateItem(item.id, { badge: e.target.value })} placeholder="Badge text" className="text-sm" />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={item.enabled} onCheckedChange={(v) => updateItem(item.id, { enabled: v })} />
                    <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}
        <DisabledActionBar />
      </div>

      {/* Preview panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Eye className="h-4 w-4" /> Preview</h3>
          <Select value={previewRole} onValueChange={(v) => setPreviewRole(v as VisibilityRule)}>
            <SelectTrigger className="w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{VISIBILITY_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <Card className="bg-surface-sunken p-0 overflow-hidden">
          <div className="w-full bg-card border-b border-border px-3 py-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sidebar Preview</span>
          </div>
          <div className="p-2 space-y-0.5">
            {filteredForPreview.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-sm text-foreground">
                <IconPreview name={item.icon} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.badge}</Badge>
                )}
              </div>
            ))}
            {filteredForPreview.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No items visible for this role</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Top Bar Controls ────────────────────────────────────────
function TopBarControlsTab() {
  const [controls, setControls] = useState<TopBarControl[]>(MOCK_TOPBAR);
  const [actions, setActions] = useState<QuickAction[]>(MOCK_QUICK_ACTIONS);

  const toggleControl = (id: string) => {
    setControls((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  const updateAction = (id: string, patch: Partial<QuickAction>) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const addAction = () => {
    setActions((prev) => [...prev, { id: String(Date.now()), label: "New Action", route: "/" }]);
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Bar Elements</CardTitle>
          <CardDescription>Toggle visibility of top bar controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {controls.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">{c.label}</span>
              <Switch checked={c.enabled} onCheckedChange={() => toggleControl(c.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Action buttons in the top bar</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addAction} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <Input value={a.label} onChange={(e) => updateAction(a.id, { label: e.target.value })} placeholder="Label" className="text-sm flex-1" />
              <Input value={a.route} onChange={(e) => updateAction(a.id, { route: e.target.value })} placeholder="/route" className="text-sm flex-1 font-mono" />
              <button onClick={() => removeAction(a.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="lg:col-span-2"><DisabledActionBar /></div>
    </div>
  );
}

// ─── Tab: Ad Banners & Offers ─────────────────────────────────────
function AdBannersTab() {
  const [banners, setBanners] = useState<BannerCard[]>(MOCK_BANNERS);

  const updateBanner = (id: string, patch: Partial<BannerCard>) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const addBanner = () => {
    setBanners((prev) => [
      ...prev,
      {
        id: String(Date.now()), title: "New Banner", description: "", imageUrl: "",
        ctaLabel: "Learn More", ctaLink: "/", targetRoles: ["all"],
        startDate: "", endDate: "", enabled: false, pinned: false, offerBadge: "",
      },
    ]);
  };

  const removeBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Banner Cards</h3>
        <Button variant="outline" size="sm" onClick={addBanner} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Banner
        </Button>
      </div>

      {banners.map((b) => (
        <Card key={b.id} className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{b.title || "Untitled"}</span>
                {b.pinned && <Badge variant="secondary" className="text-[10px]">Pinned</Badge>}
                {b.offerBadge && <Badge className="text-[10px] bg-success text-success-foreground">{b.offerBadge}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={b.enabled} onCheckedChange={(v) => updateBanner(b.id, { enabled: v })} />
                <button onClick={() => removeBanner(b.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <Input value={b.title} onChange={(e) => updateBanner(b.id, { title: e.target.value })} placeholder="Title" className="text-sm" />
              <Input value={b.description} onChange={(e) => updateBanner(b.id, { description: e.target.value })} placeholder="Description" className="text-sm" />
              <Input value={b.imageUrl} onChange={(e) => updateBanner(b.id, { imageUrl: e.target.value })} placeholder="Image URL" className="text-sm font-mono" />
              <Input value={b.ctaLabel} onChange={(e) => updateBanner(b.id, { ctaLabel: e.target.value })} placeholder="CTA Label" className="text-sm" />
              <Input value={b.ctaLink} onChange={(e) => updateBanner(b.id, { ctaLink: e.target.value })} placeholder="CTA Link" className="text-sm font-mono" />
              <Input value={b.offerBadge} onChange={(e) => updateBanner(b.id, { offerBadge: e.target.value })} placeholder="Offer badge e.g. +120%" className="text-sm" />
              <Input type="date" value={b.startDate} onChange={(e) => updateBanner(b.id, { startDate: e.target.value })} className="text-sm" />
              <Input type="date" value={b.endDate} onChange={(e) => updateBanner(b.id, { endDate: e.target.value })} className="text-sm" />
              <div className="flex items-center gap-2">
                <Switch checked={b.pinned} onCheckedChange={(v) => updateBanner(b.id, { pinned: v })} />
                <span className="text-xs text-muted-foreground">Pin to top</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
      <DisabledActionBar />
    </div>
  );
}

// ─── Tab: App Store & Apps ────────────────────────────────────────
function AppStoreTab() {
  const [apps, setApps] = useState<AppEntry[]>(MOCK_APPS);

  const statusColors: Record<AppEntry["status"], string> = {
    approved: "bg-success/10 text-success border-success/20",
    featured: "bg-accent/10 text-accent border-accent/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const statusIcons: Record<AppEntry["status"], LucideIcon> = {
    approved: CheckCircle2,
    featured: Star,
    pending: Eye,
    rejected: XCircle,
  };

  const setStatus = (id: string, status: AppEntry["status"]) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.info("Status change will apply when backend is connected");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Approved Apps</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {apps.map((app) => {
          const StatusIcon = statusIcons[app.status];
          return (
            <Card key={app.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <IconPreview name={app.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{app.link}</p>
                </div>
                <Badge className={`${statusColors[app.status]} text-[10px] gap-1`}>
                  <StatusIcon className="h-3 w-3" /> {app.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setStatus(app.id, "approved")}>Approve</Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setStatus(app.id, "rejected")}>Reject</Button>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => setStatus(app.id, "featured")}>
                  <Star className="h-3 w-3" /> Feature
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <DisabledActionBar />
    </div>
  );
}

// ─── Tab: Rules & Experiments ─────────────────────────────────────
function RulesTab() {
  const [experiments, setExperiments] = useState<Experiment[]>(MOCK_EXPERIMENTS);

  const toggleExp = (id: string) => {
    setExperiments((prev) => prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Feature Flags & Experiments</h3>
        <Badge variant="outline" className="text-[10px]">Placeholder</Badge>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="space-y-0 divide-y divide-border">
            {experiments.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{exp.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Variant {exp.variant} · Target: {VISIBILITY_OPTIONS.find((o) => o.value === exp.targetRole)?.label ?? exp.targetRole}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={exp.enabled ? "default" : "outline"} className="text-[10px]">
                    {exp.enabled ? "Active" : "Inactive"}
                  </Badge>
                  <Switch checked={exp.enabled} onCheckedChange={() => toggleExp(exp.id)} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <DisabledActionBar />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function ManageNavigation() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Navigation Manager</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the user-facing sidebar, top bar, banners, apps, and experiments.
        </p>
      </div>

      <Tabs defaultValue="sidebar" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="sidebar" className="gap-1.5 text-xs"><MenuIcon className="h-3.5 w-3.5" /> Sidebar Builder</TabsTrigger>
          <TabsTrigger value="topbar" className="gap-1.5 text-xs"><Search className="h-3.5 w-3.5" /> Top Bar</TabsTrigger>
          <TabsTrigger value="banners" className="gap-1.5 text-xs"><Image className="h-3.5 w-3.5" /> Ad Banners & Offers</TabsTrigger>
          <TabsTrigger value="apps" className="gap-1.5 text-xs"><AppWindow className="h-3.5 w-3.5" /> App Store</TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5 text-xs"><FlaskConical className="h-3.5 w-3.5" /> Rules & Experiments</TabsTrigger>
        </TabsList>

        <TabsContent value="sidebar"><SidebarBuilderTab /></TabsContent>
        <TabsContent value="topbar"><TopBarControlsTab /></TabsContent>
        <TabsContent value="banners"><AdBannersTab /></TabsContent>
        <TabsContent value="apps"><AppStoreTab /></TabsContent>
        <TabsContent value="rules"><RulesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
