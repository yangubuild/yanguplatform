import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { MASTERCLASS_COURSES } from "@/data/university/masterclass-courses";

import masterLibraryImg from "@/assets/university/master-library-guide.webp";

export default function UniversityCourseDetail() {
  const { slug } = useParams<{ slug: string }>();

  // Only master-library-masterclass shows the courses grid
  if (slug !== "master-library-masterclass") {
    return (
      <VisionairePageContainer>
        <div className="py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Course not found</h1>
          <Link to="/dashboard/visionaire/university">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to University
            </Button>
          </Link>
        </div>
      </VisionairePageContainer>
    );
  }

  return (
    <VisionairePageContainer>
      <div className="space-y-8 pb-12">
        {/* Back link */}
        <Link
          to="/dashboard/visionaire/university"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to University
        </Link>

        {/* Hero Banner */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="relative w-full aspect-[21/9] md:aspect-[21/7]">
            <img
              src={masterLibraryImg}
              alt="Master Library Masterclass"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80 backdrop-blur border border-border">
                  <BookOpen className="h-3.5 w-3.5" /> 7 Courses
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80 backdrop-blur border border-border">
                  <BarChart3 className="h-3.5 w-3.5" /> Beginner → Intermediate
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Master Library Masterclass
              </h1>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="max-w-3xl">
          <p className="text-muted-foreground leading-relaxed">
            Everything you need to build a real digital product business — from navigating the library and customizing products, to launching, pricing, writing copy, and creating visuals that sell.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Courses Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MASTERCLASS_COURSES.map((course) => (
              <Link
                key={course.id}
                to={
                  course.comingSoon
                    ? "#"
                    : `/dashboard/visionaire/university/master-library-masterclass/course/${course.slug}`
                }
                className={`group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${
                  course.comingSoon ? "opacity-60 pointer-events-none" : ""
                }`}>
                {/* Course Image */}
                <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {course.comingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                      <span className="text-sm font-medium text-muted-foreground">Coming Soon</span>
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-md border border-border text-muted-foreground">
                      {course.level}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {course.lessons} lessons
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                  {!course.comingSoon && (
                    <div className="flex items-center gap-1 text-xs font-medium text-primary pt-1">
                      Start Course <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </VisionairePageContainer>
  );
}
