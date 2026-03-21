import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Gift, Bell, ChevronDown, User, TrendingUp, Globe } from "lucide-react";
import chatIcon1 from "@/assets/chat_icon_1.png";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GlobalChatPopup } from "@/components/messages/GlobalChatPopup";
import yanguLogo from "@/assets/yangu-logo-full.png";
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const CURRENCIES = [
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar" },
  { code: "OMR", symbol: "﷼", name: "Omani Rial" },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "RWF", symbol: "FRw", name: "Rwandan Franc" },
];

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

// Notifications are now loaded from real data via useNotifications hook

const MOCK_OFFERS = [
  { id: "1", title: "Premium Partnership", snippet: "New collaboration opportunity from Brand X", time: "30m ago" },
  { id: "2", title: "Sponsored Content Deal", snippet: "Campaign offer: $500 for 3 posts", time: "2h ago" },
  { id: "3", title: "Affiliate Program Invite", snippet: "Join our top-tier affiliate program", time: "1d ago" },
];

function getStoredCurrency() {
  try {
    const stored = localStorage.getItem("yangu_currency");
    if (stored) {
      const found = CURRENCIES.find((c) => c.code === stored);
      if (found) return found;
    }
  } catch {}
  return CURRENCIES[0];
}

function getStoredLanguage() {
  try {
    const stored = localStorage.getItem("yangu_language");
    if (stored) {
      const found = LANGUAGES.find((l) => l.code === stored);
      if (found) return found;
    }
  } catch {}
  return LANGUAGES[0];
}

interface NavDashHeaderProps {
  onMenuToggle?: () => void;
}

