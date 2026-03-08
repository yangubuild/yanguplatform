import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type InternalStatus = "pending" | "approved" | "rejected";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function parseJsonOrText(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractDiditError(payload: unknown, fallback = "Failed to start verification session."): string {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const body = payload as Record<string, unknown>;
    const message = body.detail ?? body.error ?? body.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return fallback;
}

function mapDiditStatus(rawStatus: string | null | undefined): InternalStatus {
  const normalized = (rawStatus ?? "").toLowerCase().trim();

  if (["approved", "verified", "completed"].includes(normalized)) {
    return "approved";
  }

  if (["declined", "rejected", "failed", "denied"].includes(normalized)) {
    return "rejected";
  }

  return "pending";
}

function getOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  const referer = req.headers.get("referer");
  if (!referer) return null;

  try {
    const parsed = new URL(referer);
    return parsed.origin;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized", request_id: requestId }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({ error: "Backend auth configuration is missing." }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    let requestBody: Record<string, unknown> = {};
    try {
      requestBody = (await req.json()) as Record<string, unknown>;
    } catch {
      requestBody = {};
    }

    const action = typeof requestBody.action === "string" ? requestBody.action : "start_or_continue";

    const { data: existing, error: existingError } = await admin
      .from("kyc_verifications")
      .select("status, submitted_at, reviewed_at, rejection_reason, metadata")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      return jsonResponse({ error: existingError.message }, 500);
    }

    const metadata =
      existing?.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};

    const diditApiKeyPrimary = Deno.env.get("DIDIT_API_KEY");
    const diditApiKeyFallback = Deno.env.get("DID_API_KEY");
    const diditApiKey = diditApiKeyPrimary ?? diditApiKeyFallback;
    const diditApiKeySource = diditApiKeyPrimary
      ? "DIDIT_API_KEY"
      : diditApiKeyFallback
      ? "DID_API_KEY"
      : "none";
    const diditWorkflowId = Deno.env.get("DIDIT_WORKFLOW_ID");
    const diditBaseUrl = Deno.env.get("DIDIT_BASE_URL") ?? "https://verification.didit.me";

    console.log("[kyc-didit-session] runtime config", {
      request_id: requestId,
      has_didit_api_key: !!diditApiKey,
      didit_api_key_source: diditApiKeySource,
      has_didit_workflow_id: !!diditWorkflowId,
      didit_workflow_id: diditWorkflowId ?? null,
      didit_base_url: diditBaseUrl,
    });

    const upsertKyc = async (params: {
      status: InternalStatus;
      providerStatus?: string | null;
      sessionId?: string | null;
      verificationUrl?: string | null;
      decisionPayload?: unknown;
      rejectionReason?: string | null;
      clearRejection?: boolean;
      resetReviewedAt?: boolean;
    }) => {
      const now = new Date().toISOString();
      const mergedMetadata: Record<string, unknown> = {
        ...metadata,
        didit_last_synced_at: now,
      };

      if (typeof params.providerStatus === "string" && params.providerStatus.length > 0) {
        mergedMetadata.didit_last_status = params.providerStatus;
      }
      if (typeof params.sessionId === "string" && params.sessionId.length > 0) {
        mergedMetadata.didit_session_id = params.sessionId;
      }
      if (typeof params.verificationUrl === "string" && params.verificationUrl.length > 0) {
        mergedMetadata.didit_verification_url = params.verificationUrl;
      }
      if (params.decisionPayload !== undefined) {
        mergedMetadata.didit_last_response = params.decisionPayload as Record<string, unknown>;
      }

      const payload: Record<string, unknown> = {
        user_id: user.id,
        status: params.status,
        submitted_at: existing?.submitted_at ?? now,
        metadata: mergedMetadata,
      };

      if (params.status === "approved") {
        payload.reviewed_at = now;
        payload.rejection_reason = null;
      } else if (params.status === "rejected") {
        payload.reviewed_at = now;
        payload.rejection_reason = params.rejectionReason ?? existing?.rejection_reason ?? null;
      } else {
        payload.reviewed_at = params.resetReviewedAt ? null : existing?.reviewed_at ?? null;
        if (params.clearRejection) {
          payload.rejection_reason = null;
        }
      }

      const { error } = await admin
        .from("kyc_verifications")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        throw new Error(error.message);
      }
    };

    if (action === "sync_status") {
      const verificationSessionId =
        typeof requestBody.verificationSessionId === "string"
          ? requestBody.verificationSessionId
          : (metadata.didit_session_id as string | undefined);

      const statusHint = typeof requestBody.statusHint === "string" ? requestBody.statusHint : null;

      let providerStatus: string | null = statusHint;
      let decisionPayload: unknown = null;

      if (verificationSessionId && diditApiKey) {
        const decisionEndpoints = [
          `${diditBaseUrl}/v3/session/${verificationSessionId}/decision/`,
          `${diditBaseUrl}/v2/session/${verificationSessionId}/decision/`,
        ];

        for (const endpoint of decisionEndpoints) {
          const response = await fetch(endpoint, {
            method: "GET",
            headers: {
              accept: "application/json",
              "x-api-key": diditApiKey,
            },
          });

          if (!response.ok) continue;

          decisionPayload = await response.json();
          const body = decisionPayload as Record<string, unknown>;
          providerStatus =
            typeof body.status === "string"
              ? body.status
              : typeof body.decision === "string"
              ? body.decision
              : typeof body.verification_status === "string"
              ? body.verification_status
              : providerStatus;
          break;
        }
      }

      if (!providerStatus) {
        return jsonResponse({ error: "Could not determine verification status yet." }, 400);
      }

      const mapped = mapDiditStatus(providerStatus);

      await upsertKyc({
        status: mapped,
        providerStatus,
        sessionId: verificationSessionId,
        decisionPayload,
        rejectionReason:
          mapped === "rejected" && decisionPayload && typeof (decisionPayload as Record<string, unknown>).reason === "string"
            ? ((decisionPayload as Record<string, unknown>).reason as string)
            : null,
      });

      return jsonResponse({
        success: true,
        mapped_status: mapped,
        provider_status: providerStatus,
      });
    }

    if (existing?.status === "approved") {
      return jsonResponse({
        success: true,
        mapped_status: "approved",
      });
    }

    const existingVerificationUrl =
      typeof metadata.didit_verification_url === "string" ? (metadata.didit_verification_url as string) : null;

    if (
      (existing?.status === "pending" || existing?.status === "submitted") &&
      existingVerificationUrl
    ) {
      return jsonResponse({
        success: true,
        verification_url: existingVerificationUrl,
        mapped_status: "pending",
      });
    }

    if (!diditApiKey || !diditWorkflowId) {
      console.error("[kyc-didit-session] missing Didit config", {
        request_id: requestId,
        has_didit_api_key: !!diditApiKey,
        didit_api_key_source: diditApiKeySource,
        has_didit_workflow_id: !!diditWorkflowId,
      });

      return jsonResponse(
        {
          error: "Didit is not fully configured. Missing DIDIT_API_KEY (or DID_API_KEY) or DIDIT_WORKFLOW_ID secret.",
          request_id: requestId,
          config: {
            has_didit_api_key: !!diditApiKey,
            didit_api_key_source: diditApiKeySource,
            has_didit_workflow_id: !!diditWorkflowId,
            didit_workflow_id: diditWorkflowId ?? null,
          },
        },
        503,
      );
    }

    const callbackUrl =
      Deno.env.get("DIDIT_CALLBACK_URL") ?? `${getOrigin(req) ?? "https://yangu-launchpad.lovable.app"}/kyc`;

    const createEndpoints = [`${diditBaseUrl}/v3/session/`, `${diditBaseUrl}/v2/session/`];
    const diditPayload = {
      workflow_id: diditWorkflowId,
      vendor_data: user.id,
      callback: callbackUrl,
    };

    console.log("[kyc-didit-session] create session request", {
      request_id: requestId,
      endpoints: createEndpoints,
      payload: diditPayload,
      didit_api_key_source: diditApiKeySource,
    });

    let createEndpointUsed: string | null = null;
    let createBody: Record<string, unknown> | null = null;
    let createStatus: number | null = null;
    let lastCreateErrorBody: unknown = null;

    for (const endpoint of createEndpoints) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": diditApiKey,
        },
        body: JSON.stringify(diditPayload),
      });

      const parsed = await parseJsonOrText(response);
      const normalizedBody =
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : { raw: parsed };

      console.log("[kyc-didit-session] create session response", {
        request_id: requestId,
        endpoint,
        status: response.status,
        ok: response.ok,
        body: normalizedBody,
      });

      createStatus = response.status;

      if (response.ok) {
        createEndpointUsed = endpoint;
        createBody = normalizedBody;
        break;
      }

      lastCreateErrorBody = normalizedBody;
    }

    if (!createBody || !createEndpointUsed) {
      return jsonResponse(
        {
          error: extractDiditError(lastCreateErrorBody),
          request_id: requestId,
          didit_status: createStatus,
          didit_endpoint: createEndpoints,
          didit_response: lastCreateErrorBody,
          payload: diditPayload,
          config: {
            has_didit_api_key: !!diditApiKey,
            didit_api_key_source: diditApiKeySource,
            has_didit_workflow_id: !!diditWorkflowId,
            didit_workflow_id: diditWorkflowId,
            callback_url: callbackUrl,
          },
        },
        createStatus && createStatus >= 400 && createStatus < 600 ? createStatus : 400,
      );
    }

    const body = createBody;

    const verificationUrl =
      typeof body.verification_url === "string"
        ? body.verification_url
        : typeof body.url === "string"
        ? body.url
        : null;

    const sessionId =
      typeof body.session_id === "string"
        ? body.session_id
        : typeof body.verificationSessionId === "string"
        ? body.verificationSessionId
        : null;

    if (!verificationUrl) {
      return jsonResponse({ error: "Didit session was created without a verification URL." }, 400);
    }

    const providerStatus = typeof body.status === "string" ? body.status : "Not Started";
    const mappedStatus = mapDiditStatus(providerStatus);

    await upsertKyc({
      status: mappedStatus,
      providerStatus,
      sessionId,
      verificationUrl,
      decisionPayload: body,
      clearRejection: true,
      resetReviewedAt: true,
    });

    return jsonResponse({
      success: true,
      verification_url: verificationUrl,
      mapped_status: mappedStatus,
      session_id: sessionId,
    });
  } catch (error) {
    console.error("kyc-didit-session error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal error" }, 500);
  }
});
