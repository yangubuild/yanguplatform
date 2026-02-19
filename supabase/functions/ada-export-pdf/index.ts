import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token for RLS
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { chat_id } = await req.json();
    if (!chat_id) {
      return new Response(JSON.stringify({ error: "chat_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to check admin or ownership
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the chat
    const { data: chat, error: chatErr } = await adminClient
      .from("ada_chats")
      .select("id, title, user_id, created_at")
      .eq("id", chat_id)
      .single();

    if (chatErr || !chat) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Permission: owner or admin
    const isOwner = chat.user_id === user.id;
    let isAdmin = false;
    if (!isOwner) {
      const { data: hasAdmin } = await adminClient.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      isAdmin = !!hasAdmin;
    }

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Permission denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch messages
    const { data: messages } = await adminClient
      .from("ada_messages")
      .select("role, content, metadata, created_at")
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: true });

    // Build a simple HTML document for PDF-like output
    const title = chat.title || "ADA Chat Export";
    const date = new Date(chat.created_at).toLocaleString();

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
h1 { font-size: 24px; border-bottom: 2px solid #D4952B; padding-bottom: 8px; }
.meta { color: #888; font-size: 12px; margin-bottom: 24px; }
.msg { margin-bottom: 16px; padding: 12px; border-radius: 8px; }
.msg-user { background: #FFF8F0; border-left: 3px solid #D4952B; }
.msg-assistant { background: #F5F5F5; border-left: 3px solid #666; }
.role { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
.content { white-space: pre-wrap; line-height: 1.6; }
.img-thumb { max-width: 200px; max-height: 150px; border-radius: 4px; margin-top: 8px; }
</style></head><body>
<h1>${title}</h1>
<div class="meta">Exported on ${new Date().toLocaleString()} · Chat started: ${date}</div>
`;

    for (const msg of messages || []) {
      const roleLabel = msg.role === "user" ? "You" : "Ada";
      const cls = msg.role === "user" ? "msg-user" : "msg-assistant";

      // Strip markdown images but note them
      let content = msg.content || "";
      const imgMatches = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
      content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "[Image]");

      html += `<div class="msg ${cls}">
<div class="role">${roleLabel}</div>
<div class="content">${escapeHtml(content)}</div>`;

      // Add image thumbnails
      for (const m of imgMatches) {
        const urlMatch = m.match(/\(([^)]+)\)/);
        if (urlMatch) {
          html += `<img class="img-thumb" src="${escapeHtml(urlMatch[1])}" alt="Generated image" />`;
        }
      }

      // Metadata: prompt info
      const meta = msg.metadata as Record<string, unknown> | null;
      if (meta?.type === "image" && meta?.provider) {
        html += `<div style="font-size:10px;color:#aaa;margin-top:4px;">Provider: ${meta.provider}</div>`;
      }

      html += `</div>\n`;
    }

    html += `</body></html>`;

    // Upload HTML as a file to storage (signed URL for download)
    const filename = `exports/${user.id}/${chat_id}-${Date.now()}.html`;
    const { error: uploadErr } = await adminClient.storage
      .from("ada-uploads")
      .upload(filename, new Blob([html], { type: "text/html" }), {
        upsert: true,
        contentType: "text/html",
      });

    if (uploadErr) {
      console.error("[ExportPDF] Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Failed to save export" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedData } = await adminClient.storage
      .from("ada-uploads")
      .createSignedUrl(filename, 3600);

    return new Response(
      JSON.stringify({
        ok: true,
        file_url: signedData?.signedUrl || "",
        filename: `${title.replace(/[^a-zA-Z0-9]/g, "_")}.html`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[ExportPDF] Error:", err);
    return new Response(
      JSON.stringify({ error: "Export failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
