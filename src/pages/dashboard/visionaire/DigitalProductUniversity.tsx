import { useState, useMemo } from "react";
import { Search, GraduationCap, BookOpen, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VisionaireGrid } from "@/components/visionaire/VisionaireGrid";
import { useVisionaireItems } from "@/hooks/useVisionaireItems";

const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;

export default function DigitalProductUniversity() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const { data: items, isLoading } = useVisionaireItems("university");

  const filtered = useMemo(() => {
    if (!items) return [];
    let list = items;
    if (level !== "all") list = list.filter((i) => (i.content as any)?.level === level);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return list;
  }, [items, level, search]);

  const totalCourses = items?.length || 0;
  const totalLessons = items?.reduce((sum, i) => sum + ((i.content as any)?.lessons || 0), 0) || 0;
  const levelCounts = useMemo(() => {
    if (!items) return { beginner: 0, intermediate: 0, advanced: 0 };
    return items.reduce(
      (acc, i) => {
        const l = (i.content as any)?.level;
        if (l && l in acc) acc[l as keyof typeof acc]++;
        return acc;
      },
      { beginner: 0, intermediate: 0, advanced: 0 }
    );
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Digital Product University</h1>
        <p className="text-sm text-muted-foreground mt-1">Structured courses to master digital product creation</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={GraduationCap} label="Courses" value={totalCourses} />
        <StatCard icon={BookOpen} label="Total Lessons" value={totalLessons} />
        <StatCard icon={BarChart3} label="Beginner" value={levelCounts.beginner} />
        <StatCard icon={BarChart3} label="Advanced" value={levelCounts.advanced} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {LEVELS.map((l) => (
            <Badge key={l} variant={level === l ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => setLevel(l)}>
              {l}
            </Badge>
          ))}
        </div>
      </div>

      <VisionaireGrid items={filtered} isLoading={isLoading} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
