/**
 * Profile Commerce Section — shows the user's published surfaces
 * (products/services) on their profile page.
 *
 * Fetches from searchable_entities where owner_user_id matches.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import CommerceCard from "@/components/commerce/CommerceCard";
import type { CommerceItem } from "@/types/commerce";
import { Package } from "lucide-react";

interface Props {
  userId: string;
  onMessageSeller?: (userId: string) => void;
}

export default function ProfileCommerceSection({ userId, onMessageSeller }: Props) {
  const navigate = useNavigate();

  const { data: items, isLoading } = useQuery({
    queryKey: ["profile-commerce", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("searchable_entities")
        .select("id, title, short_description, entity_type, primary_category, cover_image_url, slug, is_verified, domain_host, owner_user_id")
        .eq("owner_user_id", userId)
        .eq("is_published", true)
        .in("entity_type", ["product", "service", "business"])
        .order("updated_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []).map((e): CommerceItem => ({
        kind: e.entity_type === "service" ? "service" : "product",
        id: e.id,
        title: e.title,
        description: e.short_description,
        price_label: null,
        image_url: e.cover_image_url,
        owner_name: null,
        owner_avatar: null,
        category: e.primary_category,
        link: e.domain_host ? `https://${e.domain_host}` : (e.slug ? `/${e.entity_type}/${e.slug}` : null),
        slug: e.slug,
        is_verified: e.is_verified,
      }));
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="py-12 text-center">
        <Package className="w-8 h-8 mx-auto mb-2" className="text-muted-foreground" />
        <p className="text-sm" className="text-muted-foreground">
          No products or services yet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => (
        <CommerceCard
          key={item.id}
          item={item}
          variant="full"
          onOpen={() => {
            if (item.link?.startsWith("http")) {
              window.open(item.link, "_blank");
            } else if (item.link) {
              navigate(item.link);
            }
          }}
          onMessage={onMessageSeller ? () => onMessageSeller(userId) : undefined}
        />
      ))}
    </div>
  );
}
