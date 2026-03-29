import { useState } from "react";
import { X, ArrowRight, Globe, CheckSquare, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocialOnboarding } from "@/hooks/useSocialOnboarding";

type Step = "workspace" | "content_plan" | "connect_socials" | "instagram_help";

const GOALS = [
  "Get more leads and inquiries",
  "Build brand awareness",
  "Drive traffic to my website",
  "Stay consistent with posting",
  "Save time creating content",
];

const SOCIAL_PROVIDERS = [
  { name: "Facebook Page", icon: "📘" },
  { name: "Instagram", icon: "📸" },
  { name: "Instagram Story", icon: "🎬" },
  { name: "X", icon: "✖️" },
  { name: "LinkedIn Company Page", icon: "🔗" },
  { name: "LinkedIn Personal Profile", icon: "👤" },
  { name: "TikTok", icon: "🎵" },
];

interface Props {
  onComplete: () => void;
}

export function SocialOnboardingFlow({ onComplete }: Props) {
  const { completeOnboarding } = useSocialOnboarding();
  const [step, setStep] = useState<Step>("workspace");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [showDescribe, setShowDescribe] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [postFrequency, setPostFrequency] = useState("");
  const [showInstaHelp, setShowInstaHelp] = useState(false);

  const handleWorkspaceNext = () => {
    if (!showDescribe) {
      if (!websiteUrl.trim()) { setUrlError("Please enter a valid website link"); return; }
      try { new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`); } catch { setUrlError("Please enter a valid website link"); return; }
    } else if (!description.trim()) return;
    setUrlError("");
    setStep("content_plan");
  };

  const handleContentPlanNext = () => setStep("connect_socials");

  const handleConnectSocial = (name: string) => {
    if (name === "Instagram" || name === "Instagram Story") {
      setShowInstaHelp(true);
    }
    // Outstand OAuth would be triggered here in phase 2
  };

  const handleFinish = () => {
    const steps = ["business"];
    completeOnboarding(steps);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* STEP: Workspace */}
        {step === "workspace" && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-foreground">Create a Workspace</h2>
              <button onClick={handleFinish} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Tell us about your business and we'll create a workspace and posts that match your brand.</p>

            {!showDescribe ? (
              <>
                <label className="text-sm font-semibold text-foreground block mb-2">Business Website</label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => { setWebsiteUrl(e.target.value); setUrlError(""); }}
                  placeholder="https://yourbusiness.com"
                  className={urlError ? "border-red-500" : ""}
                />
                {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  No website?{" "}
                  <button onClick={() => setShowDescribe(true)} className="text-accent hover:underline font-medium">
                    Describe your business instead
                  </button>
                </p>
              </>
            ) : (
              <>
                <label className="text-sm font-semibold text-foreground block mb-2">Describe your business</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what your business does..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px] focus:ring-1 focus:ring-accent"
                />
                <button onClick={() => setShowDescribe(false)} className="text-xs text-accent hover:underline mt-1">
                  Enter website URL instead
                </button>
              </>
            )}

            <div className="flex items-center gap-3 mt-8">
              <Button variant="outline" onClick={handleFinish}>Cancel</Button>
              <Button variant="accent" className="flex-1" onClick={handleWorkspaceNext}>
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Content Plan */}
        {step === "content_plan" && (
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-1">Let's set up your content plan</h2>
            <p className="text-sm text-muted-foreground mb-6">We'll use this to create posts that match your goals and schedule.</p>

            <h3 className="text-sm font-semibold text-foreground mb-3">What are your main goals for posting?</h3>
            <div className="space-y-2 mb-6">
              {GOALS.map((goal) => (
                <label key={goal} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGoals.includes(goal)}
                    onChange={() => setSelectedGoals((prev) => prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal])}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">{goal}</span>
                </label>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-2">How often do you want to post?</h3>
            <div className="flex items-center gap-2">
              <Input value={postFrequency} onChange={(e) => setPostFrequency(e.target.value)} placeholder="3-5 recommended" className="w-40" />
              <span className="text-sm text-muted-foreground">times per week</span>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <Button variant="outline" onClick={handleFinish} className="flex-1">Skip</Button>
              <Button variant="accent" className="flex-1" onClick={handleContentPlanNext}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Connect Socials */}
        {step === "connect_socials" && (
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-1">Connect your socials</h2>
            <p className="text-sm text-muted-foreground mb-6">We'll pull your analytics and optimize your profile to create better content for you. We will never publish anything without your explicit permission.</p>

            <div className="rounded-xl border border-border divide-y divide-border">
              {SOCIAL_PROVIDERS.map((p) => (
                <div key={p.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleConnectSocial(p.name)}>
                    Connect
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-6" onClick={handleFinish}>
              Skip
            </Button>
          </div>
        )}

        {/* Instagram Help Modal Overlay */}
        {showInstaHelp && (
          <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Connect your Instagram account</h3>
                <button onClick={() => setShowInstaHelp(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                We recommend you to click <strong className="text-foreground">Opt into all current and future</strong> (as shown in the image below) when prompted during the auth flow. (Don't worry, you'll be able to choose later which page you want to post to)
              </p>
              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-accent bg-accent/5">
                  <input type="radio" name="insta-opt" defaultChecked className="mt-1" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Opt in to all current and future Businesses</div>
                    <div className="text-xs text-muted-foreground">This will give access to your current businesses, in addition to any business you create in the future.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-border">
                  <input type="radio" name="insta-opt" className="mt-1" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Opt in to current businesses only</div>
                    <div className="text-xs text-muted-foreground">This will only give access to the businesses you select.</div>
                  </div>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setShowInstaHelp(false)}>Cancel</Button>
                <Button variant="accent" className="flex-1" onClick={() => setShowInstaHelp(false)}>Continue</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
