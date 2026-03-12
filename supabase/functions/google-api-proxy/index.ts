import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Unified Google API proxy edge function.
 * Routes: drive/files, gmail/messages, gmail/send, calendar/events, calendar/create, youtube/channel
 * Handles token refresh automatically.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const action: string = body.action;

    if (!action) {
      return json({ error: "action is required" }, 400);
    }

    // Get the user's token for the relevant provider
    const admin = createClient(supabaseUrl, serviceKey);
    const provider = getProviderForAction(action);

    console.log("[google-api-proxy]", { action, provider, userId: user.id });

    // Try connected_accounts first
    const { data: account } = await admin
      .from("connected_accounts")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .single();

    // Fallback to drive_tokens for google-drive (legacy connection flow)
    let tokenRecord = account;
    if (!tokenRecord?.access_token && provider === "google-drive") {
      console.log("[google-api-proxy] Falling back to drive_tokens table");
      const { data: driveToken } = await admin
        .from("drive_tokens")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", user.id)
        .single();

      if (driveToken?.access_token) {
        tokenRecord = driveToken;
        // Sync to connected_accounts for future use
        await admin.from("connected_accounts").upsert({
          user_id: user.id,
          provider: "google-drive",
          provider_user_id: "synced",
          access_token: driveToken.access_token,
          refresh_token: driveToken.refresh_token || "",
          expires_at: driveToken.expires_at,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,provider" });
      }
    }

    if (!tokenRecord?.access_token) {
      console.log("[google-api-proxy] No token found", { provider, userId: user.id });
      return json({ error: `Not connected to ${provider}. Please connect first.` }, 403);
    }

    // Check if token needs refresh
    let accessToken = tokenRecord.access_token;
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) <= new Date()) {
      console.log("[google-api-proxy] Token expired, refreshing...");
      const refreshed = await refreshGoogleToken(tokenRecord.refresh_token);
      if (!refreshed) {
        return json({ error: "Token expired. Please reconnect the app." }, 401);
      }
      accessToken = refreshed.access_token;

      // Update stored token
      await admin.from("connected_accounts").update({
        access_token: refreshed.access_token,
        expires_at: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id).eq("provider", provider);

      // Also update drive_tokens if provider is google-drive
      if (provider === "google-drive") {
        await admin.from("drive_tokens").update({
          access_token: refreshed.access_token,
          expires_at: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id);
      }
    }

    // Route to the appropriate handler
    switch (action) {
      case "drive/files":
        return await handleDriveFiles(accessToken, body);
      case "drive/file-detail":
        return await handleDriveFileDetail(accessToken, body);
      case "gmail/messages":
        return await handleGmailMessages(accessToken, body);
      case "gmail/message-detail":
        return await handleGmailMessageDetail(accessToken, body);
      case "gmail/send":
        return await handleGmailSend(accessToken, body);
      case "calendar/events":
        return await handleCalendarEvents(accessToken, body);
      case "calendar/create":
        return await handleCalendarCreate(accessToken, body);
      case "youtube/channel":
        return await handleYouTubeChannel(accessToken);
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("[google-api-proxy]", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});

function getProviderForAction(action: string): string {
  if (action.startsWith("drive/")) return "google-drive";
  if (action.startsWith("gmail/")) return "gmail";
  if (action.startsWith("calendar/")) return "google-meet";
  if (action.startsWith("youtube/")) return "youtube";
  return "google-drive";
}

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  if (!refreshToken) return null;

  const clientId = (Deno.env.get("GOOGLE_DRIVE_CLIENT_ID") || "").trim();
  const clientSecret = (Deno.env.get("GOOGLE_DRIVE_CLIENT_SECRET") || "").trim();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  return await res.json();
}

// ============ DRIVE ============

async function handleDriveFiles(token: string, body: { query?: string; pageToken?: string; pageSize?: number }) {
  const params = new URLSearchParams({
    pageSize: String(body.pageSize || 20),
    fields: "nextPageToken,files(id,name,mimeType,modifiedTime,size,thumbnailLink,webViewLink,iconLink)",
    orderBy: "modifiedTime desc",
  });
  if (body.query) params.set("q", body.query);
  if (body.pageToken) params.set("pageToken", body.pageToken);

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) return json({ error: data.error?.message || "Drive API error" }, res.status);
  return json(data);
}

