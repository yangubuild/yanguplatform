import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Upload, Loader2, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const SPEND_FIELDS = [
  { key: "tv", label: "TV Commercials" },
  { key: "radio", label: "Radio Spots" },
  { key: "newspaper", label: "Newspaper" },
  { key: "digital_ads", label: "Digital Ads" },
  { key: "podcast", label: "Podcast Sponsorships" },
  { key: "billboards", label: "Billboards" },
] as const;

type SpendData = Record<string, number>;

export default function AgencyMonthlyReport() {
  const { data: ctx } = useAgencyContext();
  const { user } = useAuth();
  const qc = useQueryClient();
  const agencyId = ctx?.agency_id;

  const now = new Date();
  const [reportMonth, setReportMonth] = useState(format(now, "yyyy-MM"));
  const [spend, setSpend] = useState<SpendData>({});
  const [hubHours, setHubHours] = useState(0);
  const [payoutNotes, setPayoutNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Past reports
  const { data: pastReports, isLoading } = useQuery({
    queryKey: ["agency-monthly-reports", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_reports")
        .select("id, report_date, data, status, submitted_at")
        .eq("agency_id", agencyId!)
        .eq("report_type", "monthly")
        .order("report_date", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });

  const handleSubmit = async () => {
    if (!agencyId || !user) return;
    setSubmitting(true);
    try {
      const reportData = {
        marketing_spend: spend,
        marketing_spend_total: Object.values(spend).reduce((s, v) => s + (v || 0), 0),
        hub_hours: hubHours,
        payout_notes: payoutNotes,
      };

      const { error } = await supabase.from("agency_reports").insert({
        agency_id: agencyId,
        report_type: "monthly",
        report_date: `${reportMonth}-01`,
        data: reportData,
        created_by: user.id,
        status: "submitted",
      });
      if (error) throw error;

      toast.success("Monthly report submitted to Yangu Management");
      qc.invalidateQueries({ queryKey: ["agency-monthly-reports"] });
      setSpend({});
      setHubHours(0);
      setPayoutNotes("");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Monthly Financial Report</h1>
        <p className="text-sm text-muted-foreground">Submit monthly marketing spend and hub usage to Yangu Management</p>
      </div>

      {/* Submit form */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4" /> New Monthly Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase">Report Month</label>
            <Input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="mt-1 w-48"
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase mb-2">Marketing Spend Breakdown ($)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SPEND_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground">{f.label}</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 h-8 text-sm"
                    value={spend[f.key] || ""}
                    onChange={(e) => setSpend((p) => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total: ${Object.values(spend).reduce((s, v) => s + (v || 0), 0).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase">Hub Hours Used</label>
            <Input
              type="number"
              min="0"
              value={hubHours || ""}
              onChange={(e) => setHubHours(parseInt(e.target.value) || 0)}
              className="mt-1 w-32 h-8 text-sm"
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase">Team Payout Notes (Optional)</label>
            <Textarea
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
              className="mt-1"
              rows={3}
              placeholder="Summary of team payouts, outstanding balances, etc."
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} size="sm">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Submit Report to Yangu
          </Button>
        </CardContent>
      </Card>

      {/* Past reports */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Submission History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !pastReports?.length ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No reports submitted yet</p>
          ) : (
            <div className="space-y-2">
              {pastReports.map((r) => {
                const d = r.data as any;
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(r.report_date), "MMMM yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Spend: ${d?.marketing_spend_total?.toFixed(2) ?? "0.00"} · Hub: {d?.hub_hours ?? 0}h
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon(r.status)}
                      <Badge variant="outline" className="text-[10px]">
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
