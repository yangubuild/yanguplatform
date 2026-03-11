import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { MASTER_LIBRARY_LESSONS } from "@/data/university/master-library-lessons";
import { MASTERCLASS_COURSES } from "@/data/university/masterclass-courses";

export default function UniversityLessonViewer() {
  const { slug, lessonIndex, courseSlug, courseLessonIndex } = useParams<{
    slug: string;
    lessonIndex: string;
    courseSlug: string;
    courseLessonIndex: string;
  }>();
  const navigate = useNavigate();
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  // ── Course route: /university/:slug/course/:courseSlug(/lesson/:courseLessonIndex) ──
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

    const courseLessons = course.lessonsList;
    const idx = courseLessonIndex !== undefined ? Number(courseLessonIndex) : 0;
    const currentLesson = courseLessons[idx];
    const basePath = `/dashboard/visionaire/university/${slug}/course/${courseSlug}`;

    // For course 1, we have rich content from MASTER_LIBRARY_LESSONS
    const richContent = course.id === 1 ? MASTER_LIBRARY_LESSONS[idx] : null;

    const progress =
      courseLessons.length > 0
        ? Math.round((completedLessons.size / courseLessons.length) * 100)
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
              <ArrowLeft className="h-4 w-4" /> Back to Masterclass
            </Link>

            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Progress
              </span>
              <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
            </div>

            <nav className="space-y-1">
              {courseLessons.map((lesson, i) => {
                const isActive = i === idx;
                const isComplete = completedLessons.has(i);
                return (
                  <Link
                    key={lesson.id}
                    to={`${basePath}/lesson/${i}`}
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
                    <span className="line-clamp-2">{lesson.title}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 md:pl-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground">
                Lesson {idx + 1} of {courseLessons.length}
              </span>
              {richContent?.readTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  ⏱ {richContent.readTime}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {currentLesson?.title}
            </h1>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              {richContent ? (
                richContent.content
              ) : currentLesson?.description ? (
                <p className="text-muted-foreground text-base leading-relaxed">
                  {currentLesson.description}
                </p>
              ) : null}
            </div>

            {/* Mark complete + navigation */}
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

            {/* Prev / Next buttons */}
            <div className="mt-6 flex items-center justify-between">
              {idx > 0 ? (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(`${basePath}/lesson/${idx - 1}`)}
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </Button>
              ) : (
                <div />
              )}
              {idx < courseLessons.length - 1 ? (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(`${basePath}/lesson/${idx + 1}`)}
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <div />
              )}
            </div>

            {/* Mobile nav */}
            <div className="md:hidden mt-8 border-t border-border pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Lessons</p>
              <nav className="space-y-1">
                {courseLessons.map((lesson, i) => (
                  <Link
                    key={lesson.id}
                    to={`${basePath}/lesson/${i}`}
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

  // ── Legacy route: /university/:slug/lessons/:lessonIndex ──
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
