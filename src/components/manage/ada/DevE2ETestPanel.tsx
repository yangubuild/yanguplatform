import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FlaskConical, Loader2 } from "lucide-react";

const PROVIDERS = ["auto", "openai", "gemini", "ideogram", "qwen"] as const;

interface DebugResult {
  ok: boolean;
  image_url?: string;
  storage_path?: string;
  media_id?: string;
  provider_used?: string;
  model_used?: string;
  generation_latency_ms?: number;
  fallback_from?: string | null;
  error_code?: string;
  message?: string;
}

export function DevE2ETestPanel() {
  const [prompt, setPrompt] = useState("A golden sunset over calm water, ultra high resolution");
  const [provider, setProvider] = useState<string>("auto");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Need a chatId – create a throwaway one
      const { data: chat } = await supabase
        .from("ada_chats")
        .insert({ user_id: session!.user.id, title: "[dev-e2e-test]" })
        .select("id")
        .single();

      const body: Record<string, unknown> = {
        prompt,
        chatId: chat?.id,
        debug: true,
      };
      if (provider !== "auto") body.provider = provider;

      const res = await fetch(`${supabaseUrl}/functions/v1/ada-generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${session!.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({ ok: false, message: "Invalid JSON" }));
      setResult(data);
    } catch (err: any) {
      setResult({ ok: false, message: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-md border border-[hsl(var(--admin-border)/0.4)] bg-[hsl(var(--admin-surface-elevated)/0.25)] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-[hsl(25,85%,45%)]" />
        <span className="text-xs font-semibold tracking-wide uppercase text-[hsl(var(--admin-text))]">
          Dev E2E Generation Tester
        </span>
        <Badge variant="outline" className="text-[9px] border-[hsl(25,85%,45%/0.5)] text-[hsl(25,85%,45%)]">
          ADMIN ONLY
        </Badge>
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        className="bg-[hsl(var(--admin-surface)/0.4)] border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] text-xs placeholder:text-[hsl(var(--admin-text-muted))]"
        placeholder="Enter test prompt…"
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[hsl(var(--admin-text-muted))]">Provider:</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="text-[11px] px-2 py-1 rounded-md bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none">
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button
          onClick={run}
          disabled={running || !prompt.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[hsl(25,85%,45%/0.15)] text-[hsl(25,85%,45%)] border border-[hsl(25,85%,45%/0.3)] hover:bg-[hsl(25,85%,45%/0.25)] transition-colors disabled:opacity-40">
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
          Run E2E Test
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
            {([
              ["Status", result.ok ? "✅ OK" : `❌ ${result.error_code || "FAIL"}`],
              ["provider_used", result.provider_used],
              ["model_used", result.model_used],
              ["latency_ms", result.generation_latency_ms != null ? `${result.generation_latency_ms}ms` : "—"],
              ["fallback_from", result.fallback_from || "none"],
              ["media_id", result.media_id],
              ["upload_path", result.storage_path],
            ] as [string, string | undefined][]).map(([label, val]) => (
              <div key={label} className="rounded-md bg-[hsl(var(--admin-surface)/0.3)] border border-[hsl(var(--admin-border)/0.2)] px-2 py-1.5">
                <div className="text-[hsl(var(--admin-text-muted))] mb-0.5">{label}</div>
                <div className="text-[hsl(var(--admin-text))] font-mono break-all">{val || "—"}</div>
              </div>
            ))}
          </div>

          {result.ok && result.image_url && (
            <img
              src={result.image_url}
              alt="Generated test"
              className="max-w-xs rounded-md border border-[hsl(var(--admin-border)/0.3)]"
            />
          )}

          {!result.ok && result.message && (
            <p className="text-[11px] text-red-400">{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
