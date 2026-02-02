import { useNavigate, useParams } from "react-router-dom";
import { FileText, Palette, Search, Rocket, LayoutGrid, ArrowLeft, Eye } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EditorSection = "overview" | "content" | "appearance" | "seo" | "publish";

interface EditorSidebarProps {
  activeSection: EditorSection;
  onSectionChange: (section: EditorSection) => void;
  surfaceTitle?: string;
}

const sections = [
  { id: "overview" as const, label: "Overview", icon: FileText },
  { id: "content" as const, label: "Content", icon: LayoutGrid, comingSoon: true },
  { id: "appearance" as const, label: "Appearance", icon: Palette, comingSoon: true },
  { id: "seo" as const, label: "SEO", icon: Search, comingSoon: true },
  { id: "publish" as const, label: "Publish", icon: Rocket },
];

export function EditorSidebar({ activeSection, onSectionChange, surfaceTitle }: EditorSidebarProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handlePreview = () => {
    if (id) {
      navigate(`/s/${id}/preview`);
    }
  };

  return (
    <Sidebar collapsible="none" className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-border p-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
        {surfaceTitle && (
          <h2 className="font-semibold text-foreground mt-2 truncate">{surfaceTitle}</h2>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Editor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton
                    onClick={() => !section.comingSoon && onSectionChange(section.id)}
                    isActive={activeSection === section.id}
                    className={cn(
                      section.comingSoon && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={section.comingSoon}
                  >
                    <section.icon className="h-4 w-4" />
                    <span>{section.label}</span>
                    {section.comingSoon && (
                      <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Preview Button */}
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="w-full justify-start gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Surface
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">⌘B</kbd> to toggle sidebar
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
