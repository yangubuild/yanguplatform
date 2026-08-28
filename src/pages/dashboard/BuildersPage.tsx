// BUILDERS — the single AI-first entry point for building business surfaces.
// It does NOT rebuild any builder engine: it classifies the user's natural
// request and hands off to the EXISTING engines (esite / eshop / estore /
// emenu) through the existing Speak-to-Build flow.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, ArrowRight } from "lucide-react";
import { YanguGlowBall } from "@/components/brand/YanguGlowBall";
import { Button } from "@/components/ui/button";

type EngineKey = "esite" | "eshop" | "estore" | "emenu";

const ENGINE_LABEL: Record<EngineKey, string> = {
  esite: "Website / landing page",
  eshop: "Online shop",
  estore: "Store & catalogue",
  emenu: "Digital menu & ordering",
};

/** Lightweight intent router → existing builder engine. */
export function routeBuildIntent(text: string): EngineKey | null {
  const t = text.toLowerCase();
  if (!t.trim()) return null;
  if (/(menu|restaurant|cafe|coffee|food|takeaway|dine|kitchen|bakery)/.test(t)) return "emenu";
  if (/(shop|sell|ecommerce|e-commerce|products|cosmetics|clothing|store online|checkout|cart)/.test(t))
    return "eshop";
  if (/(catalogue|catalog|inventory|storefront|retail|wholesale|supermarket)/.test(t)) return "estore";
  if (/(website|site|landing|page|portfolio|company|agency|booking|book|services|property|construction|clinic)/.test(t))
    return "esite";
  return null;
}

const EXAMPLES = [
  "Build a website for my construction company.",
  "Create an online store for my cosmetics business.",
  "Create a digital menu with WhatsApp ordering.",
  "Build a page where customers can book my services.",
];

export default function BuildersPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [needsChoice, setNeedsChoice] = useState(false);

  const detected = useMemo(() => routeBuildIntent(prompt), [prompt]);

  const start = (engine: EngineKey) => {
    navigate(`/speak/seller/${engine}?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const submit = () => {
    if (!prompt.trim()) return;
    if (detected) start(detected);
    else setNeedsChoice(true);
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <YanguGlowBall state="idle" size={104} />
        <h1 className="mt-6 text-2xl font-semibold text-foreground sm:text-3xl">
          What do you want to build?
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Describe your business in your own words. Yangu picks the right engine and builds it for you.
        </p>
      </div>

      {/* Yangu AI input — dark interior, animated gradient border only */}
      <div className="yangu-border-flow mt-8 rounded-2xl bg-[#070A08] p-3 sm:p-4">
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setNeedsChoice(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={3}
          placeholder="e.g. Build a website for my restaurant with online ordering"
          aria-label="Describe what you want to build"
          className="w-full resize-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => detected ? start(detected) : setNeedsChoice(true)}
            className="yangu-cta-secondary inline-flex h-10 items-center gap-2 px-3 text-sm"
            aria-label="Speak your request"
          >
            <Mic className="h-4 w-4" /> Speak
          </button>
          <Button onClick={submit} disabled={!prompt.trim()}>
            Build it <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {needsChoice && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-foreground">
            I need one detail — what kind of surface should I build?
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(Object.keys(ENGINE_LABEL) as EngineKey[]).map((key) => (
              <button
                key={key}
                onClick={() => start(key)}
                className="yangu-cta-secondary px-4 py-3 text-left text-sm"
              >
                {ENGINE_LABEL[key]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Try</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setPrompt(ex);
                setNeedsChoice(false);
              }}
              className="yangu-cta-secondary px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
