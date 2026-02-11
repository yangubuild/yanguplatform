import { useState, useRef, useEffect } from "react";
import { Menu, Search, Gift, Bell, ChevronDown, User } from "lucide-react";
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
];

interface NavDashHeaderProps {
  onMenuToggle?: () => void;
}

export function NavDashHeader({ onMenuToggle }: NavDashHeaderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
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
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{
            background: "#2a3038",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <Search className="w-4 h-4" />
        </button>

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
                  onClick={() => { setSelectedCurrency(cur); setCurrencyOpen(false); }}
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

        {/* Deposit button */}
        <button
          className="h-9 px-5 rounded-lg text-xs font-bold text-white"
          style={{
            background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)",
          }}
        >
          Deposit
        </button>

        {/* Gift icon */}
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ background: "#2a3038", color: "rgba(255,255,255,0.5)" }}
        >
          <Gift className="w-4 h-4" />
        </button>

        {/* Notification */}
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <Bell className="w-4 h-4" />
        </button>

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
