import { useState, useEffect } from "react";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Send, Gift } from "lucide-react";

interface Campaign {
  id: string;
  key: string;
  title: string;
  message: string;
  reward_type: string;
  reward_payload: any;
  trigger_type: string;
  trigger_payload: any;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const campaignColumns: AdminColumn<Campaign>[] = [
  { key: "key", header: "Key", render: (c) => c.key },
  { key: "title", header: "Title", render: (c) => c.title },
  {
    key: "reward",
    header: "Reward",
    render: (c) =>
      c.reward_type === "credits"
        ? `${c.reward_payload?.amount} credits`
        : `+${c.reward_payload?.extra} ${c.reward_payload?.asset_type}`,
  },
  { key: "trigger", header: "Trigger", render: (c) => c.trigger_type },
  {
    key: "active",
    header: "Active",
    render: (c) => <AdminStatusBadge status={c.is_active ? "active" : "inactive"} />,
  },
];

export default function ManagePromos() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [formKey, setFormKey] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formRewardType, setFormRewardType] = useState("credits");
  const [formRewardAmount, setFormRewardAmount] = useState(5);
  const [formAssetType, setFormAssetType] = useState("image");
  const [formExtraQuota, setFormExtraQuota] = useState(10);
  const [formExpiresDays, setFormExpiresDays] = useState(30);
  const [formTriggerType, setFormTriggerType] = useState("manual");
  const [formMetric, setFormMetric] = useState("credits_spent_month");
  const [formThreshold, setFormThreshold] = useState(100);
  const [creating, setCreating] = useState(false);

  // Grant form
  const [grantEmail, setGrantEmail] = useState("");
  const [grantKey, setGrantKey] = useState("");
  const [granting, setGranting] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promo_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCampaigns(data as Campaign[]);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!formKey || !formTitle || !formMessage) {
      toast.error("Key, title, and message are required");
      return;
    }
    setCreating(true);
    const reward_payload =
      formRewardType === "credits"
        ? { amount: formRewardAmount }
        : { asset_type: formAssetType, extra: formExtraQuota, expires_in_days: formExpiresDays };
    const trigger_payload =
      formTriggerType === "milestone"
        ? { metric: formMetric, threshold: formThreshold }
        : {};

    const { error } = await supabase.from("promo_campaigns").insert({
      key: formKey,
      title: formTitle,
      message: formMessage,
      reward_type: formRewardType,
      reward_payload,
      trigger_type: formTriggerType,
      trigger_payload,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Campaign created");
      setShowCreate(false);
      setFormKey("");
      setFormTitle("");
      setFormMessage("");
      fetchCampaigns();
    }
    setCreating(false);
  };

  const toggleActive = async (c: Campaign) => {
    const { error } = await supabase
      .from("promo_campaigns")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (error) toast.error(error.message);
    else fetchCampaigns();
  };

  const handleGrant = async () => {
    if (!grantEmail || !grantKey) {
      toast.error("Email and campaign key are required");
      return;
    }
    setGranting(true);
    const campaign = campaigns.find((c) => c.key === grantKey);
    if (campaign?.reward_type === "credits") {
      const { error: gErr } = await supabase.rpc("admin_grant_credits_by_email", {
        p_email: grantEmail,
        p_amount: campaign.reward_payload?.amount || 0,
        p_note: `Promo: ${campaign.title}`,
      });
      if (gErr) toast.error(gErr.message);
      else toast.success(`Granted ${campaign.reward_payload?.amount} credits to ${grantEmail}`);
    } else {
      toast.error("Manual grant for quota promos requires user ID lookup — coming soon");
    }
    setGranting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AdminPageHeader
          title="Promos & Rewards"
          description="Create campaigns, set rewards, grant to users"
        />
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-1" /> New Campaign
        </Button>
      </div>

      {showCreate && (
        <AdminGlassCard>
          <h3 className="font-semibold mb-4">New Campaign</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Key (unique slug)</Label>
              <Input value={formKey} onChange={(e) => setFormKey(e.target.value)} placeholder="welcome-bonus" />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Welcome Bonus!" />
            </div>
            <div className="sm:col-span-2">
              <Label>Message</Label>
              <Textarea value={formMessage} onChange={(e) => setFormMessage(e.target.value)} placeholder="Claim your reward…" />
            </div>
            <div>
              <Label>Reward Type</Label>
              <Select value={formRewardType} onValueChange={setFormRewardType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credits">Credits</SelectItem>
                  <SelectItem value="quota">Quota Add-on</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formRewardType === "credits" ? (
              <div>
                <Label>Credit Amount</Label>
                <Input type="number" value={formRewardAmount} onChange={(e) => setFormRewardAmount(Number(e.target.value))} />
              </div>
            ) : (
              <>
                <div>
                  <Label>Asset Type</Label>
                  <Select value={formAssetType} onValueChange={setFormAssetType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="poster">Poster</SelectItem>
                      <SelectItem value="influencer">Influencer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Extra Quota</Label>
                  <Input type="number" value={formExtraQuota} onChange={(e) => setFormExtraQuota(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Expires in (days)</Label>
                  <Input type="number" value={formExpiresDays} onChange={(e) => setFormExpiresDays(Number(e.target.value))} />
                </div>
              </>
            )}
            <div>
              <Label>Trigger Type</Label>
              <Select value={formTriggerType} onValueChange={setFormTriggerType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formTriggerType === "milestone" && (
              <>
                <div>
                  <Label>Metric</Label>
                  <Input value={formMetric} onChange={(e) => setFormMetric(e.target.value)} />
                </div>
                <div>
                  <Label>Threshold</Label>
                  <Input type="number" value={formThreshold} onChange={(e) => setFormThreshold(Number(e.target.value))} />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "Create Campaign"}
            </Button>
          </div>
        </AdminGlassCard>
      )}

      <AdminGlassCard>
        <h3 className="font-semibold mb-3">Campaigns</h3>
        <AdminTable<Campaign>
          columns={[
            ...campaignColumns,
            {
              key: "toggle",
              header: "",
              render: (c) => <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />,
            },
          ]}
          data={campaigns}
          loading={loading}
          rowKey={(c) => c.id}
          emptyMessage="No campaigns yet"
        />
      </AdminGlassCard>

      <AdminGlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Send className="h-4 w-4" /> Grant Promo by Email
        </h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label>User Email</Label>
            <Input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div className="w-48">
            <Label>Campaign</Label>
            <Select value={grantKey} onValueChange={setGrantKey}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.key}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGrant} disabled={granting}>
            {granting ? "Granting…" : "Grant"}
          </Button>
        </div>
      </AdminGlassCard>
    </div>
  );
}
