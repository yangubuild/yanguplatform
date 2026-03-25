import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { FileSignature, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ContractSectionProps {
  agencyId: string;
  memberId: string;
  canSign: boolean;
}

export function ContractSection({ agencyId, memberId, canSign }: ContractSectionProps) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["agency-contract", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_contracts")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const signContract = async () => {
    if (!contract || !signedName || !agreed) return;
    setSigning(true);
    try {
      const { error } = await supabase
        .from("agency_contracts")
        .update({
          signed_at: new Date().toISOString(),
          signed_by: memberId,
          status: "signed",
          signature_data: {
            typed_name: signedName,
            signed_date: new Date().toISOString(),
            ip_context: "agency_dashboard",
          },
        })
        .eq("id", contract.id);
      if (error) throw error;
      toast.success("Contract signed successfully");
      qc.invalidateQueries({ queryKey: ["agency-contract"] });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to sign");
    } finally {
      setSigning(false);
    }
  };

  if (isLoading) return <Skeleton className="h-32" />;

  const statusColor = {
    draft: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    signed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    expired: "bg-destructive/10 text-destructive border-destructive/30",
    terminated: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileSignature className="w-4 h-4" /> Agency Contract
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!contract ? (
          <div className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-foreground">No contract available</p>
              <p className="text-xs text-muted-foreground">Contact Yangu Management to receive your Master Agency Agreement.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Master Agency Agreement</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created {format(new Date(contract.created_at), "MMM d, yyyy")}
                  {contract.expires_at && ` · Expires ${format(new Date(contract.expires_at), "MMM d, yyyy")}`}
                </p>
              </div>
              <Badge variant="outline" className={`text-[10px] ${statusColor[contract.status as keyof typeof statusColor] || ""}`}>
                {contract.status}
              </Badge>
            </div>

            {contract.contract_url && (
              <Button variant="outline" size="sm" onClick={() => window.open(contract.contract_url, "_blank")}>
                <FileText className="h-3.5 w-3.5 mr-1" /> View Contract PDF
              </Button>
            )}

            {contract.status === "signed" && contract.signature_data && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm text-foreground font-medium">
                    Signed by: {(contract.signature_data as any).typed_name}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(contract.signed_at!), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}

            {canSign && (contract.status === "draft" || contract.status === "expired") && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <FileSignature className="h-3.5 w-3.5 mr-1" /> Sign Contract
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sign Master Agency Agreement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      By typing your full legal name below and checking the box, you agree to the terms of the Master Agency Agreement.
                    </p>

                    {contract.contract_url && (
                      <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(contract.contract_url, "_blank")}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> Review Contract Before Signing
                      </Button>
                    )}

                    <div>
                      <label className="text-xs text-muted-foreground uppercase">Full Legal Name (Digital Signature)</label>
                      <Input
                        value={signedName}
                        onChange={(e) => setSignedName(e.target.value)}
                        placeholder="Type your full legal name"
                        className="mt-1 font-serif italic text-lg"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground uppercase">Date</label>
                      <Input value={format(new Date(), "MMMM d, yyyy")} disabled className="mt-1" />
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="agree-terms"
                        checked={agreed}
                        onCheckedChange={(v) => setAgreed(!!v)}
                        className="mt-0.5"
                      />
                      <label htmlFor="agree-terms" className="text-sm text-foreground leading-tight">
                        I have read and agree to the terms and conditions of the Master Agency Agreement
                      </label>
                    </div>

                    <Button
                      className="w-full"
                      disabled={!signedName.trim() || !agreed || signing}
                      onClick={signContract}
                    >
                      {signing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSignature className="h-4 w-4 mr-2" />}
                      Sign Contract
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
