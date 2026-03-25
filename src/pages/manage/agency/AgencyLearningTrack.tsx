import { useParams, Link } from "react-router-dom";
import { useLearningTrackWithCourses, useMyCourseCompletions } from "@/hooks/useLearning";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Clock, Loader2 } from "lucide-react";

export default function AgencyLearningTrack() {
  const { trackSlug } = useParams<{ trackSlug: string }>();
  const { data: track, isLoading } = useLearningTrackWithCourses(trackSlug);
  const { data: completions } = useMyCourseCompletions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Track not found.</p>
        <Link to="/learning" className="text-sm text-accent hover:underline mt-2 inline-block">← Back to Learning</Link>
      </div>
    );
  }

  const completedCourseIds = new Set((completions ?? []).map(c => c.course_id));
  const courses = track.courses ?? [];
  const completedCount = courses.filter(c => completedCourseIds.has(c.id)).length;
  const progressPct = courses.length > 0 ? Math.round((completedCount / courses.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Link to="/learning" className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Learning
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground">{track.title}</h1>
          {track.is_required && <Badge variant="destructive" className="text-[10px]">Required</Badge>}
        </div>
        <p className="text-muted-foreground">{track.description}</p>
      </div>

      {/* Track progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Track Progress</span>
            <span className="text-sm text-muted-foreground">{completedCount}/{courses.length} courses</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">{progressPct}% complete</p>
        </CardContent>
      </Card>

      {/* Course list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Courses</h2>
        {courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-muted-foreground">No courses in this track yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {courses.map((course, idx) => {
              const isCompleted = completedCourseIds.has(course.id);
              return (
                <Link key={course.id} to={`/learning/course/${course.slug}`}>
                  <Card className={`hover:border-accent/40 transition-colors cursor-pointer ${isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">{course.title}</CardTitle>
                            {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                            {course.is_tot_eligible && <Badge variant="outline" className="text-[10px] px-1.5 py-0">TOT</Badge>}
                          </div>
                          <CardDescription className="text-xs line-clamp-1 mt-0.5">{course.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {course.estimated_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{course.estimated_minutes}m
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
