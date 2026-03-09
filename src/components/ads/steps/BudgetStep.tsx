import { useState } from "react";
import { AlertCircle, Info, X, CreditCard, Smartphone, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CampaignData } from "../CampaignWizard";
import yanguLogo from "@/assets/yangu-logo-full.png";

interface BudgetStepProps {
  data: CampaignData;
  onChange: (data: CampaignData) => void;
  onLaunch?: () => void;
}

const QUICK_BUDGETS = [50, 200, 500];
const MIN_BUDGET = 50;

export function BudgetStep({ data, onChange, onLaunch }: BudgetStepProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [inputValue, setInputValue] = useState(
    data.dailyBudget ? data.dailyBudget.toFixed(2) : ""
  );

  const reachPercent = Math.min(((data.dailyBudget || 0) / 500) * 100, 100);
  const isValid = data.dailyBudget >= MIN_BUDGET;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    // Prevent multiple dots
    const parts = raw.split(".");
    const sanitized = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;
    setInputValue(sanitized);
    const num = parseFloat(sanitized);
    onChange({ ...data, dailyBudget: isNaN(num) ? 0 : num });
  };

  const handleInputBlur = () => {
    const num = parseFloat(inputValue);
    if (!isNaN(num) && num > 0) {
      setInputValue(num.toFixed(2));
    } else {
      setInputValue("");
    }
  };

  const handleQuickBudget = (b: number) => {
    setInputValue(b.toFixed(2));
    onChange({ ...data, dailyBudget: b });
  };

  const handleLaunchClick = () => {
    if (isValid) {
      setShowPayment(true);
    }
  };

  const handlePayConfirm = () => {
    setShowPayment(false);
    onLaunch?.();
  };

  return (
    <>
      <div className="space-y-8 max-w-3xl">
        {/* Potential audience reach */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-white/60">
              Potential audience reach
            </span>
            <Info className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span
              className="text-4xl font-bold"
              style={{ color: "#b5622a" }}
            >
              95M - 105M
            </span>
            <span className="text-base text-white/30">/ 265M</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${reachPercent}%`,
                  background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)",
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white/70 hover:text-white hover:bg-white/5 rounded-xl text-xs px-4 h-8 shrink-0"
            >
              Add more media
            </Button>
          </div>
        </div>

        {/* Daily budget */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <label className="block text-sm font-semibold text-white">
              Daily budget
            </label>
            <Info className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-base font-medium">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="$0.00"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl text-white pl-8 pr-4 py-3 text-base outline-none transition-colors focus:border-[#b5622a] focus:ring-1 focus:ring-[#b5622a]/30 placeholder:text-white/20"
            />
          </div>

          {/* Validation */}
          {!isValid && data.dailyBudget > 0 && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Daily budgets start at $50</span>
            </div>
          )}

          {/* Quick buttons */}
          <div className="flex gap-2 mt-3">
            {QUICK_BUDGETS.map((b) => (
              <button
                key={b}
                onClick={() => handleQuickBudget(b)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background:
                    data.dailyBudget === b
                      ? "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)"
                      : "rgba(255,255,255,0.04)",
                  color:
                    data.dailyBudget === b ? "#fff" : "rgba(255,255,255,0.5)",
                  border:
                    data.dailyBudget === b
                      ? "none"
                      : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                ${b}/day
              </button>
            ))}
          </div>
        </div>

        {/* Terms */}
        <p className="text-sm text-white/30">
          By launching your campaign you agree to the{" "}
          <a
            href="#"
            className="underline hover:text-white/50"
            style={{ color: "#b5622a" }}
          >
            YANGU Ads Terms
          </a>{" "}
          and allow us to charge your payment method for your campaign.
        </p>

        {/* Hidden trigger for header Launch button */}
        <button
          data-launch-campaign
          className="hidden"
          onClick={handleLaunchClick}
        />
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}
                  >
                    <span className="text-white text-xs font-bold">Y</span>
                  </div>
                  <span className="text-gray-900 font-semibold text-sm">
                    YANGU Ads
                  </span>
                </div>
                <button
                  onClick={() => setShowPayment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-500 text-xs mb-2">Charge from YANGU Ads</p>

              <div className="text-center py-3">
                <p className="text-gray-500 text-sm">YANGU Ads</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">
                  ${data.dailyBudget.toFixed(2)}
                </p>
              </div>

              <div className="mt-2">
                <p className="text-gray-700 text-xs font-semibold">Description</p>
                <p className="text-gray-500 text-xs">Charge from YANGU Ads</p>
              </div>
            </div>

            {/* Payment form */}
            <div className="px-6 pb-6 space-y-4">
              {/* Card input mockup */}
              <div>
                <p className="text-gray-700 text-xs font-semibold mb-2">
                  Payment method
                </p>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-3 border-b border-gray-100">
                    <div className="w-4 h-4 rounded-full border-2 border-[#b5622a] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#b5622a]" />
                    </div>
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Card</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">
                      Card information
                    </p>
                    <input
                      type="text"
                      placeholder="1234 1234 1234 1234"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#b5622a]"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="MM / YY"
                        className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#b5622a]"
                      />
                      <input
                        type="text"
                        placeholder="CVC"
                        className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#b5622a]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay button */}
              <button
                onClick={handlePayConfirm}
                className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)",
                }}
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
