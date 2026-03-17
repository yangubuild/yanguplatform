import { T } from "@/lib/typography";
import { Button } from "@/components/ui/button";

interface Props {
  slot: "middle" | "lower";
}

export function LandingTestDynamicBanner({ slot }: Props) {
  const isMiddle = slot === "middle";

  return (
    <section className="mb-12">
      <div
        className="rounded-2xl overflow-hidden p-10 md:p-14 flex flex-col md:flex-row items-center gap-8"
        style={{
          background: isMiddle
            ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: 260,
        }}
      >
        <div className="flex-1">
          <h2 className={`${T.header} text-white mb-3`}>
            {isMiddle ? "yangu for enterprise" : "Meet yangu Treasury"}
          </h2>
          <p className={`${T.subheader} mb-6`} style={{ color: 'rgba(255,255,255,0.45)' }}>
            {isMiddle
              ? "yangu isn't just for the best solo entrepreneurs, it's also effective for enterprises."
              : "Earn up to 6% yield on your cash."
            }
          </p>
          <button
            className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: isMiddle ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)' }}
          >
            {isMiddle ? "Learn more" : "Get started"}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px] h-[200px] rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Placeholder for dynamic dashboard preview image — managed from management panel */}
            <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Dashboard preview
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
