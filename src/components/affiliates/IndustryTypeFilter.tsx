import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INDUSTRIES = [
  "All",
  "Trading",
  "Sports Betting",
  "Fitness",
  "Health And Wellness",
  "Ecommerce",
  "Reselling",
  "Social Media",
  "Ai",
  "Business",
  "Personal Development",
  "Sales",
  "Real Estate",
  "Agencies",
  "Restaurants",
  "Shops",
  "Personal Finance",
  "Video Games",
  "Dating",
  "Spirituality",
  "Travel",
  "Careers",
  "Software",
  "Other",
] as const;

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function IndustryTypeFilter({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="flex items-center gap-1.5 px-3 py-1 h-auto rounded-full border border-dashed border-white/20 bg-transparent text-xs text-muted-foreground hover:text-muted-foreground transition-colors w-auto focus:ring-0 focus:ring-offset-0 [&>svg]:text-muted-foreground">
        <Plus className="w-3 h-3 text-muted-foreground mr-1" />
        <SelectValue placeholder="Industry type" />
      </SelectTrigger>
      <SelectContent className="bg-[#1a1a1a] border-white/10 text-foreground max-h-[360px]">
        {INDUSTRIES.map((industry) => (
          <SelectItem
            key={industry}
            value={industry}
            className="text-sm text-muted-foreground hover:text-foreground focus:bg-white/10 focus:text-foreground cursor-pointer"
          >
            {industry}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
