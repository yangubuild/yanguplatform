import { useLearningTracks } from "@/hooks/useLearning";
import { useRoles } from "@/hooks/useRoles";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight, Clock, Loader2, CheckCircle2 } from "lucide-react";

/**
 * Quick Start — lightweight role-based guides.
 * NOT a school. Each track is 2–5 micro-lessons, <15 minutes total.
 */
export default function AgencyLearning() {
  const { data: tracks, isLoading: tracksLoading } = useLearningTracks();
  const { agencyRoles } = useRoles();

  if (tracksLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter tracks relevant to user's roles
  const relevantTracks = (tracks ?? []).filter(track => {
    if (track.role_target.length === 0) return true;
    return track.role_target.some(r => agencyRoles.includes(r as never));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Quick Start</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))] mt-1">
          Get operational in under 15 minutes. Short, actionable guides for your role.
        </p>
      </div>

      {/* How it works */}
      <Card className="border border-border bg-accent/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">2–5</p>
              <p className="text-xs text-muted-foreground">min per lesson</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">3–4</p>
              <p className="text-xs text-muted-foreground">lessons per track</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{"<15"}</p>
              <p className="text-xs text-muted-foreground">min total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracks */}
      {relevantTracks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No guides available for your role yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {relevantTracks.map(track => (
            <Link key={track.id} to={`/learning/${track.slug}`}>
              <Card className="hover:border-accent/40 transition-colors cursor-pointer border border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                    <BookOpen className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-foreground">{track.title}</p>
                      {track.is_required && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{track.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* FAQ */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Common Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground">How do I earn commissions?</p>
            <p className="text-muted-foreground text-xs mt-0.5">Phase 1: $1 per KYC-verified user (active 7+ days). Phase 2: $4/month per active subscriber.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">What is KYC?</p>
            <p className="text-muted-foreground text-xs mt-0.5">Know Your Customer — users scan their ID and take a selfie via Didit to verify their identity.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">When do I get paid?</p>
            <p className="text-muted-foreground text-xs mt-0.5">Commissions are calculated monthly. Request payouts from the Payouts page — agency admin approves.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
