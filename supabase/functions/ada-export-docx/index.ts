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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch chat
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

    // Permission check
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

    const title = chat.title || "ADA Chat Export";

    // Build a simple OOXML (docx) - minimal valid docx as XML
    // For full docx, we'd need a library; here we produce a Word-compatible HTML
    // that Word can open (saved as .doc which is actually HTML that Word reads)
    let doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title>
<style>
body { font-family: Calibri, sans-serif; }
h1 { color: #D4952B; border-bottom: 2px solid #D4952B; }
.meta { color: #888; font-size: 10pt; }
.msg { margin: 12px 0; padding: 8px; }
.msg-user { background: #FFF8F0; border-left: 3px solid #D4952B; }
.msg-assistant { background: #F5F5F5; border-left: 3px solid #666; }
.role { font-weight: bold; font-size: 9pt; text-transform: uppercase; color: #888; }
.content { white-space: pre-wrap; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p class="meta">Exported on ${new Date().toLocaleString()} · Chat started: ${new Date(chat.created_at).toLocaleString()}</p>
`;

    for (const msg of messages || []) {
      const roleLabel = msg.role === "user" ? "You" : "Ada";
      const cls = msg.role === "user" ? "msg-user" : "msg-assistant";
      let content = msg.content || "";
      content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "[Image]");

      doc += `<div class="msg ${cls}">
<p class="role">${roleLabel}</p>
<p class="content">${escapeHtml(content)}</p>
</div>\n`;
    }

    doc += `</body></html>`;

    // Upload as .doc (Word-compatible HTML)
    const filename = `exports/${user.id}/${chat_id}-${Date.now()}.doc`;
    const { error: uploadErr } = await adminClient.storage
      .from("ada-uploads")
      .upload(filename, new Blob([doc], { type: "application/msword" }), {
        upsert: true,
        contentType: "application/msword",
      });

    if (uploadErr) {
      console.error("[ExportDOCX] Upload error:", uploadErr);
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
        filename: `${title.replace(/[^a-zA-Z0-9]/g, "_")}.doc`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[ExportDOCX] Error:", err);
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
