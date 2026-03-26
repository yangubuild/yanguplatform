import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Store, User, BookOpen, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const BUSINESS_TYPES = [
  { key: "shop", label: "Shop", icon: Store },
  { key: "bio_page", label: "Bio page", icon: User },
  { key: "digital_products", label: "Digital products", icon: BookOpen },
  { key: "community", label: "Community", icon: Users },
  { key: "influencer", label: "Influencer", icon: Star },
] as const;

const GOALS = [
  { key: "get_discovered", label: "Get discovered on AI" },
  { key: "sell_more", label: "Sell more" },
  { key: "grow_audience", label: "Grow audience" },
] as const;

const REGIONS = [
  { key: "africa", label: "Africa" },
  { key: "middle_east", label: "Middle East" },
  { key: "global", label: "Global" },
] as const;

interface Props {
  onComplete: (projectId: string) => void;
  onClose: () => void;
}

export function AiVisibilityWizard({ onComplete, onClose }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [goal, setGoal] = useState("get_discovered");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [region, setRegion] = useState("africa");
  const [loading, setLoading] = useState(false);

  const canProceed = () => {
    if (step === 1) return !!businessType;
    if (step === 2) return !!goal;
    if (step === 3) return businessName.trim().length > 0;
    if (step === 4) return !!region;
    return false;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_ai_visibility_projects" as any)
        .insert({
          user_id: user.id,
          business_name: businessName.trim(),
          business_type: businessType,
          goal,
          region,
          website_url: website.trim() || null,
        } as any)
        .select("id")
        .single();

      if (error) throw error;
      onComplete((data as any).id);
    } catch (e: any) {
      toast.error(e.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-foreground font-semibold">AI Visibility Check</span>
          </div>
          <span className="text-xs text-muted-foreground">Step {step} of 4</span>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto px-6 pb-3">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">What are you building?</h2>
              <p className="text-sm text-muted-foreground">Select the type of business you want to track</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BUSINESS_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setBusinessType(key)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                    businessType === key
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">What's your goal?</h2>
              <p className="text-sm text-muted-foreground">We'll tailor your visibility scan</p>
            </div>
            <div className="space-y-3">
              {GOALS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setGoal(key)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                    goal === key
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Business info</h2>
              <p className="text-sm text-muted-foreground">Tell us about your brand</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Business / brand name *</label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                  className="bg-card"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Website or YANGU surface (optional)</label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://your-site.com"
                  className="bg-card"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Target region</h2>
              <p className="text-sm text-muted-foreground">Where do you want to be visible?</p>
            </div>
            <div className="space-y-3">
              {REGIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRegion(key)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                    region === key
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <Button
            variant="ghost"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {step < 4 ? (
            <Button
              variant="accent"
              disabled={!canProceed()}
              onClick={() => setStep(step + 1)}
              className="px-6"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="accent"
              disabled={!canProceed() || loading}
              onClick={handleSubmit}
              className="px-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? "Scanning..." : "Run AI Visibility Check"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