export function NavDashHeader({ onMenuToggle }: NavDashHeaderProps) {
  const { isAdmin } = useRoles();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState(getStoredCurrency);
  const [selectedLanguage, setSelectedLanguage] = useState(getStoredLanguage);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalChatOpen, setGlobalChatOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  function handleCurrencySelect(cur: typeof CURRENCIES[number]) {
    setSelectedCurrency(cur);
    setCurrencyOpen(false);
    try { localStorage.setItem("yangu_currency", cur.code); } catch {}
  }

  function handleLanguageSelect(lang: typeof LANGUAGES[number]) {
    setSelectedLanguage(lang);
    try { localStorage.setItem("yangu_language", lang.code); } catch {}
  }

  const notifRouteMap: Record<string, string> = {
    message: "/dashboard/messages",
    offer: "/dashboard/offers",
    order: "/dashboard/seller",
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-5 h-16 max-w-[100vw]"
        style={{
          background: "linear-gradient(90deg, #1f262b 0%, #232a30 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onMenuToggle}
            className="p-2 lg:hidden"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src={yanguLogo} alt="yangu" className="h-8 sm:h-10 w-auto shrink-0" />
        </div>

        {/* Right — shrink gaps on mobile, hide non-critical icons */}
        <div className="flex items-center gap-1 sm:gap-2.5 overflow-hidden min-w-0 flex-1 justify-end">
          {/* Search — hidden on mobile to save space */}
          <div className="relative hidden sm:flex items-center" ref={searchContainerRef}>
            <div
              className="flex items-center h-9 rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                width: searchOpen ? "260px" : "36px",
                background: "#2a3038",
              }}
            >
              {searchOpen && (
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  className="h-full bg-transparent border-none outline-none text-xs pl-3 pr-2 flex-1"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  onKeyDown={(e) => { if (e.key === "Escape") setSearchOpen(false); }}
                />
              )}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Language selector — hidden on mobile */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-9 h-9 rounded-lg hidden sm:flex items-center justify-center"
                style={{ background: "#2a3038", color: "rgba(255,255,255,0.5)" }}
                title="Language"
              >
                <Globe className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-48 p-0 border-0"
              style={{
                background: "#2a3038",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Language</span>
              </div>
              <div className="py-1 max-h-52 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                    style={{
                      color: lang.code === selectedLanguage.code ? "#fff" : "rgba(255,255,255,0.6)",
                      background: lang.code === selectedLanguage.code ? "rgba(74,222,128,0.1)" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (lang.code !== selectedLanguage.code) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={(e) => { if (lang.code !== selectedLanguage.code) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span className="text-sm">{lang.flag}</span>
                    <span className="text-xs font-medium">{lang.name}</span>
                    {lang.code === selectedLanguage.code && (
                      <span className="ml-auto text-[10px]" style={{ color: "#4ade80" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Balance pill with currency dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setCurrencyOpen(!currencyOpen)}
              className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 rounded-lg"
              style={{
                background: "#2a3038",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #b5622a 0%, #5c2a12 100%)", color: "#fff" }}
              >
                {selectedCurrency.symbol.charAt(0)}
              </div>
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">{selectedCurrency.code} 0.00</span>
              <ChevronDown className={`w-3 h-3 transition-transform shrink-0 ${currencyOpen ? "rotate-180" : ""}`} style={{ color: "rgba(255,255,255,0.35)" }} />
            </button>

            {currencyOpen && (
              <div
                className="absolute right-0 top-11 w-56 max-h-72 overflow-y-auto rounded-xl py-1 z-50"
                style={{
                  background: "#2a3038",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                {CURRENCIES.map((cur) => (
                  <button
                    key={cur.code}
                    onClick={() => handleCurrencySelect(cur)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                    style={{
                      color: cur.code === selectedCurrency.code ? "#fff" : "rgba(255,255,255,0.6)",
                      background: cur.code === selectedCurrency.code ? "rgba(74,222,128,0.1)" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (cur.code !== selectedCurrency.code) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={(e) => { if (cur.code !== selectedCurrency.code) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span className="w-6 text-center text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>{cur.symbol}</span>
                    <span className="text-xs font-medium">{cur.code}</span>
                    <span className="text-[11px] ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>{cur.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Earnings button */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="h-8 sm:h-9 px-2.5 sm:px-5 rounded-lg text-[10px] sm:text-xs font-bold text-white whitespace-nowrap shrink min-w-0"
                style={{
                  background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)",
                }}
              >
                Earnings
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 p-0 border-0"
              style={{
                background: "#2a3038",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "rgba(74,222,128,0.8)" }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Earnings Summary</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>This month</span>
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{selectedCurrency.symbol} 0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Pending</span>
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{selectedCurrency.symbol} 0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>All time</span>
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{selectedCurrency.symbol} 0.00</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/dashboard/profile")}
                  className="w-full h-8 rounded-lg text-xs font-bold text-white mt-1"
                  style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
                >
                  View reports
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Offers icon — hidden on mobile */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-9 h-9 rounded-lg hidden sm:flex items-center justify-center"
                style={{ background: "#2a3038", color: "rgba(255,255,255,0.5)" }}
                title="Offers"
              >
                <Gift className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 p-0 border-0"
              style={{
                background: "#2a3038",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>New Offers</span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{MOCK_OFFERS.length} active</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {MOCK_OFFERS.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>No offers yet</span>
                  </div>
                ) : (
                  MOCK_OFFERS.map((offer) => (
                    <button
                      key={offer.id}
                      onClick={() => navigate("/dashboard/offers")}
                      className="w-full flex flex-col gap-0.5 px-4 py-2.5 text-left transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{offer.title}</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{offer.time}</span>
                      </div>
                      <span className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{offer.snippet}</span>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Global Chat overlay trigger — hidden on mobile */}
          <button
            onClick={() => setGlobalChatOpen(!globalChatOpen)}
            className="w-9 h-9 hidden sm:flex items-center justify-center"
            style={{
              background: "transparent",
            }}
            title="Global Chat"
          >
            <img src={chatIcon1} alt="Chat" className="w-7 h-7 object-contain transition-transform hover:scale-105" style={{ filter: globalChatOpen ? 'drop-shadow(0 0 6px rgba(249,115,22,0.4))' : 'none' }} />
          </button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center relative"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <Bell className="w-4 h-4" />
                {MOCK_NOTIFICATIONS.some((n) => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 p-0 border-0"
              style={{
                background: "#2a3038",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Notifications</span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {MOCK_NOTIFICATIONS.filter((n) => !n.read).length} new
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => navigate(notifRouteMap[notif.type] || "/dashboard")}
                    className="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: notif.read ? "transparent" : "rgba(74,222,128,0.04)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = notif.read ? "transparent" : "rgba(74,222,128,0.04)")}
                  >
                    {!notif.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4ade80" }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{notif.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{notif.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile avatar */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                style={profile && resolveAvatarUrl(profile)
                  ? { background: "transparent" }
                  : { background: "#2a3038", border: "2px solid rgba(255,255,255,0.1)" }
                }
              >
                {profile && resolveAvatarUrl(profile) ? (
                  <img src={resolveAvatarUrl(profile)!} alt="Avatar" className="w-8 h-8 rounded-full object-cover" style={{ clipPath: "circle(50%)" }} />
                ) : (
                  <User className="w-4 h-4" style={{ color: "rgba(255,255,255,0.6)" }} />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-56 p-0 border-0"
              style={{
                background: "#2a3038",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {profile?.display_name || profile?.username || "User"}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {profile?.username ? `@${profile.username}` : ""}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => navigate("/dashboard/profile")}
                  className="w-full px-4 py-2.5 text-left text-xs transition-colors"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  View Profile
                </button>
                <button
                  onClick={() => navigate("/dashboard/subscriptions")}
                  className="w-full px-4 py-2.5 text-left text-xs transition-colors"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Manage Subscription
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Global Chat Overlay */}
      {globalChatOpen && <GlobalChatPopup onClose={() => setGlobalChatOpen(false)} />}
    </>
  );
}
