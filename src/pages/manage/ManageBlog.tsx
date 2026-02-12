import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, PenTool, Mic, Headphones, Video, LayoutGrid } from "lucide-react";
import { BlogOrganizeTab } from "@/components/manage/blog/BlogOrganizeTab";
import { BlogListenTab } from "@/components/manage/blog/BlogListenTab";
import { BlogWatchTab } from "@/components/manage/blog/BlogWatchTab";
import { BlogWriteTab } from "@/components/manage/blog/BlogWriteTab";
import { BlogReadTab } from "@/components/manage/blog/BlogReadTab";
import { BlogSpeakTab } from "@/components/manage/blog/BlogSpeakTab";
import { AdaAiPanel } from "@/components/manage/blog/AdaAiPanel";
import { useRoles } from "@/hooks/useRoles";

const tabs = [
  { value: "organize", label: "Organize", icon: LayoutGrid },
  { value: "read", label: "Read", icon: BookOpen },
  { value: "write", label: "Write", icon: PenTool },
  { value: "speak", label: "Speak", icon: Mic },
  { value: "listen", label: "Listen", icon: Headphones },
  { value: "watch", label: "Watch", icon: Video },
] as const;

export default function ManageBlog() {
  const { isAdmin } = useRoles();

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Blog Control Center</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage sections, content, and layout for the public blog.
          </p>
        </div>

        <Tabs defaultValue="organize" className="w-full">
          <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 h-auto flex-wrap">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="gap-1.5 data-[state=active]:bg-background px-3 py-2 text-xs"
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="organize" className="mt-4">
            <BlogOrganizeTab />
          </TabsContent>
          <TabsContent value="read" className="mt-4">
            <BlogReadTab />
          </TabsContent>
          <TabsContent value="write" className="mt-4">
            <BlogWriteTab />
          </TabsContent>
          <TabsContent value="speak" className="mt-4">
            <BlogSpeakTab />
          </TabsContent>
          <TabsContent value="listen" className="mt-4">
            <BlogListenTab />
          </TabsContent>
          <TabsContent value="watch" className="mt-4">
            <BlogWatchTab />
          </TabsContent>
        </Tabs>
      </div>

      {isAdmin && <AdaAiPanel />}
    </div>
  );
}
