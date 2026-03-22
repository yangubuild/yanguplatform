import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, LayoutDashboard, Code, Key, CreditCard, Settings, BookOpen, HelpCircle, X, MessageSquare, Mail, User, Webhook, Loader2, Activity } from "lucide-react";
import { MassSidebar } from "@/components/mass/MassSidebar";
import { MassHeader } from "@/components/mass/MassHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperAuthModal } from "@/components/developers/DeveloperAuthModal";
import yanguYIcon from "@/assets/yangu-y-icon.png";
import { LegalFooter } from "@/components/LegalFooter";

const portalNav = [
  { label: "Overview", path: "/developers/portal/overview", icon: LayoutDashboard },
  { label: "Apps", path: "/developers/portal/apps", icon: Code },
  { label: "API Keys", path: "/developers/portal/api-keys", icon: Key },
  { label: "Webhooks", path: "/developers/portal/webhooks", icon: Webhook },
  { label: "Logs", path: "/developers/portal/logs", icon: Activity },
  { label: "Profile", path: "/developers/portal/profile", icon: User },
  { label: "Settings", path: "/developers/portal/settings", icon: Settings },
  { label: "Billing", path: "/developers/portal/billing", icon: CreditCard },
];

export function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportTab, setSupportTab] = useState<"help" | "contact">("help");
  const [showAuth, setShowAuth] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Auto-open auth modal for unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuth(true);
    }
  }, [isLoading, isAuthenticated]);

  // Auto-open support FAB on first portal visit
  useEffect(() => {
    const seen = localStorage.getItem("portal_support_seen");
    if (!seen) {
      setSupportOpen(true);
      localStorage.setItem("portal_support_seen", "1");
    }
  }, []);

  // Block rendering when not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#08120D" }}>
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#08120D" }}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Developer Portal</h2>
          <p className="text-muted-foreground text-sm mb-6">Sign in to access the developer portal.</p>
          <Button variant="accent" onClick={() => setShowAuth(true)}>Sign In</Button>
        </div>
        <DeveloperAuthModal
          open={showAuth}
          onClose={() => {
            setShowAuth(false);
            navigate("/developers");
          }}
          returnTo={location.pathname}
          onSuccess={() => {
            setShowAuth(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#08120D" }}>
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-foreground lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[240px] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-8">
          <MassHeader hideTrends />

          <div className="flex gap-6 mt-6">
            {/* Portal left nav */}
            <div className="hidden md:block w-[200px] flex-shrink-0">
              <nav className="sticky top-8">
                <span className="text-muted-foreground text-sm font-semibold leading-5 block mb-4">Developer Portal</span>
                <div className="border-b border-white/10 mb-4" />

                <div className="mb-6">
                  <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider leading-4 mb-2 px-1">Manage</h4>
                  <ul className="space-y-0.5">
                    {portalNav.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <li key={item.path}>
                          <button
                            onClick={() => navigate(item.path)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm leading-5 transition-colors flex items-center gap-2 ${
                              isActive ? "text-accent bg-accent/8" : "text-muted-foreground bg-transparent"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="border-b border-white/10 mb-4" />

                <button
                  onClick={() => navigate("/developers/docs")}
                  className="w-full text-left px-3 py-1.5 rounded-md text-sm leading-5 transition-colors flex items-center gap-2 text-muted-foreground hover:text-muted-foreground"
                >
                  <BookOpen className="w-4 h-4" />
                  API Docs
                </button>
              </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <Outlet />
            </div>

            {/* Support toggle */}
            <div className="hidden lg:block">
              <button
                onClick={() => setSupportOpen(!supportOpen)}
                className="fixed right-6 bottom-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors [background:linear-gradient(90deg,#b5622a_0%,#5c2a12_100%)] hover:brightness-110"
              >
                {supportOpen ? <X className="w-5 h-5 text-foreground" /> : <HelpCircle className="w-5 h-5 text-foreground" />}
              </button>
            </div>
          </div>
        </div>

        {/* Support Panel */}
        {supportOpen && (
          <div
            className="fixed right-6 bottom-20 z-40 w-[360px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#111a14", border: "1px solid rgba(255,255,255,0.10)", maxHeight: "70vh" }}
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="text-foreground font-semibold text-sm">Support</h3>
              <div className="flex gap-1 mt-3 p-1 rounded-lg bg-white/5">
                <button
                  onClick={() => setSupportTab("help")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                    supportTab === "help" ? "bg-white/10 text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <MessageSquare className="w-3 h-3" /> Help / Q&A
                </button>
                <button
                  onClick={() => setSupportTab("contact")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                    supportTab === "contact" ? "bg-white/10 text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Mail className="w-3 h-3" /> Contact
                </button>
              </div>
            </div>

            <div className="p-4" style={{ minHeight: 200 }}>
              {supportTab === "help" ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-4">Ask ADA anything about the developer platform.</p>
                  <Button variant="accent" size="sm" onClick={() => navigate("/dashboard/ada")}>
                    Open ADA Chat
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-4">Reach our developer support team.</p>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => window.open("mailto:developers@yangu.com", "_blank")}
                  >
                    Email Support
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <LegalFooter />
      </main>
    </div>
  );
}
