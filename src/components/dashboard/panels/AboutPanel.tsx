import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Save, Loader2, Info } from "lucide-react";

export function AboutPanel() {
  const { user, profile, refreshProfile } = useAuth();
  const [aboutMe, setAboutMe] = useState("");
  const [aboutBiz, setAboutBiz] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const meta = (profile as any)?.social_links as any;
      setAboutMe(meta?.about_me || "");
      setAboutBiz(meta?.about_business || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const current = ((profile as any)?.social_links || {}) as any;
      const { error } = await supabase
        .from("profiles")
        .update({
          social_links: { ...current, about_me: aboutMe, about_business: aboutBiz },
        } as any)
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("About info saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">About</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "rgba(181,98,42,0.12)", color: "#E67E22" }}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* About You */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-white">About You</label>
            <button
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ color: "#E67E22" }}
              title="AI Generate"
            >
              <Sparkles className="w-3 h-3" /> Generate
            </button>
          </div>
          <textarea
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            placeholder="Tell people about yourself..."
            className="w-full rounded-lg px-3 py-2 text-sm text-white bg-transparent outline-none resize-none min-h-[80px]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* About Business */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-white">About Business</label>
            <button
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ color: "#E67E22" }}
              title="AI Generate"
            >
              <Sparkles className="w-3 h-3" /> Generate
            </button>
          </div>
          <textarea
            value={aboutBiz}
            onChange={(e) => setAboutBiz(e.target.value)}
            placeholder="Describe your business..."
            className="w-full rounded-lg px-3 py-2 text-sm text-white bg-transparent outline-none resize-none min-h-[80px]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* AI Quick Actions */}
        <div>
          <p className="text-xs font-semibold text-white mb-2">AI Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {["Generate Logo", "Mission Statement", "Vision Statement", "Business Summary"].map((label) => (
              <button
                key={label}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                <Sparkles className="w-3 h-3" style={{ color: "#E67E22" }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
