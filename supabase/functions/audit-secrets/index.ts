import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const sk = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const pk = Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? '';
  const shot = Deno.env.get('SHOTSTACK_ENV') ?? '';
  const tag = (v: string) => {
    if (!v) return { present: false };
    return { present: true, prefix: v.slice(0, 8), length: v.length };
  };
  return new Response(JSON.stringify({
    STRIPE_SECRET_KEY: tag(sk),
    STRIPE_PUBLISHABLE_KEY: tag(pk),
    SHOTSTACK_ENV: { present: !!shot, value: shot },
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});