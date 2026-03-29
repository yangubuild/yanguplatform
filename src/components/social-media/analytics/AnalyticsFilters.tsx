import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import type { SocialConnectedAccount, AnalyticsDateRange } from "@/types/socialMedia";
import { format, subDays } from "date-fns";

type Preset = "7d" | "30d" | "90d" | "custom";

const PRESETS: { label: string; value: Preset; days?: number }[] = [
  { label: "Past 7 Days", value: "7d", days: 7 },
  { label: "Past 30 Days", value: "30d", days: 30 },
  { label: "Past 90 Days", value: "90d", days: 90 },
  { label: "Custom", value: "custom" },
];

interface AnalyticsFiltersProps {
  accounts: SocialConnectedAccount[];
  selectedAccountId: string | null;
  onAccountChange: (id: string | null) => void;
  dateRange: AnalyticsDateRange;
  onDateRangeChange: (range: AnalyticsDateRange) => void;
}

export function AnalyticsFilters({
  accounts,
  selectedAccountId,
  onAccountChange,
  dateRange,
  onDateRangeChange,
}: AnalyticsFiltersProps) {
  const [preset, setPreset] = useState<Preset>("30d");
  const [calOpen, setCalOpen] = useState(false);

  const handlePreset = (p: Preset) => {
    setPreset(p);
    const match = PRESETS.find((x) => x.value === p);
    if (match?.days) {
      const end = new Date();
      const start = subDays(end, match.days);
      onDateRangeChange({
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
      });
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const presetLabel = PRESETS.find((p) => p.value === preset)?.label ?? "Past 30 Days";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Account selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-border bg-card text-muted-foreground gap-1.5"
          >
            {accounts.length === 0
              ? "No socials connected"
              : selectedAccount
              ? `${selectedAccount.provider_account_name || selectedAccount.provider}`
              : "All accounts"}
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
          <DropdownMenuItem onClick={() => onAccountChange(null)}>
            All accounts
          </DropdownMenuItem>
          {accounts.map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => onAccountChange(a.id)}>
              {a.provider_account_name || a.provider}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Preset selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-border bg-card text-muted-foreground gap-1.5"
          >
            {presetLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {PRESETS.map((p) => (
            <DropdownMenuItem
              key={p.value}
              onClick={() => {
                if (p.value === "custom") {
                  setPreset("custom");
                  setCalOpen(true);
                } else {
                  handlePreset(p.value);
                }
              }}
            >
              {p.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date range display / picker */}
      <Popover open={calOpen} onOpenChange={setCalOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-border bg-card text-muted-foreground gap-1.5"
          >
            {dateRange.start_date} → {dateRange.end_date}
            <Calendar className="w-3.5 h-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker
            mode="range"
            selected={{
              from: new Date(dateRange.start_date),
              to: new Date(dateRange.end_date),
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setPreset("custom");
                onDateRangeChange({
                  start_date: format(range.from, "yyyy-MM-dd"),
                  end_date: format(range.to, "yyyy-MM-dd"),
                });
                setCalOpen(false);
              }
            }}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
