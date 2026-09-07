import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Globe, Mail, MessageCircle, MessagesSquare, Phone, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAgents } from "../data/hooks";
import { useAgentChannels, useConnectWebchat, useConnectWhatsapp, useDisconnectChannel, webchatEndpoint } from "../data/channelHooks";

/**
 * Channel connections for one agent.
 * Pass `agentId` to lock the panel to a single agent (Agent Command Center);
 * omit it to render the agent picker (Integrations page).
 */
export function ChannelSetupPanel({ agentId: fixedAgentId }: { agentId?: string } = {}) {
  const { data: agents = [] } = useAgents();
  const [pickedAgentId, setPickedAgentId] = useState("");
  const agentId = fixedAgentId ?? pickedAgentId;
  const { data: channels = [], isLoading, refetch } = useAgentChannels(agentId || undefined);
  const connectWebchat = useConnectWebchat();
  const connectWhatsapp = useConnectWhatsapp();
  const disconnect = useDisconnectChannel();

  const [origins, setOrigins] = useState("*");
  const [greeting, setGreeting] = useState("Hi! How can we help you today?");
  const [launcherLabel, setLauncherLabel] = useState("Chat with us");
  const [accentColor, setAccentColor] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [launcherPosition, setLauncherPosition] = useState<"right" | "left">("right");
  const [offlineMessage, setOfflineMessage] = useState("A team member will follow up shortly.");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const selectedAgent = agents.find((agent) => agent.id === agentId);
  const webchat = channels.find((channel) => channel.channel === "webchat");
  const whatsapp = channels.find((channel) => channel.channel === "whatsapp");
  const voice = channels.find((channel) => channel.channel === "voice");

  // Load saved web chat settings into the form once they arrive.
  useEffect(() => {
    const config = webchat?.config;
    if (!config) return;
    setOrigins(Array.isArray(config.allowed_origins) ? config.allowed_origins.join("\n") : "*");
    if (config.greeting) setGreeting(config.greeting);
    if (config.launcher_label) setLauncherLabel(config.launcher_label);
    setAccentColor(config.accent_color ?? "");
    setDisplayName(config.display_name ?? "");
    setAvatarUrl(config.avatar_url ?? "");
    setLauncherPosition(config.launcher_position === "left" ? "left" : "right");
    if (config.offline_message) setOfflineMessage(config.offline_message);
  }, [webchat?.id, webchat?.config]);

  const embedSnippet = useMemo(() => agentId && webchat?.id
    ? `<script src="${window.location.origin}/yangu-webchat.js" data-channel-id="${webchat.id}" data-endpoint="${webchatEndpoint()}" async></script>`
    : "", [agentId, webchat?.id]);

  const saveWebchat = () => {
    if (!agentId) return;
    connectWebchat.mutate({
      agentId,
      allowedOrigins: origins.split(/[,\n]/).map((value) => value.trim()).filter(Boolean),
      greeting, launcherLabel, accentColor,
      displayName, avatarUrl, launcherPosition, offlineMessage,
    });
  };

  const connectWa = () => {
    if (!agentId || !phoneNumberId || !accessToken) return;
    connectWhatsapp.mutate({ agentId, phoneNumberId, wabaId, accessToken }, {
      onSuccess: () => { setAccessToken(""); setPhoneNumberId(""); setWabaId(""); },
    });
  };

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedSnippet);
    toast.success("Embed code copied");
  };

  return (
    <section className="space-y-4" aria-label="Channel connections">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Channels</h2>
          <p className="text-sm text-muted-foreground">
            The same AI employee — same instructions, knowledge and customer memory — across every channel you switch on.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={!agentId || isLoading}>
          <RefreshCw className="mr-1.5 h-4 w-4" />Refresh
        </Button>
      </div>

      {!fixedAgentId && (
        <Select value={pickedAgentId} onValueChange={setPickedAgentId}>
          <SelectTrigger><SelectValue placeholder="Choose an agent" /></SelectTrigger>
          <SelectContent>
            {agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {!agentId && <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Choose an agent to manage its channels.</p>}
      {agentId && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Voice — configured on the Phone number tab; status only here. */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2"><Phone className="h-4 w-4" />Voice</span>
                  <ChannelStatus status={voice?.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Phone calls are set up on the Phone number tab of this agent. Call results, transcripts and customer memory land in the same place as every other channel.
                </p>
                {selectedAgent?.phoneNumber && <p className="text-xs">Number: {selectedAgent.phoneNumber}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />WhatsApp</span>
                  <ChannelStatus status={whatsapp?.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Use a WhatsApp Cloud API phone number. The access token is verified and stored server-side; it is never returned to the browser.</p>
                <div className="space-y-1.5"><Label htmlFor="phone-number-id">Phone number ID</Label><Input id="phone-number-id" value={phoneNumberId} onChange={(event) => setPhoneNumberId(event.target.value)} placeholder="From Meta Business" /></div>
                <div className="space-y-1.5"><Label htmlFor="waba-id">Business account ID <span className="text-muted-foreground">(optional)</span></Label><Input id="waba-id" value={wabaId} onChange={(event) => setWabaId(event.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="access-token">Permanent access token</Label><Input id="access-token" type="password" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Paste once to connect" autoComplete="off" /></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />Credentials are handled only by the backend.</div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={connectWa} disabled={connectWhatsapp.isPending || !phoneNumberId || !accessToken}>{connectWhatsapp.isPending ? "Verifying…" : whatsapp?.enabled ? "Reconnect WhatsApp" : "Connect WhatsApp"}</Button>
                  {whatsapp?.enabled && <Button variant="outline" onClick={() => disconnect.mutate({ agentId, channel: "whatsapp" })}>Disconnect</Button>}
                </div>
                {whatsapp?.config?.display_phone_number && <p className="text-xs text-muted-foreground">Connected number: {whatsapp.config.display_phone_number}{whatsapp.config.verified_name ? ` · ${whatsapp.config.verified_name}` : ""}</p>}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2"><Globe className="h-4 w-4" />Web chat</span>
                  <ChannelStatus status={webchat?.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Embed a lightweight chat launcher on any approved website. Replies and human takeover use the unified Inbox.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="allowed-origins">Allowed website addresses</Label><Textarea id="allowed-origins" rows={2} value={origins} onChange={(event) => setOrigins(event.target.value)} placeholder="https://example.com" /></div>
                  <div className="space-y-1.5"><Label htmlFor="webchat-greeting">Welcome message</Label><Textarea id="webchat-greeting" rows={2} value={greeting} onChange={(event) => setGreeting(event.target.value)} /></div>
                  <div className="space-y-1.5"><Label htmlFor="display-name">Chat display name</Label><Input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={selectedAgent?.name ?? "Assistant"} /></div>
                  <div className="space-y-1.5"><Label htmlFor="avatar-url">Avatar image address</Label><Input id="avatar-url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="Optional" /></div>
                  <div className="space-y-1.5"><Label htmlFor="launcher-label">Launcher label</Label><Input id="launcher-label" value={launcherLabel} onChange={(event) => setLauncherLabel(event.target.value)} /></div>
                  <div className="space-y-1.5">
                    <Label htmlFor="launcher-position">Launcher position</Label>
                    <Select value={launcherPosition} onValueChange={(value) => setLauncherPosition(value === "left" ? "left" : "right")}>
                      <SelectTrigger id="launcher-position"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">Bottom right</SelectItem>
                        <SelectItem value="left">Bottom left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="accent-color">Accent color</Label><Input id="accent-color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} placeholder="Optional, e.g. #d96828" /></div>
                  <div className="space-y-1.5"><Label htmlFor="offline-message">Handoff message</Label><Input id="offline-message" value={offlineMessage} onChange={(event) => setOfflineMessage(event.target.value)} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveWebchat} disabled={connectWebchat.isPending || !selectedAgent}>
                    {connectWebchat.isPending ? "Saving…" : webchat?.enabled ? "Save web chat" : "Connect web chat"}
                  </Button>
                  {webchat?.enabled && <Button variant="outline" onClick={() => disconnect.mutate({ agentId, channel: "webchat" })}>Disconnect</Button>}
                </div>
                {embedSnippet && (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">Embed code</span><Button size="sm" variant="outline" onClick={copyEmbed}><Copy className="mr-1.5 h-3.5 w-3.5" />Copy</Button></div>
                    <code className="block break-all text-[11px] text-muted-foreground">{embedSnippet}</code>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "SMS", icon: Smartphone },
              { label: "Email", icon: Mail },
              { label: "Messenger", icon: MessagesSquare },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span>
                <Badge variant="outline">Coming soon</Badge>
              </div>
            ))}
          </div>
        </>
      )}
      {agentId && isLoading && <p className="text-xs text-muted-foreground">Loading channel status…</p>}
    </section>
  );
}

function ChannelStatus({ status }: { status?: string }) {
  if (status === "connected") return <Badge><CheckCircle2 className="mr-1 h-3 w-3" />Connected</Badge>;
  if (status === "error") return <Badge variant="destructive">Needs attention</Badge>;
  if (status === "disabled") return <Badge variant="outline">Turned off</Badge>;
  return <Badge variant="outline">Setup required</Badge>;
}
