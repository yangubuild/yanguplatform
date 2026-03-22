import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisionaireGrid } from "@/components/visionaire/VisionaireGrid";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useVisionaireItems } from "@/hooks/useVisionaireItems";

const POPULAR_TAGS = ["Content Creation", "Artificial Intelligence", "Productivity Guides", "Marketing", "Business"];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "ebooks", label: "Ebooks" },
  { value: "audio", label: "Audio" },
  { value: "bundles", label: "Bundles" },
  { value: "business_podcast", label: "Business Podcast" },
  { value: "checklists", label: "Checklists" },
  { value: "courses", label: "Courses" },
  { value: "guide", label: "Guide" },
  { value: "prompts", label: "Prompts" },
  { value: "templates", label: "Templates" },
  { value: "toolstack", label: "Toolstack" },
  { value: "video_learning", label: "Video Learning" },
  
  { value: "workbook", label: "Workbook" },
] as const;

const FORMAT_OPTIONS = ["all", "ebook", "course", "template", "mockup", "deal", "tool", "audio", "podcast", "checklist", "guide", "prompt", "video", "workbook", "bundle"] as const;
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title A-Z" },
] as const;

export default function VisionaireHome() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  // Fetch all relevant categories
  const allCategories = categoryFilter === "all"
    ? ["master_library", "university", "evergreen", "ebooks", "audio", "bundles", "business_podcast", "checklists", "courses", "guide", "prompts", "templates", "toolstack", "video_learning", "workbook"]
    : [categoryFilter];
  const { data: items, isLoading } = useVisionaireItems(allCategories);

  const filtered = useMemo(() => {
    if (!items) return [];
    let list = [...items];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    // Format filter
    if (formatFilter !== "all") {
      list = list.filter((i) => i.type === formatFilter);
    }

    // Sort
    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    // newest is default order from DB

    return list;
  }, [items, search, formatFilter, sortBy]);

  const handleTagClick = (tag: string) => {
    setSearch(tag);
  };

  return (
    <VisionairePageContainer>
      <div className="space-y-6">
        {/* Hero Explore Section */}
        <div className="text-center py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Let's find your next winning product
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Browse {items?.length || 0} proven digital assets trusted by entrepreneurs worldwide.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-full"
          />
        </div>

        {/* Popular Tags */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Popular:</span>
          {POPULAR_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-accent/50 transition-colors text-xs"
              onClick={() => handleTagClick(tag)}>
              {tag}
            </Badge>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Filter by Format" />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((f) => (
                <SelectItem key={f} value={f} className="capitalize text-xs">
                  {f === "all" ? "All Formats" : f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <VisionaireGrid items={filtered} isLoading={isLoading} />
      </div>
    </VisionairePageContainer>
  );
}
