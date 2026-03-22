import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Bar, BarChart, CartesianGrid } from "recharts";

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days"] as const;
const GRANULARITY = ["Daily", "Weekly", "Monthly"] as const;

function generateDummyChart(days: number) {
  const data = [];
  const now = new Date();
  for (let i = days; i>= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.floor(Math.random() * 5),
    });
  }
  return data;
}

const STAT_CARDS = [
  { label: "Gross revenue", value: "$0.00", prefix: "$" },
  { label: "Net revenue", value: "$0.00", prefix: "$" },
  { label: "New users", value: "0", prefix: "" },
  { label: "MRR", value: "$0.00", prefix: "$" },
  { label: "ARR", value: "$0.00", prefix: "$" },
  { label: "Churn rate", value: "0%", prefix: "" },
];

const RECOMMENDED_APPS = [
  { name: "Automations", provider: "yangu", desc: "Send emails and create workflows (replaces Zapier and N8N)" },
  { name: "Email Marketing & Automations", provider: "yangu", desc: "Email marketing campaigns and automated sequences" },
  { name: "Contracts", provider: "yangu", desc: "Create contracts, collect signatures and payments, and automate invoices." },
];

export default function BusinessAnalyticsPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<string>("Last 7 days");
  const chartData = generateDummyChart(7);

  return (
    <div className="p-6 space-y-8 max-w-6xl min-h-screen bg-background">
      <button onClick={() => navigate("/dashboard/my-business")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to My Business
      </button>

      {/* Today hero */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Today</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div>
            <div className="flex gap-8 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Gross revenue</p>
                <p className="text-lg text-muted-foreground">--</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Yesterday</p>
                <p className="text-lg text-muted-foreground">--</p>
              </div>
            </div>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Area type="stepAfter" dataKey="value" stroke="hsl(var(--muted-foreground))" strokeWidth={1} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-4 border-l border-border pl-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total balance</p>
              <button className="text-sm text-primary hover:underline">View</button>
            </div>
            <p className="text-2xl font-bold text-foreground">$0.00</p>
            <p className="text-xs text-muted-foreground">$0.00 available</p>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Payouts</p>
              <button className="text-sm text-primary hover:underline">View</button>
            </div>
            <p className="text-lg text-muted-foreground">--</p>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Stats</h2>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <Button key={p} size="sm" variant={period === p ? "secondary" : "ghost"} className="text-xs rounded-xl" onClick={() => setPeriod(p)}>
              {p} <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          ))}
          <span className="text-xs text-muted-foreground">compared to</span>
          <Button size="sm" variant="ghost" className="text-xs rounded-xl">Previous period <ChevronDown className="h-3 w-3 ml-1" /></Button>
          <Button size="sm" variant="ghost" className="text-xs rounded-xl">Daily <ChevronDown className="h-3 w-3 ml-1" /></Button>
          <Button size="sm" variant="ghost" className="text-xs rounded-xl">All products <ChevronDown className="h-3 w-3 ml-1" /></Button>
        </div>

        {/* Stat metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <div className="h-[80px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground border border-border px-2 py-1 rounded">No data available</span>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Mar 3</span><span>Today</span>
              </div>
            </div>
          ))}
        </div>

        {/* Payments breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 max-w-md">
          <p className="text-sm font-medium text-foreground mb-4">Payments breakdown</p>
          <div className="h-[120px] flex items-center justify-center">
            <span className="text-xs text-muted-foreground border border-border px-2 py-1 rounded">No data available</span>
          </div>
        </div>
      </div>

      {/* Recommended apps */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Recommended apps to grow your business</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RECOMMENDED_APPS.map((app) => (
            <div key={app.name} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{app.name}</p>
                  <p className="text-xs text-muted-foreground">{app.provider}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{app.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
