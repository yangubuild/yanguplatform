import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { MASTER_LIBRARY_LESSONS } from "@/data/university/master-library-lessons";

export default function UniversityLessonViewer() {
  const { slug, lessonIndex } = useParams<{ slug: string; lessonIndex: string }>();
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  const idx = Number(lessonIndex ?? 0);

  // For now only master-library-masterclass has lesson content
  if (slug !== "master-library-masterclass") {
    return (
      <VisionairePageContainer>
        <div className="py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Lessons coming soon</h1>
          <Link to={`/dashboard/visionaire/university/${slug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Course
            </Button>
          </Link>
        </div>
      </VisionairePageContainer>
    );
  }

  const lessons = MASTER_LIBRARY_LESSONS;
  const currentLesson = lessons[idx];

  if (!currentLesson) {
    return (
      <VisionairePageContainer>
        <div className="py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Lesson not found</h1>
          <Link to={`/dashboard/visionaire/university/${slug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Course
            </Button>
          </Link>
        </div>
      </VisionairePageContainer>
    );
  }

  const progress = lessons.length > 0
    ? Math.round((completedLessons.size / lessons.length) * 100)
    : 0;

  const handleMarkComplete = () => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  };

  return (
    <VisionairePageContainer>
      <div className="flex gap-0 min-h-[80vh]">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border pr-6 hidden md:block">
          <Link
            to={`/dashboard/visionaire/university/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Master Library Masterclass
          </Link>

          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</span>
            <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
          </div>

          <nav className="space-y-1">
            {lessons.map((lesson, i) => {
              const isActive = i === idx;
              const isComplete = completedLessons.has(i);
              return (
                <Link
                  key={i}
                  to={`/dashboard/visionaire/university/${slug}/lessons/${i}`}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : isActive ? (
                    <div className="h-4 w-4 rounded-full bg-foreground shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  )}
                  {lesson.title}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:pl-10 max-w-3xl">
          {/* Lesson meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground">
              Lesson {idx + 1} of {lessons.length}
            </span>
            {currentLesson.readTime && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                ⏱ {currentLesson.readTime}
              </span>
            )}
          </div>

          {/* Lesson title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {currentLesson.title}
          </h1>

          {/* Lesson body */}
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            {currentLesson.content}
          </div>

          {/* Mark complete */}
          <div className="mt-12 border border-border rounded-xl px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Finished reading? Mark this lesson as complete.
            </span>
            <Button
              variant={completedLessons.has(idx) ? "outline" : "destructive"}
              className="gap-2"
              onClick={handleMarkComplete}
              disabled={completedLessons.has(idx)}
            >
              {completedLessons.has(idx) ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Completed
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" /> Mark Complete
                </>
              )}
            </Button>
          </div>

          {/* Mobile nav */}
          <div className="md:hidden mt-8 border-t border-border pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Lessons</p>
            <nav className="space-y-1">
              {lessons.map((lesson, i) => (
                <Link
                  key={i}
                  to={`/dashboard/visionaire/university/${slug}/lessons/${i}`}
                  className={`block px-3 py-2 rounded-lg text-sm ${
                    i === idx ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {lesson.title}
                </Link>
              ))}
            </nav>
          </div>
        </main>
      </div>
    </VisionairePageContainer>
  );
}
