import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Gift, Bell, ChevronDown, User, MessageCircle, TrendingUp, X } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import yanguLogo from "@/assets/yangu-logo-full.png";

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

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "message" as const, title: "New message from Team Yangu", time: "2m ago", read: false },
  { id: "2", type: "offer" as const, title: "Flash sale: 30% off premium", time: "1h ago", read: false },
  { id: "3", type: "order" as const, title: "Order #4821 confirmed", time: "3h ago", read: true },
  { id: "4", type: "message" as const, title: "Ada replied to your thread", time: "5h ago", read: true },
  { id: "5", type: "offer" as const, title: "New partnership offer received", time: "1d ago", read: true },
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

interface NavDashHeaderProps {
  onMenuToggle?: () => void;
}

export function NavDashHeader({ onMenuToggle }: NavDashHeaderProps) {
  const { isAdmin } = useRoles();
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState(getStoredCurrency);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  const notifRouteMap: Record<string, string> = {
    message: "/dashboard/messages",
    offer: "/dashboard/offers",
    order: "/dashboard/seller",
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-16"
      style={{
        background: "linear-gradient(90deg, #1f262b 0%, #232a30 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 lg:hidden"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src={yanguLogo} alt="Yangu" className="h-10 w-auto" />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative flex items-center" ref={searchContainerRef}>
          <div
            className="flex items-center h-9 rounded-[10px] overflow-hidden transition-all duration-300 ease-in-out"
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

        {/* Balance pill with currency dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setCurrencyOpen(!currencyOpen)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg"
            style={{
              background: "#2a3038",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: "linear-gradient(135deg, #b5622a 0%, #5c2a12 100%)", color: "#fff" }}
            >
              {selectedCurrency.symbol.charAt(0)}
            </div>
            <span className="text-xs font-medium whitespace-nowrap">{selectedCurrency.code} 0.00</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${currencyOpen ? "rotate-180" : ""}`} style={{ color: "rgba(255,255,255,0.35)" }} />
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

        {/* Earnings button (was Deposit) */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="h-9 px-5 rounded-lg text-xs font-bold text-white"
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
                onClick={() => navigate("/dashboard/dashboard/earnings")}
                className="w-full h-8 rounded-lg text-xs font-bold text-white mt-1"
                style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
              >
                View reports
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Gift icon */}
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ background: "#2a3038", color: "rgba(255,255,255,0.5)" }}
        >
          <Gift className="w-4 h-4" />
        </button>

        {/* Global Chat (replaced Settings) */}
        <button
          onClick={() => navigate("/dashboard/messages?tab=global")}
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ background: "#2a3038", color: "rgba(255,255,255,0.5)" }}
          title="Global Chat"
        >
          <MessageCircle className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-9 h-9 rounded-[10px] flex items-center justify-center relative"
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

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: "#2a3038",
            border: "2px solid rgba(255,255,255,0.1)",
          }}
        >
          <User className="w-4 h-4" style={{ color: "rgba(255,255,255,0.6)" }} />
        </div>
      </div>
    </header>
  );
}
