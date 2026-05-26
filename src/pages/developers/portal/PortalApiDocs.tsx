import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BASE_URL = "https://yangu.io/api/v1";

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };
  return (
    <div className="relative group">
      <pre
        className="text-xs md:text-sm rounded-lg p-4 overflow-x-auto border border-white/10 bg-black/40 text-foreground font-mono leading-relaxed"
        data-lang={lang}>
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy">
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function Endpoint({
  method,
  path,
  title,
  description,
  request,
  response,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  description: string;
  request: string;
  response: string;
}) {
  const methodColor =
    method === "GET"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : method === "POST"
        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
        : "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${methodColor}`}>{method}</span>
        <code className="text-sm text-foreground font-mono">{path}</code>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Request</div>
          <CodeBlock code={request} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Response</div>
          <CodeBlock code={response} lang="json" />
        </div>
      </div>
    </section>
  );
}

export default function PortalApiDocs() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">API Documentation</h2>
        <p className="text-sm text-muted-foreground">
          REST API for Yangu — shops, AI, community and commerce. Version v1.
        </p>
      </div>

      {/* Auth */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-accent" />
          <h3 className="text-base font-semibold text-foreground">Authentication</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          All requests require a Bearer token. Test keys are prefixed with{" "}
          <code className="text-foreground font-mono text-xs px-1.5 py-0.5 rounded bg-white/5">yng_dev_</code>{" "}
          and live keys with{" "}
          <code className="text-foreground font-mono text-xs px-1.5 py-0.5 rounded bg-white/5">yng_live_</code>.
          Create one in{" "}
          <a href="/developers/portal/api-keys" className="underline text-accent">API Keys</a>.
        </p>
        <CodeBlock
          code={`# Base URL
${BASE_URL}

# Auth header
Authorization: Bearer yng_dev_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
        />
      </section>

      <Endpoint
        method="GET"
        path="/shops/:id"
        title="Get a shop"
        description="Returns public details of a shop by id or slug."
        request={`curl ${BASE_URL}/shops/cafe-juno \\
  -H "Authorization: Bearer yng_dev_..."`}
        response={`{
  "id": "8c3b...",
  "slug": "cafe-juno",
  "name": "Café Juno",
  "category": "restaurant",
  "currency": "KES",
  "is_open": true,
  "rating": 4.7
}`}
      />

      <Endpoint
        method="POST"
        path="/ada/chat"
        title="Talk to Ada (AI Assistant)"
        description="Stream or single-shot responses from Ada, the Yangu AI builder."
        request={`curl -X POST ${BASE_URL}/ada/chat \\
  -H "Authorization: Bearer yng_dev_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Suggest 3 menu items for a Nairobi coffee shop" }
    ],
    "model": "google/gemini-2.5-flash"
  }'`}
        response={`{
  "id": "msg_01H...",
  "model": "google/gemini-2.5-flash",
  "output": "1. Iced Vanilla Latte ...",
  "usage": { "input_tokens": 24, "output_tokens": 168 }
}`}
      />

      <Endpoint
        method="GET"
        path="/community/:id"
        title="Get a community"
        description="Returns community metadata, member count, and recent posts."
        request={`curl ${BASE_URL}/community/nairobi-creators \\
  -H "Authorization: Bearer yng_dev_..."`}
        response={`{
  "id": "f1e2...",
  "slug": "nairobi-creators",
  "name": "Nairobi Creators",
  "members": 1284,
  "is_public": true,
  "recent_posts": [
    { "id": "p_1", "title": "March meetup", "author": "@asha" }
  ]
}`}
      />

      <Endpoint
        method="POST"
        path="/products"
        title="Create a product"
        description="Create a product on a shop you own. Returns the new product id."
        request={`curl -X POST ${BASE_URL}/products \\
  -H "Authorization: Bearer yng_dev_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "shop_id": "8c3b...",
    "name": "Single Origin Espresso 250g",
    "price": 850,
    "currency": "KES",
    "stock": 40
  }'`}
        response={`{
  "id": "prod_01H...",
  "shop_id": "8c3b...",
  "name": "Single Origin Espresso 250g",
  "price": 850,
  "currency": "KES",
  "stock": 40,
  "created_at": "2026-05-26T12:34:56Z"
}`}
      />

      <p className="text-xs text-muted-foreground mt-8">
        Need more endpoints? Browse the full reference under{" "}
        <a href="/developers" className="underline text-accent">Developer Docs</a>.
      </p>
    </div>
  );
}