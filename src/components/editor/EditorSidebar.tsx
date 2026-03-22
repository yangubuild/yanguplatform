import { useNavigate, useParams } from "react-router-dom";
import { FileText, Palette, Search, Rocket, LayoutGrid, ArrowLeft, Eye, LogOut, User } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

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
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePreview = () => {
    if (id) {
      navigate(`/s/${id}/preview`);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      toast({
        title: "Logout failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar collapsible="none" className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-border p-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
                    disabled={section.comingSoon}>
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
              className="w-full justify-start gap-2">
              <Eye className="h-4 w-4" />
              Preview Surface
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        {/* User Menu with Logout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <User className="h-4 w-4" />
              <span className="truncate text-sm">{user?.email || "Account"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/kyc")}>
              <FileText className="h-4 w-4 mr-2" />
              KYC Verification
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/billing")}>
              <Rocket className="h-4 w-4 mr-2" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <p className="text-xs text-muted-foreground mt-2">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">⌘B</kbd> to toggle sidebar
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
