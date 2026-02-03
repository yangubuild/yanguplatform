// Dev-only Seeder Page
// Creates test org, domains, and memberships for development testing
// ONLY accessible in development mode

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell, PageContainer, Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { Navigate } from "react-router-dom";

// Only allow in development
const isDev = import.meta.env.DEV;

// Domain configurations to seed
const DOMAINS_TO_SEED = [
  { host: "yangu.io", domain_type: "io" },
  { host: "yangu.community", domain_type: "community" },
  { host: "yangu.studio", domain_type: "studio" },
  { host: "yangu.shop", domain_type: "shop" },
  { host: "yangu.store", domain_type: "store" },
  { host: "yangu.live", domain_type: "live" },
  { host: "yangu.site", domain_type: "site" },
] as const;

interface SeedResult {
  success: boolean;
  orgId?: string;
  orgName?: string;
  domains?: Array<{ host: string; id: string }>;
  error?: string;
}

export default function DevSeed() {
  const { user, isLoading: authLoading } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);

  // Redirect if not in development
  if (!isDev) {
    return <Navigate to="/" replace />;
  }

  // Loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <AppShell>
        <PageContainer size="sm">
          <Card className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground">
              Please log in to use the dev seeder.
            </p>
          </Card>
        </PageContainer>
      </AppShell>
    );
  }

  // Wait for org_membership to exist (created by trigger)
  async function waitForMembership(orgId: string, maxAttempts = 10): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      const { data } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("org_id", orgId)
        .eq("user_id", user!.id)
        .eq("role", "owner")
        .maybeSingle();

      if (data) return true;
      
      // Wait 100ms before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  }

  async function handleSeed() {
    if (!user) return;

    setIsSeeding(true);
    setResult(null);

    try {
      // Step 1: Create organization
      // The trigger will auto-create org_memberships and org_billing
      const { data: orgData, error: orgError } = await supabase
        .from("orgs")
        .insert({
          name: "YANGU Test Org",
          owner_user_id: user.id,
        })
        .select("id, name")
        .single();

      if (orgError) {
        // Check if org already exists
        if (orgError.code === "23505") {
          // Unique violation - try to find existing org
          const { data: existingOrg } = await supabase
            .from("orgs")
            .select("id, name")
            .eq("owner_user_id", user.id)
            .eq("name", "YANGU Test Org")
            .single();

          if (existingOrg) {
            // Use existing org and continue with domain seeding
            return await seedDomainsForOrg(existingOrg.id, existingOrg.name);
          }
        }
        throw orgError;
      }

      // Step 2: Wait for org_membership trigger to complete
      const membershipExists = await waitForMembership(orgData.id);
      if (!membershipExists) {
        throw new Error("Timeout waiting for org membership to be created by trigger");
      }

      // Step 3: Now insert domains (RLS should pass)
      await seedDomainsForOrg(orgData.id, orgData.name);
    } catch (err) {
      console.error("Seeding error:", err);
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Failed to seed data",
      });
    } finally {
      setIsSeeding(false);
    }
  }

  async function seedDomainsForOrg(orgId: string, orgName: string) {
    // Step 2: Upsert domains
    const domainResults: Array<{ host: string; id: string }> = [];

    for (const domain of DOMAINS_TO_SEED) {
      // Try to insert, or update if exists
      const { data: domainData, error: domainError } = await supabase
        .from("domains")
        .upsert(
          {
            host: domain.host,
            domain_type: domain.domain_type,
            org_id: orgId,
            is_active: true,
          },
          {
            onConflict: "host",
            ignoreDuplicates: false,
          }
        )
        .select("id, host")
        .single();

      if (domainError) {
        // If upsert fails, try to fetch existing
        const { data: existingDomain } = await supabase
          .from("domains")
          .select("id, host")
          .eq("host", domain.host)
          .single();

        if (existingDomain) {
          // Update org_id for existing domain
          await supabase
            .from("domains")
            .update({ org_id: orgId, is_active: true })
            .eq("id", existingDomain.id);

          domainResults.push({
            host: existingDomain.host,
            id: existingDomain.id,
          });
        } else {
          console.warn(`Failed to seed domain ${domain.host}:`, domainError);
        }
      } else if (domainData) {
        domainResults.push({
          host: domainData.host,
          id: domainData.id,
        });
      }
    }

    setResult({
      success: true,
      orgId,
      orgName,
      domains: domainResults,
    });
  }

  return (
    <AppShell>
      <PageContainer size="sm">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              Development Only
            </Badge>
            <h1 className="text-3xl font-bold mb-2">Dev Seeder</h1>
            <p className="text-muted-foreground">
              Create test organization and domains for development
            </p>
          </div>

          {/* Current User Info */}
          <Card className="p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Current User
            </h2>
            <div className="space-y-2">
              <Row label="auth.uid()" value={user.id} />
              <Row label="Email" value={user.email || "N/A"} />
            </div>
          </Card>

          {/* Seed Action */}
          <Card className="p-6">
            <div className="text-center space-y-4">
              <Database className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  Seed Domains + Test Org
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Creates "YANGU Test Org" with all 7 platform domains assigned
                </p>
              </div>

              <div className="text-left bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Will create:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Organization: "YANGU Test Org"</li>
                  <li>• Owner membership (auto via trigger)</li>
                  <li>• Org billing record (auto via trigger)</li>
                  <li>• 7 domains: {DOMAINS_TO_SEED.map(d => d.host).join(", ")}</li>
                </ul>
              </div>

              <Button
                onClick={handleSeed}
                disabled={isSeeding}
                className="w-full"
                size="lg"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Seed Data
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Result */}
          {result && (
            <Card className={`p-6 ${result.success ? "border-accent" : "border-destructive"}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-accent flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-2">
                    {result.success ? "Seeding Complete!" : "Seeding Failed"}
                  </h3>

                  {result.success ? (
                    <div className="space-y-3 text-sm">
                      <Row label="org_id" value={result.orgId || "N/A"} />
                      <Row label="org_name" value={result.orgName || "N/A"} />

                      <div>
                        <p className="text-muted-foreground mb-1">Domains created:</p>
                        <div className="space-y-1">
                          {result.domains?.map((d) => (
                            <div
                              key={d.id}
                              className="flex justify-between items-center bg-muted/50 rounded px-2 py-1"
                            >
                              <span className="font-mono text-xs">{d.host}</span>
                              <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                                {d.id}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">{result.error}</p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono text-xs truncate max-w-[280px]" title={value}>
        {value}
      </span>
    </div>
  );
}
