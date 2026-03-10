import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth: require authenticated user ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ ok: false, error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, query, placeId } = await req.json();

    if (action === "autocomplete" && query) {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      
      const predictions = (data.predictions || []).map((p: any) => ({
        placeId: p.place_id,
        name: p.structured_formatting?.main_text || p.description,
        address: p.structured_formatting?.secondary_text || "",
        description: p.description,
      }));

      return new Response(JSON.stringify({ ok: true, results: predictions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "details" && placeId) {
      const fields = "name,formatted_address,formatted_phone_number,website,types,photos,opening_hours,editorial_summary,url";
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const r = data.result || {};

      // Build photo URLs from photo references (up to 10 photos)
      const photos: string[] = [];
      if (r.photos && Array.isArray(r.photos)) {
        for (const photo of r.photos.slice(0, 10)) {
          if (photo.photo_reference) {
            photos.push(
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photo.photo_reference}&key=${apiKey}`
            );
          }
        }
      }

      // Map Google place types to readable category
      const typeMap: Record<string, string> = {
        restaurant: "Restaurant",
        cafe: "Café",
        bar: "Bar",
        store: "Store",
        clothing_store: "Clothing Store",
        electronics_store: "Electronics Store",
        hair_care: "Hair & Beauty",
        beauty_salon: "Beauty Salon",
        gym: "Gym & Fitness",
        lodging: "Hotel & Lodging",
        real_estate_agency: "Real Estate",
        car_dealer: "Auto Dealer",
        food: "Food & Drink",
        bakery: "Bakery",
        supermarket: "Supermarket",
        pharmacy: "Pharmacy",
        hospital: "Hospital",
        school: "School",
      };
      const rawTypes = r.types || [];
      const category = rawTypes.map((t: string) => typeMap[t]).find(Boolean) || rawTypes[0] || "";

      // Editorial summary / description
      const description = r.editorial_summary?.overview || "";

      return new Response(JSON.stringify({
        ok: true,
        place: {
          name: r.name || "",
          address: r.formatted_address || "",
          phone: r.formatted_phone_number || "",
          website: r.website || "",
          category,
          description,
          photos,
          googleMapsUrl: r.url || "",
          placeId,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
