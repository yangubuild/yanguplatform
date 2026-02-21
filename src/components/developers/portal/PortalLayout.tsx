import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, LayoutDashboard, Code, Key, CreditCard, Settings, BookOpen, HelpCircle, X, MessageSquare, Mail } from "lucide-react";
import { MassSidebar } from "@/components/mass/MassSidebar";
import { MassHeader } from "@/components/mass/MassHeader";
import { Button } from "@/components/ui/button";
import yanguYIcon from "@/assets/yangu-y-icon.png";

const portalNav = [
  { label: "Overview", path: "/developers/portal/overview", icon: LayoutDashboard },
  { label: "Apps", path: "/developers/portal/apps", icon: Code },
  { label: "API Keys", path: "/developers/portal/api-keys", icon: Key },
  { label: "Settings", path: "/developers/portal/settings", icon: Settings },
  { label: "Billing", path: "/developers/portal/billing", icon: CreditCard },
];

export function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportTab, setSupportTab] = useState<"help" | "contact">("help");
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "#08120D" }}>
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[240px] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8">
          <MassHeader hideTrends />

          <div className="flex gap-8 mt-6">
            {/* Portal left nav */}
            <div className="hidden md:block w-[220px] flex-shrink-0">
              <nav className="sticky top-8">
                <span className="text-white/90 text-sm font-semibold leading-5 block mb-4">Developer Portal</span>
                <div className="border-b border-white/10 mb-4" />

                <div className="mb-6">
                  <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider leading-4 mb-2 px-1">Manage</h4>
                  <ul className="space-y-0.5">
                    {portalNav.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <li key={item.path}>
                          <button
                            onClick={() => navigate(item.path)}
                            className="w-full text-left px-3 py-1.5 rounded-md text-sm leading-5 transition-colors flex items-center gap-2"
                            style={{
                              color: isActive ? "#F46D2A" : "rgba(255,255,255,0.55)",
                              background: isActive ? "rgba(244,109,42,0.08)" : "transparent",
                            }}
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
                  onClick={() => navigate("/developers")}
                  className="w-full text-left px-3 py-1.5 rounded-md text-sm leading-5 transition-colors flex items-center gap-2 text-white/55 hover:text-white/80"
                >
                  <BookOpen className="w-4 h-4" />
                  Docs
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
                className="fixed right-6 bottom-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors"
                style={{ background: "linear-gradient(135deg, #F46D2A, #d45a1f)" }}
              >
                {supportOpen ? <X className="w-5 h-5 text-white" /> : <HelpCircle className="w-5 h-5 text-white" />}
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
              <h3 className="text-white font-semibold text-sm">Support</h3>
              <div className="flex gap-1 mt-3 p-1 rounded-lg bg-white/5">
                <button
                  onClick={() => setSupportTab("help")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                    supportTab === "help" ? "bg-white/10 text-white" : "text-white/50"
                  }`}
                >
                  <MessageSquare className="w-3 h-3" /> Help / Q&A
                </button>
                <button
                  onClick={() => setSupportTab("contact")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                    supportTab === "contact" ? "bg-white/10 text-white" : "text-white/50"
                  }`}
                >
                  <Mail className="w-3 h-3" /> Contact
                </button>
              </div>
            </div>

            <div className="p-4" style={{ minHeight: 200 }}>
              {supportTab === "help" ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm mb-4">Ask ADA anything about the developer platform.</p>
                  <Button variant="accent" size="sm" onClick={() => navigate("/dashboard/ada")}>
                    Open ADA Chat
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm mb-4">Reach our developer support team.</p>
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

        <footer className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
            <span>©</span>
            <img src={yanguYIcon} alt="Yangu" className="w-4 h-4 opacity-50" />
            <span>yangu 2026</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
