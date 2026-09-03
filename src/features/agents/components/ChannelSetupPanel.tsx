import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Globe, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
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

export function ChannelSetupPanel() {
  const { data: agents = [] } = useAgents();
  const [agentId, setAgentId] = useState("");
  const { data: channels = [], isLoading, refetch } = useAgentChannels(agentId || undefined);
  const connectWebchat = useConnectWebchat();
  const connectWhatsapp = useConnectWhatsapp();
  const disconnect = useDisconnectChannel();
  const [origins, setOrigins] = useState("*");
  const [greeting, setGreeting] = useState("Hi! How can we help you today?");
  const [launcherLabel, setLauncherLabel] = useState("Chat with us");
  const [accentColor, setAccentColor] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const selectedAgent = agents.find((agent) => agent.id === agentId);
  const webchat = channels.find((channel) => channel.channel === "webchat");
  const whatsapp = channels.find((channel) => channel.channel === "whatsapp");
  const embedSnippet = useMemo(() => agentId && webchat?.id
    ? `<script src="${window.location.origin}/yangu-webchat.js" data-channel-id="${webchat.id}" data-endpoint="${webchatEndpoint()}" async></script>`
    : "", [agentId, webchat?.id]);

  const connectWeb = () => {
    if (!agentId) return;
    connectWebchat.mutate({
      agentId,
      allowedOrigins: origins.split(/[,\n]/).map((value) => value.trim()).filter(Boolean),
      greeting, launcherLabel, accentColor,
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
          <h2 className="text-lg font-semibold">Channel connections</h2>
          <p className="text-sm text-muted-foreground">Connect the same AI employee to web chat and WhatsApp.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={!agentId || isLoading}>
          <RefreshCw className="mr-1.5 h-4 w-4" />Refresh
        </Button>
      </div>
      <Select value={agentId} onValueChange={setAgentId}>
        <SelectTrigger><SelectValue placeholder="Choose an agent" /></SelectTrigger>
        <SelectContent>
          {agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {!agentId && <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Choose an agent to manage its channels.</p>}
      {agentId && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><Globe className="h-4 w-4" />Web chat</span>
                <ChannelStatus status={webchat?.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Embed a lightweight chat launcher on any approved website. Replies and human takeover use the unified Inbox.</p>
              <div className="space-y-1.5"><Label htmlFor="allowed-origins">Allowed website origins</Label><Textarea id="allowed-origins" rows={2} value={origins} onChange={(event) => setOrigins(event.target.value)} placeholder="https://example.com" /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="launcher-label">Launcher label</Label><Input id="launcher-label" value={launcherLabel} onChange={(event) => setLauncherLabel(event.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="accent-color">Accent color</Label><Input id="accent-color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} placeholder="Optional" /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="webchat-greeting">Greeting</Label><Input id="webchat-greeting" value={greeting} onChange={(event) => setGreeting(event.target.value)} /></div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={connectWebchat.isPending ? undefined : connectWeb} disabled={connectWebchat.isPending || !selectedAgent}>
                  {connectWebchat.isPending ? "Connecting…" : webchat?.enabled ? "Save web chat" : "Connect web chat"}
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
        </div>
      )}
      {agentId && isLoading && <p className="text-xs text-muted-foreground">Loading channel status…</p>}
    </section>
  );
}

function ChannelStatus({ status }: { status?: string }) {
  if (status === "connected") return <Badge><CheckCircle2 className="mr-1 h-3 w-3" />Connected</Badge>;
  if (status === "error") return <Badge variant="destructive">Needs attention</Badge>;
  return <Badge variant="outline">Not connected</Badge>;
}