async function handleDriveFileDetail(token: string, body: { fileId: string }) {
  if (!body.fileId) return json({ error: "fileId required" }, 400);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${body.fileId}?fields=id,name,mimeType,modifiedTime,size,thumbnailLink,webViewLink,iconLink,description`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) return json({ error: data.error?.message || "Drive API error" }, res.status);
  return json(data);
}

// ============ GMAIL ============

async function handleGmailMessages(token: string, body: { query?: string; pageToken?: string; maxResults?: number }) {
  const params = new URLSearchParams({
    maxResults: String(body.maxResults || 20),
  });
  if (body.query) params.set("q", body.query);
  if (body.pageToken) params.set("pageToken", body.pageToken);

  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  if (!listRes.ok) return json({ error: listData.error?.message || "Gmail API error" }, listRes.status);

  // Fetch metadata for each message
  const messages = listData.messages || [];
  const detailed = await Promise.all(
    messages.slice(0, 20).map(async (msg: { id: string }) => {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!detailRes.ok) return { id: msg.id, error: true };
      const detail = await detailRes.json();
      const headers = detail.payload?.headers || [];
      return {
        id: detail.id,
        threadId: detail.threadId,
        snippet: detail.snippet,
        labelIds: detail.labelIds,
        from: headers.find((h: { name: string }) => h.name === "From")?.value || "",
        subject: headers.find((h: { name: string }) => h.name === "Subject")?.value || "",
        date: headers.find((h: { name: string }) => h.name === "Date")?.value || "",
        isUnread: (detail.labelIds || []).includes("UNREAD"),
      };
    })
  );

  return json({
    messages: detailed,
    nextPageToken: listData.nextPageToken,
    resultSizeEstimate: listData.resultSizeEstimate,
  });
}

async function handleGmailMessageDetail(token: string, body: { messageId: string }) {
  if (!body.messageId) return json({ error: "messageId required" }, 400);

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${body.messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) return json({ error: data.error?.message || "Gmail API error" }, res.status);

  const headers = data.payload?.headers || [];
  const getBody = (payload: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }): string => {
    if (payload.mimeType === "text/plain" && payload.body?.data) {
      return atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    }
    if (payload.mimeType === "text/html" && payload.body?.data) {
      return atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    }
    if (payload.parts) {
      for (const part of payload.parts as { mimeType?: string; body?: { data?: string }; parts?: unknown[] }[]) {
        const result = getBody(part);
        if (result) return result;
      }
    }
    return "";
  };

  return json({
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet,
    labelIds: data.labelIds,
    from: headers.find((h: { name: string }) => h.name === "From")?.value || "",
    to: headers.find((h: { name: string }) => h.name === "To")?.value || "",
    subject: headers.find((h: { name: string }) => h.name === "Subject")?.value || "",
    date: headers.find((h: { name: string }) => h.name === "Date")?.value || "",
    body: getBody(data.payload || {}),
  });
}

async function handleGmailSend(token: string, body: { to: string; subject: string; message: string }) {
  if (!body.to || !body.subject || !body.message) {
    return json({ error: "to, subject, and message are required" }, 400);
  }

  const raw = [
    `To: ${body.to}`,
    `Subject: ${body.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body.message,
  ].join("\r\n");

  const encodedMessage = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });
  const data = await res.json();
  if (!res.ok) return json({ error: data.error?.message || "Gmail send failed" }, res.status);
  return json({ ok: true, id: data.id });
}

// ============ CALENDAR / MEET ============

async function handleCalendarEvents(token: string, body: { maxResults?: number }) {
  const params = new URLSearchParams({
    maxResults: String(body.maxResults || 10),
    timeMin: new Date().toISOString(),
    orderBy: "startTime",
    singleEvents: "true",
  });

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) return json({ error: data.error?.message || "Calendar API error" }, res.status);

  const events = (data.items || []).map((e: {
    id: string;
    summary?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    hangoutLink?: string;
    htmlLink?: string;
    status?: string;
    attendees?: { email: string; responseStatus?: string }[];
  }) => ({
    id: e.id,
    summary: e.summary || "Untitled",
    start: e.start?.dateTime || e.start?.date || "",
    end: e.end?.dateTime || e.end?.date || "",
    meetLink: e.hangoutLink || null,
    htmlLink: e.htmlLink || null,
    status: e.status,
    attendees: (e.attendees || []).map((a) => ({ email: a.email, status: a.responseStatus })),
  }));

  return json({ events });
}

async function handleCalendarCreate(token: string, body: {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[];
  addMeetLink?: boolean;
}) {
  if (!body.summary || !body.startDateTime || !body.endDateTime) {
    return json({ error: "summary, startDateTime, endDateTime required" }, 400);
  }

  const event: Record<string, unknown> = {
    summary: body.summary,
    description: body.description || "",
    start: { dateTime: body.startDateTime, timeZone: "UTC" },
    end: { dateTime: body.endDateTime, timeZone: "UTC" },
  };

  if (body.attendees?.length) {
    event.attendees = body.attendees.map((email) => ({ email }));
  }

  if (body.addMeetLink !== false) {
    event.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const params = new URLSearchParams({ conferenceDataVersion: "1" });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });
  const data = await res.json();
  if (!res.ok) return json({ error: data.error?.message || "Failed to create event" }, res.status);

  return json({
    ok: true,
    id: data.id,
    meetLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri || null,
    htmlLink: data.htmlLink,
    summary: data.summary,
    start: data.start?.dateTime,
    end: data.end?.dateTime,
  });
}

// ============ YOUTUBE ============

async function handleYouTubeChannel(token: string) {
  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    mine: "true",
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) return json({ error: data.error?.message || "YouTube API error" }, res.status);

  const channel = data.items?.[0];
  if (!channel) {
    return json({
      channel: null,
      message: "No channel found for this Google account.",
    });
  }

  return json({
    channel: {
      id: channel.id,
      title: channel.snippet?.title || "",
      description: channel.snippet?.description || "",
      customUrl: channel.snippet?.customUrl || "",
      thumbnails: channel.snippet?.thumbnails || {},
      publishedAt: channel.snippet?.publishedAt || null,
      country: channel.snippet?.country || null,
      subscriberCount: channel.statistics?.subscriberCount || "0",
      videoCount: channel.statistics?.videoCount || "0",
      viewCount: channel.statistics?.viewCount || "0",
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || null,
    },
  });
}
