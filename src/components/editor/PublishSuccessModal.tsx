import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Sparkles, ArrowRight } from "lucide-react";
import adaIcon from "@/assets/ada-icon.png";

interface PublishSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surfaceTitle: string;
  publishedUrl: string | null;
  surfaceId: string;
}

/* Tiny spark particle for celebration */
function SparkParticle({ index, reduceMotion }: { index: number; reduceMotion: boolean }) {
  const angle = (index / 12) * 360;
  const delay = index * 0.08;
  const distance = 60 + Math.random() * 40;
  const size = 4 + Math.random() * 4;
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(43, 80%, 55%)",
    "hsl(160, 60%, 50%)",
  ];
  const color = colors[index % colors.length];

  if (reduceMotion) {
    // Static sparks only
    const x = Math.cos((angle * Math.PI) / 180) * 40;
    const y = Math.sin((angle * Math.PI) / 180) * 40;
    return (
      <span
        className="absolute rounded-full opacity-60"
        style={{
          width: size,
          height: size,
          background: color,
          left: `calc(50% + ${x}px)`,
          top: `calc(40% + ${y}px)`,
        }}
      />
    );
  }

  return (
    <span
      className="absolute rounded-full animate-spark"
      style={{
        width: size,
        height: size,
        background: color,
        left: "50%",
        top: "40%",
        "--spark-angle": `${angle}deg`,
        "--spark-distance": `${distance}px`,
        animationDelay: `${delay}s`,
      } as React.CSSProperties}
    />
  );
}

export function PublishSuccessModal({
  open,
  onOpenChange,
  surfaceTitle,
  publishedUrl,
  surfaceId,
}: PublishSuccessModalProps) {
  const navigate = useNavigate();
  const [showSparks, setShowSparks] = useState(false);
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ).current;

  useEffect(() => {
    if (open) {
      setShowSparks(true);
      if (!reduceMotion) {
        const timer = setTimeout(() => setShowSparks(false), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowSparks(false);
    }
  }, [open, reduceMotion]);

  const handleAdaNavigate = (intent?: string) => {
    const params = new URLSearchParams();
    params.set("surfaceId", surfaceId);
    if (publishedUrl) params.set("publishedUrl", publishedUrl);
    if (intent) params.set("intent", intent);
    onOpenChange(false);
    navigate(`/ada-ai?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-border bg-background">
        {/* Header row */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          {/* Thumbnail placeholder */}
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
            <span className="text-2xl">🌐</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{surfaceTitle}</h3>
            <p className="text-sm text-muted-foreground">
              You're officially discoverable on yangu — your audience can now find you.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success hint */}
        <div className="px-4 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Your business is now live on yangu
          </span>
        </div>

        {/* Celebration body */}
        <div className="relative flex flex-col items-center text-center px-6 pt-6 pb-4">
          {/* Spark particles */}
          {showSparks && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <SparkParticle key={i} index={i} reduceMotion={reduceMotion} />
              ))}
            </div>
          )}

          {/* Celebration emoji */}
          <div className="text-5xl mb-4">🎉</div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            Congrats on your Publish! 🚀
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Every big brand starts with one launch. This is yours.
          </p>

          {/* Quote */}
          <blockquote className="text-sm italic text-muted-foreground mb-6">
            "Everything created was once imagined."
            <span className="block mt-1 not-italic text-xs">— William Blake</span>
          </blockquote>

          {/* ADA AI Nudge Card */}
          <div className="w-full rounded-xl border border-border bg-muted/50 p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <img src={adaIcon} alt="ADA AI" className="w-5 h-5 rounded-full" />
              <span className="text-xs font-semibold text-foreground">ADA AI</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Want me to help you grow this launch?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1"
                onClick={() => handleAdaNavigate()}
              >
                Get growth plan
                <ArrowRight className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1"
                onClick={() => handleAdaNavigate("promo")}
              >
                Create promo content
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2 w-full">
            {publishedUrl && (
              <Button
                className="w-full gap-2"
                onClick={() => window.open(publishedUrl, "_blank")}
              >
                Visit Live Surface
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <button
              onClick={() => {
                onOpenChange(false);
                navigate("/dashboard");
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
