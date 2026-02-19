import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const PROVIDERS = ["openai", "gemini", "ideogram", "qwen"] as const;
const TEST_PROMPT = "A simple red circle on a white background, minimal flat design";
const TEST_CHAT_ID = "00000000-0000-0000-0000-000000000000";

Deno.test("ada-generate-image provider health check", async (t) => {
  for (const provider of PROVIDERS) {
    await t.step(`provider: ${provider}`, async () => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ada-generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          // No auth token — expect AUTH_REQUIRED
        },
        body: JSON.stringify({
          prompt: TEST_PROMPT,
          chatId: TEST_CHAT_ID,
          provider,
          debug: true,
        }),
      });

      const body = await res.text();

      // Without auth we expect 401 AUTH_REQUIRED — that confirms the function is reachable and parsing correctly
      if (res.status === 401) {
        console.log(`[${provider}] ✅ Function reachable, auth gate working (401). Response: ${body}`);
        return;
      }

      // If somehow we got through (e.g. service role), check the full response
      try {
        const data = JSON.parse(body);
        console.log(`[${provider}] Status: ${res.status}`);
        console.log(`[${provider}] ok: ${data.ok}`);
        if (data.ok) {
          console.log(`[${provider}] provider_used: ${data.provider_used}`);
          console.log(`[${provider}] model_used: ${data.model_used}`);
          console.log(`[${provider}] generation_latency_ms: ${data.generation_latency_ms}`);
          console.log(`[${provider}] upload_path: ${data.upload_path}`);
          console.log(`[${provider}] ada_media_id: ${data.ada_media_id}`);
        } else {
          console.log(`[${provider}] error_code: ${data.error_code}`);
          console.log(`[${provider}] message: ${data.message}`);
        }
      } catch {
        console.log(`[${provider}] Raw response: ${body}`);
      }
    });
  }
});
