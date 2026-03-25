import { useLearningTracks, useMyEnrollments, useMyCourseCompletions, useMyCertificates } from "@/hooks/useLearning";
import { useRoles } from "@/hooks/useRoles";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, GraduationCap, ChevronRight, Loader2 } from "lucide-react";

export default function AgencyLearning() {
  const { data: tracks, isLoading: tracksLoading } = useLearningTracks();
  const { data: enrollments } = useMyEnrollments();
  const { data: completions } = useMyCourseCompletions();
  const { data: certificates } = useMyCertificates();
  const { agencyRoles } = useRoles();

  if (tracksLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const enrolledTrackIds = new Set((enrollments ?? []).filter(e => e.track_id).map(e => e.track_id));
  const completedCourseIds = new Set((completions ?? []).map(c => c.course_id));
  const certCount = (certificates ?? []).length;

  // Filter tracks relevant to user's roles
  const relevantTracks = (tracks ?? []).filter(track => {
    if (track.role_target.length === 0) return true;
    return track.role_target.some(r => agencyRoles.includes(r as never));
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learning Center</h1>
        <p className="text-muted-foreground mt-1">Master your role with structured training and certification</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{enrolledTrackIds.size}</p>
              <p className="text-xs text-muted-foreground">Enrolled Tracks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
              <GraduationCap className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedCourseIds.size}</p>
              <p className="text-xs text-muted-foreground">Courses Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10">
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{certCount}</p>
              <p className="text-xs text-muted-foreground">Certificates Earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Tracks */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Learning Tracks</h2>
        {relevantTracks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No learning tracks available yet.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Tracks will appear here once assigned by your agency admin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {relevantTracks.map(track => {
              const isEnrolled = enrolledTrackIds.has(track.id);
              return (
                <Link key={track.id} to={`/learning/${track.slug}`}>
                  <Card className="hover:border-accent/40 transition-colors cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{track.title}</CardTitle>
                            {track.is_required && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
                            )}
                            {isEnrolled && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Enrolled</Badge>
                            )}
                          </div>
                          <CardDescription className="line-clamp-2">{track.description}</CardDescription>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </CardHeader>
                    {isEnrolled && (
                      <CardContent className="pt-0">
                        <Progress value={0} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1.5">0% complete</p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Certificates shortcut */}
      {certCount > 0 && (
        <div>
          <Link to="/certificates" className="text-sm text-accent hover:underline flex items-center gap-1">
            <Award className="h-4 w-4" />
            View all certificates ({certCount})
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
