import { useState, useCallback } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { Loader2, Users, Store } from "lucide-react";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";

const COMMUNITY_FLOWS = [
  {
    key: "listing",
    icon: Store,
    title: "List on Community",
    description:
      "Create a listing surface for your courses, services, or products. Publish it as an independent URL and optionally feature it on the Community explore page.",
    surfaceType: "community_listing",
    slug: "my-listing",
    seedSections: [
      { type: "hero", schema: { headline: "Welcome", subheadline: "Discover what we offer" } },
      { type: "text", schema: { heading: "Our Offer", body: "" } },
      { type: "cta", schema: { label: "Get Started", href: "" } },
      { type: "faq", schema: { items: [] } },
    ],
  },
  {
    key: "group",
    icon: Users,
    title: "Create a Community",
    description:
      "Launch a branded community space for your organisation or audience. Members can join, engage, and grow together.",
    surfaceType: "community_group",
    slug: "my-community",
    seedSections: [
      { type: "hero", schema: { headline: "Our Community", subheadline: "Join us" } },
      { type: "text", schema: { heading: "About", body: "" } },
      { type: "text", schema: { heading: "Plans", body: "" } },
      { type: "cta", schema: { label: "Join Now", href: "" } },
    ],
  },
];

export default function DashboardCommunityPage() {
  const { initAndNavigate } = useBuilderSurfaceInit();
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  const handleCreate = useCallback(
    async (flow: (typeof COMMUNITY_FLOWS)[number]) => {
      if (creatingKey) return; // in-flight lock
      setCreatingKey(flow.key);
      try {
        await initAndNavigate({
          surfaceType: flow.surfaceType,
          slug: flow.slug,
          title: flow.title,
          seedSections: flow.seedSections as { type: string; schema: Record<string, unknown> }[],
        });
      } finally {
        setCreatingKey(null);
      }
    },
    [creatingKey, initAndNavigate],
  );

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community</h1>
        <p className="text-muted-foreground mt-1">
          Create listings or launch your own branded community — both powered by the Builder.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {COMMUNITY_FLOWS.map((flow) => {
          const Icon = flow.icon;
          const isBusy = creatingKey === flow.key;
          const isDisabled = creatingKey !== null;
          return (
            <Card key={flow.key} className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{flow.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{flow.description}</p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreate(flow);
                }}
                disabled={isDisabled}
                className="w-full"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up…
                  </>
                ) : (
                  flow.title
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
