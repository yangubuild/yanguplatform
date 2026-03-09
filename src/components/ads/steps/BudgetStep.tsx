import { Input } from "@/components/ui/input";
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CampaignData } from "../CampaignWizard";

interface BudgetStepProps {
  data: CampaignData;
  onChange: (data: CampaignData) => void;
}

const QUICK_BUDGETS = [50, 200, 500];

export function BudgetStep({ data, onChange }: BudgetStepProps) {
  const reachPercent = Math.min(((data.dailyBudget || 0) / 500) * 100, 100);
  const isValid = data.dailyBudget >= 50;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Audience reach */}
      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-sm font-medium text-white/60 mb-1">
          Potential audience reach
        </h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-white">95M - 105M</span>
          <span className="text-sm text-white/30">/ 265M</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${reachPercent}%` }}
          />
        </div>
      </div>

      {/* Add more media */}
      <Button
        variant="outline"
        className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add more media
      </Button>

      {/* Daily budget */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Daily budget
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
          <Input
            type="number"
            min={0}
            value={data.dailyBudget || ""}
            onChange={(e) =>
              onChange({ ...data, dailyBudget: Number(e.target.value) })
            }
            className="bg-white/5 border-white/10 text-white pl-7 h-11"
          />
        </div>

        {/* Quick buttons */}
        <div className="flex gap-2 mt-3">
          {QUICK_BUDGETS.map((b) => (
            <button
              key={b}
              onClick={() => onChange({ ...data, dailyBudget: b })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                data.dailyBudget === b
                  ? "bg-blue-600 text-white"
                  : "bg-white/[0.04] text-white/50 border border-white/10 hover:bg-white/[0.08]"
              }`}
            >
              ${b}/day
            </button>
          ))}
        </div>

        {/* Validation */}
        {!isValid && data.dailyBudget > 0 && (
          <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Daily budgets start at $50</span>
          </div>
        )}
      </div>
    </div>
  );
}
