import { useState } from "react";
import {
  Sparkles,
  MessageSquare,
  LayoutList,
  Link2,
  FileText,
  Wand2,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Props {
  onSelect: (mode: string) => void;
}

const ITEMS = [
  {
    key: "auto",
    icon: Sparkles,
    label: "Auto",
    badge: "Default",
    desc: "Magic from topics, library, and profile",
    color: "text-purple-400",
    bg: "bg-purple-500/15",
  },
  {
    key: "describe",
    icon: MessageSquare,
    label: "Describe Your Post",
    desc: "Generate from a prompt",
    color: "text-accent",
    bg: "bg-accent/15",
  },
  {
    key: "topics",
    icon: LayoutList,
    label: "From Topics",
    desc: "Pick specific topics to generate from",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
  },
  {
    key: "website",
    icon: Link2,
    label: "From Website",
    desc: "Paste a link to a blog, article, or webpage",
    color: "text-green-400",
    bg: "bg-green-500/15",
  },
  {
    key: "file",
    icon: FileText,
    label: "From File",
    desc: "Generate posts from a library file",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
  },
];

export function CreateWithAIMenu({ onSelect }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          Create with AI
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-1">
        {ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onClick={() => onSelect(item.key)}
            className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0 mt-0.5`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] text-muted-foreground">({item.badge})</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">{item.desc}</p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onSelect("improve")}
          className="px-3 py-2 cursor-pointer"
        >
          <span className="text-sm text-muted-foreground">Improve Posts…</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
