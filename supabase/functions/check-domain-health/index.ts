import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DOMAINS = [
  { domain: "yangu.io", label: "Main Platform" },
  { domain: "yangu.shop", label: "Shop" },
  { domain: "yangu.store", label: "Store" },
  { domain: "yangu.site", label: "Sites" },
  { domain: "yangu.studio", label: "Studio" },
  { domain: "yangu.live", label: "Live" },
  { domain: "yangu.community", label: "Community" },
  { domain: "manage.yangu.studio", label: "Management" },
  { domain: "agency.yangu.studio", label: "Agency" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const results: Array<{
    domain: string;
    status: string;
    response_time_ms: number | null;
    error_rate: number | null;
    error_message: string | null;
  }> = [];

  for (const { domain } of DOMAINS) {
    const url = `https://${domain}`;
    let status = "healthy";
    let responseTime: number | null = null;
    let errorMessage: string | null = null;

    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);

      responseTime = Date.now() - start;

      if (!res.ok && res.status >= 500) {
        status = "down";
        errorMessage = `HTTP ${res.status}`;
      } else if (responseTime > 5000) {
        status = "down";
        errorMessage = `Timeout: ${responseTime}ms`;
      } else if (responseTime > 2000) {
        status = "degraded";
      }
    } catch (err: unknown) {
      status = "down";
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    results.push({
      domain,
      status,
      response_time_ms: responseTime,
      error_rate: status === "down" ? 1.0 : status === "degraded" ? 0.1 : 0.0,
      error_message: errorMessage,
    });
  }

  // Batch insert health checks
  const { error: insertError } = await supabase
    .from("domain_health_checks")
    .insert(
      results.map((r) => ({
        domain: r.domain,
        status: r.status,
        response_time_ms: r.response_time_ms,
        error_rate: r.error_rate,
        error_message: r.error_message,
      }))
    );

  if (insertError) {
    console.error("[check-domain-health] insert error:", insertError);
  }

  // Check for domains down 3 consecutive times → create incident
  for (const r of results) {
    if (r.status !== "down") continue;

    const { data: recentChecks } = await supabase
      .from("domain_health_checks")
      .select("status")
      .eq("domain", r.domain)
      .order("checked_at", { ascending: false })
      .limit(3);

    if (
      recentChecks &&
      recentChecks.length >= 3 &&
      recentChecks.every((c: any) => c.status === "down")
    ) {
      // Check if an open incident already exists for this domain
      const { data: existingIncident } = await supabase
        .from("platform_incidents")
        .select("id")
        .eq("affected_system", r.domain)
        .in("status", ["open", "investigating"])
        .limit(1);

      if (!existingIncident || existingIncident.length === 0) {
        await supabase.from("platform_incidents").insert({
          title: `Domain DOWN: ${r.domain}`,
          description: `${r.domain} has been unreachable for 3 consecutive health checks. Last error: ${r.error_message}`,
          severity: "critical",
          status: "open",
          affected_system: r.domain,
        });
        console.log(`[check-domain-health] Created incident for ${r.domain}`);
      }
    }
  }

  return new Response(
    JSON.stringify({ checked: results.length, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
