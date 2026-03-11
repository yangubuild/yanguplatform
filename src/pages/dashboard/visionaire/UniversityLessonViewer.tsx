import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { MASTER_LIBRARY_LESSONS } from "@/data/university/master-library-lessons";
import { MASTERCLASS_COURSES } from "@/data/university/masterclass-courses";

export default function UniversityLessonViewer() {
  const { slug, lessonIndex, courseSlug } = useParams<{
    slug: string;
    lessonIndex: string;
    courseSlug: string;
  }>();
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  // New route: /university/:slug/course/:courseSlug
  if (courseSlug) {
    const course = MASTERCLASS_COURSES.find((c) => c.slug === courseSlug);

    if (!course) {
      return (
        <VisionairePageContainer>
          <div className="py-20 text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Course not found</h1>
            <Link to={`/dashboard/visionaire/university/${slug}`}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Masterclass
              </Button>
            </Link>
          </div>
        </VisionairePageContainer>
      );
    }

    // For "How to use Master Library" (id: 1), use the existing lessons
    if (course.id === 1) {
      const lessons = MASTER_LIBRARY_LESSONS;
      const idx = 0;
      const currentLesson = lessons[idx];

      return (
        <VisionairePageContainer>
          <div className="flex gap-0 min-h-[80vh]">
            {/* Sidebar */}
            <aside className="w-64 shrink-0 border-r border-border pr-6 hidden md:block">
              <Link
                to={`/dashboard/visionaire/university/${slug}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Masterclass
              </Link>

              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Progress
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {lessons.length > 0
                    ? Math.round((completedLessons.size / lessons.length) * 100)
                    : 0}
                  %
                </span>
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
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground">
                  Lesson 1 of {lessons.length}
                </span>
                {currentLesson?.readTime && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    ⏱ {currentLesson.readTime}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {currentLesson?.title}
              </h1>

              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                {currentLesson?.content}
              </div>

              <div className="mt-12 border border-border rounded-xl px-6 py-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Finished reading? Mark this lesson as complete.
                </span>
                <Button
                  variant={completedLessons.has(0) ? "outline" : "destructive"}
                  className="gap-2"
                  onClick={() =>
                    setCompletedLessons((prev) => {
                      const next = new Set(prev);
                      next.add(0);
                      return next;
                    })
                  }
                  disabled={completedLessons.has(0)}
                >
                  {completedLessons.has(0) ? (
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
            </main>
          </div>
        </VisionairePageContainer>
      );
    }

    // For other courses, show a "coming soon" placeholder with course info
    return (
      <VisionairePageContainer>
        <div className="space-y-8 pb-12">
          <Link
            to={`/dashboard/visionaire/university/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Masterclass
          </Link>

          {/* Course Hero */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="relative w-full aspect-[21/9] md:aspect-[21/7] bg-muted overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80 backdrop-blur border border-border">
                    <BookOpen className="h-3.5 w-3.5" /> {course.lessons} Lessons
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80 backdrop-blur border border-border">
                    {course.level}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {course.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="max-w-3xl">
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
          </div>

          <div className="border-t border-border" />

          {/* Lessons list placeholder */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Lessons</h2>
            <div className="space-y-2">
              {Array.from({ length: course.lessons }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-border bg-card text-sm text-muted-foreground"
                >
                  <Lock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  <span>Lesson {i + 1}</span>
                  <span className="ml-auto text-xs text-muted-foreground/60">Coming soon</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </VisionairePageContainer>
    );
  }

  // Legacy route: /university/:slug/lessons/:lessonIndex
  const idx = Number(lessonIndex ?? 0);

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

  const progress =
    lessons.length > 0 ? Math.round((completedLessons.size / lessons.length) * 100) : 0;

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
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Progress
            </span>
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

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {currentLesson.title}
          </h1>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            {currentLesson.content}
          </div>

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
