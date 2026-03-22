import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  DollarSign,
  MapPin,
  Grid3X3,
  Users,
} from "lucide-react";

// Social icon placeholders
const socialIcons = [
  { name: "X", color: "#fff" },
  { name: "IG", color: "#E4405F" },
  { name: "DC", color: "#5865F2" },
  { name: "TG", color: "#26A5E4" },
  { name: "YT", color: "#FF0000" },
  { name: "TK", color: "#fff" },
];

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [name, setName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState("");
  const [showTotalEarned, setShowTotalEarned] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showOwnedApps, setShowOwnedApps] = useState(true);
  const [showJoinedApps, setShowJoinedApps] = useState(true);

  const hasChanges = true; // simplified for now

  const handleSave = () => {
    toast({ title: "Profile saved", description: "Your changes have been applied." });
    navigate("/dashboard/profile");
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 min-h-screen pb-20" style={{ background: "#08120D" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Edit profile</h1>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity"
          style={{
            background: hasChanges ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
            color: hasChanges ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        >
          Save changes
        </button>
      </div>

      <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* Banner + Avatar */}
      <div className="relative rounded-2xl overflow-hidden mb-8" style={{ background: "#2a3038", height: 160 }}>
        <div className="absolute -bottom-10 left-4">
          <div
            className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-xl font-bold"
            style={{ borderColor: "#1a2025", background: "#2a3038", color: "rgba(255,255,255,0.6)" }}
          >
            {(name || "U").charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-white block mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
            style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <p className="text-right text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{name.length}/100</p>
        </div>

        {/* Username */}
        <div>
          <label className="text-sm font-medium text-white block mb-1.5">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 42))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
            style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <p className="text-right text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{username.length}/42</p>
        </div>

        {/* Bio */}
        <div>
          <label className="text-sm font-medium text-white block mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            placeholder="No bio"
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
            style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <p className="text-right text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{bio.length}/200</p>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px my-8" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* More details */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-white mb-1">More details</h2>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
          Choose what appears on your profile and other explore surfaces.
        </p>

        <div className="space-y-4">
          <ToggleRow icon={DollarSign} label="Total earned" checked={showTotalEarned} onChange={setShowTotalEarned} />
          <ToggleRow icon={MapPin} label="Location" checked={showLocation} onChange={setShowLocation} />
          <ToggleRow icon={Grid3X3} label="Owned yangu apps" checked={showOwnedApps} onChange={setShowOwnedApps} />
          <ToggleRow icon={Users} label="Joined yangu apps" checked={showJoinedApps} onChange={setShowJoinedApps} />
        </div>
      </div>

      {/* Separator */}
      <div className="h-px mb-8" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* Social links */}
      <div>
        <h2 className="text-base font-bold text-white mb-1">Social links</h2>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
          Connect your other accounts to let people know where to find you.
        </p>

        <div className="flex items-center gap-2">
          <span className="text-sm mr-1" style={{ color: "rgba(255,255,255,0.5)" }}>Add:</span>
          {socialIcons.map((s) => (
            <button
              key={s.name}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: s.color }}
              onClick={() => toast({ title: `${s.name} link — coming soon` })}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: any;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "#232a30" }}
        >
          <Icon className="w-5 h-5" style={{ color: "rgba(255,255,255,0.6)" }} />
        </div>
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
