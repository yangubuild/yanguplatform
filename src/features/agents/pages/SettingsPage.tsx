import { NavLink, Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PageHeader } from "../components/PageHeader";

const TABS = [
  { slug: "general", label: "General" },
  { slug: "security", label: "Security" },
  { slug: "notifications", label: "Notifications" },
  { slug: "api-keys", label: "API keys" },
  { slug: "webhooks", label: "Webhooks" },
  { slug: "data", label: "Data & privacy" },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-6 items-start py-4 border-b border-border last:border-0"><label className="text-sm font-medium pt-2">{label}</label><div>{children}</div></div>;
}

function Shell() {
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Workspace configuration." />
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <NavLink key={t.slug} to={t.slug} className={({ isActive }) => cn("px-3 py-2 text-sm border-b-2 -mb-px", isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.label}</NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}

const General = () => <Card><CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader><CardContent className="pt-0">
  <Row label="Workspace name"><Input defaultValue="Yangu HQ" /></Row>
  <Row label="Timezone"><Input defaultValue="Africa/Nairobi" /></Row>
  <Row label="Default language"><Input defaultValue="English" /></Row>
</CardContent></Card>;

const Security = () => <Card><CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader><CardContent className="pt-0">
  <Row label="Two-factor auth"><Switch defaultChecked /></Row>
  <Row label="Enforce SSO"><Switch /></Row>
  <Row label="Session timeout"><Input defaultValue="30 min" /></Row>
</CardContent></Card>;

const Notifications = () => <Card><CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader><CardContent className="pt-0">
  <Row label="Handover alerts"><Switch defaultChecked /></Row>
  <Row label="Daily summary"><Switch defaultChecked /></Row>
  <Row label="Weekly analytics email"><Switch /></Row>
</CardContent></Card>;

const ApiKeys = () => <Card><CardHeader><CardTitle className="text-base">API keys</CardTitle></CardHeader><CardContent className="pt-0 space-y-3">
  <div className="rounded-lg border border-border p-3 flex items-center justify-between"><div><p className="text-sm font-medium">Production</p><p className="text-xs font-mono text-muted-foreground">sk_live_••••••••••••4f2a</p></div><Button variant="outline" size="sm">Rotate</Button></div>
  <Button variant="outline">Create key</Button>
</CardContent></Card>;

const Webhooks = () => <Card><CardHeader><CardTitle className="text-base">Webhooks</CardTitle></CardHeader><CardContent className="pt-0 space-y-3">
  <Input placeholder="https://yourapp.com/webhooks/yangu" />
  <Button>Add endpoint</Button>
</CardContent></Card>;

const Data = () => <Card><CardHeader><CardTitle className="text-base">Data & privacy</CardTitle></CardHeader><CardContent className="pt-0">
  <Row label="Retention"><Input defaultValue="90 days" /></Row>
  <Row label="PII redaction"><Switch defaultChecked /></Row>
  <Row label="Export data"><Button variant="outline">Request export</Button></Row>
  <Row label="Delete workspace"><Textarea rows={2} placeholder="Type workspace name to confirm" /></Row>
</CardContent></Card>;

export default function SettingsPage() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="general" replace />} />
        <Route path="general" element={<General />} />
        <Route path="security" element={<Security />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="webhooks" element={<Webhooks />} />
        <Route path="data" element={<Data />} />
      </Route>
    </Routes>
  );
}