import { Lightbulb } from "lucide-react";

const ideas = [
  "Launch a bathroom accessories business",
  "Launch a estate liquidation business",
  "Launch a nephrology telehealth business",
];

export function BusinessIdeasRow() {
  return (
    <section className="mb-12">
      <h2 className="text-foreground text-xl font-bold mb-5">Business ideas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ideas.map((idea, i) => (
          <button
            key={i}
            className="flex items-center gap-3 px-5 py-4 rounded-xl text-sm text-left transition-colors hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
          >
            <Lightbulb className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
            {idea}
          </button>
        ))}
      </div>
    </section>
  );
}
