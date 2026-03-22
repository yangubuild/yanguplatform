import { useMemo } from "react";
import { BookOpen, GraduationCap, ArrowRight, ExternalLink, Bookmark } from "lucide-react";
import { useVisionaireSaves, useVisionaireItems } from "@/hooks/useVisionaireItems";
import { useNavigate } from "react-router-dom";

// Static university courses — same source as DigitalProductUniversity.tsx
const UNIVERSITY_COURSES = [
  {
    slug: "master-library-masterclass",
    title: "Master Library Masterclass",
    lessons: 5,
    level: "Beginner",
    route: "/dashboard/visionaire/university/master-library-masterclass",
  },
  {
    slug: "starting-an-online-business",
    title: "Starting an Online Business",
    lessons: 7,
    level: "Beginner",
    route: "/dashboard/visionaire/university/master-library-masterclass/course/online-business-master-plan",
  },
  {
    slug: "choosing-the-right-platform",
    title: "Choosing the Right Platform",
    lessons: 4,
    level: "Beginner",
    route: "/dashboard/visionaire/university/master-library-masterclass/course/platforms-guide",
  },
  {
    slug: "building-your-sales-funnel",
    title: "Building Your Sales Funnel",
    lessons: 6,
    level: "Intermediate",
    route: "/dashboard/visionaire/university/master-library-masterclass/course/funnel-guide",
  },
  {
    slug: "pricing-your-digital-products",
    title: "Pricing Your Digital Products",
    lessons: 5,
    level: "Intermediate",
    route: "/dashboard/visionaire/university/master-library-masterclass/course/pricing-guide",
  },
  {
    slug: "ai-powered-content-writing",
    title: "AI-Powered Content Writing",
    lessons: 8,
    level: "Intermediate",
    route: "/dashboard/visionaire/university/master-library-masterclass/course/copywriting-guide",
  },
  {
    slug: "creating-stunning-product-visuals",
    title: "Creating Stunning Product Visuals",
    lessons: 6,
    level: "Advanced",
    route: "/dashboard/visionaire/university/master-library-masterclass/course/visuals-guide",
  },
];

function LevelBadge({ level }: { level: string }) {
  const color =
    level === "Beginner"
      ? "rgba(34,197,94,0.15)"
      : level === "Intermediate"
      ? "rgba(234,179,8,0.15)"
      : "rgba(239,68,68,0.15)";
  const text =
    level === "Beginner"
      ? "hsl(142 71% 45%)"
      : level === "Intermediate"
      ? "hsl(45 93% 47%)"
      : "hsl(0 84% 60%)";

  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: color, color: text }}
    >
      {level}
    </span>
  );
}

export function CoursesPanel() {
  const navigate = useNavigate();
  const { data: saves, isLoading: savesLoading } = useVisionaireSaves();
  const { data: courseItems, isLoading: itemsLoading } = useVisionaireItems(["courses", "ebooks"]);

  // Saved visionaire learning items
  const savedLearning = useMemo(() => {
    if (!saves) return [];
    return saves
      .map((s) => s.visionaire_items)
      .filter(Boolean)
      .filter((item: any) =>
        ["courses", "ebooks", "guides", "templates"].includes(item.category)
      );
  }, [saves]);

  const isLoading = savesLoading || itemsLoading;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <GraduationCap className="w-5 h-5" style={{ color: "#E67E22" }} />
        <h2 className="text-base font-bold text-foreground">Courses</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
        {/* ── Visionaire University ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Visionaire University
              </h3>
            </div>
            <button
              onClick={() => navigate("/dashboard/visionaire/university")}
              className="text-[11px] font-medium flex items-center gap-1 transition-colors hover:text-foreground"
              style={{ color: "#E67E22" }}
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {UNIVERSITY_COURSES.map((course) => (
              <button
                key={course.slug}
                onClick={() => navigate(course.route)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors hover:bg-white/[0.04]"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(230,126,34,0.12)" }}
                >
                  <GraduationCap className="w-4 h-4" style={{ color: "#E67E22" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {course.lessons} lessons
                  </p>
                </div>
                <LevelBadge level={course.level} />
              </button>
            ))}
          </div>
        </section>

        {/* ── Saved Learning Items ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saved Learning Materials
            </h3>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                />
              ))}
            </div>
          ) : savedLearning.length === 0 ? (
            <div
              className="rounded-lg px-4 py-6 text-center"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Bookmark className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                No saved learning materials yet.
              </p>
              <button
                onClick={() => navigate("/dashboard/visionaire")}
                className="text-xs font-medium mt-2 inline-flex items-center gap-1"
                style={{ color: "#E67E22" }}
              >
                Browse Visionaire <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {savedLearning.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/dashboard/visionaire/item/${item.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors hover:bg-white/[0.04]"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      {item.type} · {item.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Community Courses (placeholder — no course surface type exists yet) ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Community Courses
            </h3>
          </div>
          <div
            className="rounded-lg px-4 py-6 text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <GraduationCap className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Community course creation is coming soon.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
