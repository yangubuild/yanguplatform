import { useParams, Link } from "react-router-dom";
import { useLearningCourseWithLessons, useMyLessonProgress, useMarkLessonProgress } from "@/hooks/useLearning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Circle, Clock, FileText, Loader2, PlayCircle, FileQuestion, ClipboardList, PenTool } from "lucide-react";
import { useState } from "react";
import type { LearningLesson } from "@/hooks/useLearning";

const LESSON_ICONS: Record<string, React.ElementType> = {
  video: PlayCircle,
  text: FileText,
  pdf: FileText,
  quiz: FileQuestion,
  checklist: ClipboardList,
  assignment: PenTool,
};

export default function AgencyLearningCourse() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { data: course, isLoading } = useLearningCourseWithLessons(courseSlug);
  const { data: progress } = useMyLessonProgress(course?.id);
  const markProgress = useMarkLessonProgress();
  const [activeLesson, setActiveLesson] = useState<LearningLesson | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Course not found.</p>
        <Link to="/learning" className="text-sm text-accent hover:underline mt-2 inline-block">← Back to Learning</Link>
      </div>
    );
  }

  const lessons = course.lessons ?? [];
  const progressMap = new Map((progress ?? []).map(p => [p.lesson_id, p]));
  const completedCount = [...progressMap.values()].filter(p => p.status === "completed").length;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const handleMarkComplete = async (lessonId: string) => {
    await markProgress.mutateAsync({
      lessonId,
      status: "completed",
      percentComplete: 100,
    });
  };

  const handleStartLesson = (lesson: LearningLesson) => {
    setActiveLesson(lesson);
    if (!progressMap.has(lesson.id)) {
      markProgress.mutate({
        lessonId: lesson.id,
        status: "in_progress",
        percentComplete: 0,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/learning" className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Learning
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">{course.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{course.description}</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Course Progress</span>
            <span className="text-sm text-muted-foreground">{completedCount}/{lessons.length} lessons</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Lesson sidebar */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground mb-2">Lessons</h2>
          {lessons.map((lesson, idx) => {
            const lp = progressMap.get(lesson.id);
            const isComplete = lp?.status === "completed";
            const isActive = activeLesson?.id === lesson.id;
            const Icon = LESSON_ICONS[lesson.lesson_type] ?? FileText;

            return (
              <button
                key={lesson.id}
                onClick={() => handleStartLesson(lesson)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors border ${
                  isActive
                    ? "border-accent bg-accent/5"
                    : "border-transparent hover:bg-muted/50"
                }`}
              >
                <div className="shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isComplete ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {idx + 1}. {lesson.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground capitalize">{lesson.lesson_type}</span>
                    {lesson.duration_minutes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />{lesson.duration_minutes}m
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Lesson content */}
        <Card className="min-h-[400px]">
          {activeLesson ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{activeLesson.title}</CardTitle>
                      <Badge variant="outline" className="text-[10px] capitalize">{activeLesson.lesson_type}</Badge>
                    </div>
                    {activeLesson.description && (
                      <p className="text-sm text-muted-foreground mt-1">{activeLesson.description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Content body */}
                {activeLesson.content_body ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: activeLesson.content_body }} />
                ) : activeLesson.content_url ? (
                  activeLesson.lesson_type === "video" ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe src={activeLesson.content_url} className="w-full h-full" allowFullScreen title={activeLesson.title} />
                    </div>
                  ) : (
                    <a href={activeLesson.content_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm">
                      Open resource →
                    </a>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Lesson content will be available soon.</p>
                  </div>
                )}

                {/* Mark complete button */}
                {progressMap.get(activeLesson.id)?.status !== "completed" && (
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      onClick={() => handleMarkComplete(activeLesson.id)}
                      disabled={markProgress.isPending}
                      variant="accent"
                      size="sm"
                    >
                      {markProgress.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                      )}
                      Mark as Complete
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full py-24 text-center">
              <PlayCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Select a lesson to begin</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
