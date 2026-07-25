import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/PageHeader";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-6 items-start py-4 border-b border-border last:border-0"><label className="text-sm font-medium pt-2">{label}</label><div>{children}</div></div>;
}

export default function AccountPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Account" description="Your personal profile." />
      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <Row label="Avatar"><div className="flex items-center gap-3"><div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-sm font-medium">YU</div><Button variant="outline" size="sm">Change</Button></div></Row>
          <Row label="Full name"><Input defaultValue="You" /></Row>
          <Row label="Email"><Input defaultValue="you@yangu.io" /></Row>
          <Row label="Phone"><Input defaultValue="+254 700 000 000" /></Row>
          <Row label="Timezone"><Input defaultValue="Africa/Nairobi" /></Row>
          <Row label="Language">
            <Select defaultValue="en"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="sw">Swahili</SelectItem><SelectItem value="fr">French</SelectItem></SelectContent></Select>
          </Row>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
        <CardContent className="pt-0 flex flex-wrap gap-2">
          <Button variant="outline">Change password</Button>
          <Button variant="outline">Sign out of all sessions</Button>
        </CardContent>
      </Card>
    </div>
  );
}