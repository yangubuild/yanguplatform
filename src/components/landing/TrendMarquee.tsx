import { TrendingUp } from "lucide-react";

const trends = [
  "triple your sales this month",
  "automated invoicing - get paid fast",
  "sign documents digitally",
  "manage all documents in one place",
  "build your company knowledge base",
  "email marketing that converts",
  "track inventory in real-time",
  "accept payments globally",
  "build customer loyalty programs",
  "automate your workflows",
];

export function TrendMarquee() {
  return (
    <div className="w-full bg-[hsl(0_0%_5%)] border-b border-[hsl(0_0%_15%)] py-3 overflow-hidden">
      <div className="flex items-center">
        {/* View Trends Link */}
        <a
          href="#trends"
          className="flex-shrink-0 flex items-center gap-2 px-4 text-[hsl(15_77%_60%)] hover:text-[hsl(15_77%_70%)] transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium whitespace-nowrap">View Trends</span>
        </a>

        {/* Marquee Container */}
        <div className="flex-1 overflow-hidden relative">
          <div className="landing-marquee flex items-center gap-3">
            {/* First set of pills */}
            {trends.map((trend, index) => (
              <span
                key={`a-${index}`}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(0_0%_10%)] text-[hsl(0_0%_70%)] border border-[hsl(0_0%_20%)] whitespace-nowrap"
              >
                {trend}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {trends.map((trend, index) => (
              <span
                key={`b-${index}`}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(0_0%_10%)] text-[hsl(0_0%_70%)] border border-[hsl(0_0%_20%)] whitespace-nowrap"
              >
                {trend}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
