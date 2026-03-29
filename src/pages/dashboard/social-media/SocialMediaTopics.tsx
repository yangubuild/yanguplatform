import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, MoreVertical, GripVertical, Download, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSocialTopics } from "@/hooks/social/useSocialTopics";
import { useSocialTopicCategories } from "@/hooks/social/useSocialTopicCategories";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { useSocialBrandProfile } from "@/hooks/social/useSocialBrandProfile";
import { useAITopicGeneration } from "@/hooks/social/useAITopicGeneration";
import { toast } from "sonner";
import { TopicEditorModal } from "@/components/social-media/topics/TopicEditorModal";
import { TopicCategoryModal } from "@/components/social-media/topics/TopicCategoryModal";
import { TopicImportModal } from "@/components/social-media/topics/TopicImportModal";
import type { SocialTopicCategory, SocialTopic } from "@/types/socialMedia";

export default function SocialMediaTopics() {
  const { workspace } = useSocialWorkspace();
  const { topics, createTopic, updateTopic, deleteTopic, bulkCreate, isCreating } = useSocialTopics(workspace?.id);
  const { categories, createCategory, updateCategory, deleteCategory } = useSocialTopicCategories(workspace?.id);
  const { profile } = useSocialBrandProfile(workspace?.id);
  const { generateTopics, isGenerating } = useAITopicGeneration();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SocialTopicCategory | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | undefined>();

  const toggleExpand = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const topicsForCategory = (catId: string) => topics.filter((t) => t.category_id === catId);
  const uncategorizedTopics = topics.filter((t) => !t.category_id);

  const handleToggleTopic = async (topic: SocialTopic) => {
    try {
      await updateTopic({ id: topic.id, enabled: !topic.enabled });
    } catch { toast.error("Failed to update topic"); }
  };

  const handleToggleCategory = async (cat: SocialTopicCategory) => {
    try {
      await updateCategory({ id: cat.id, enabled: !cat.enabled });
    } catch { toast.error("Failed to update category"); }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await deleteCategory(catId);
      toast.success("Category deleted");
    } catch { toast.error("Failed to delete category"); }
  };

  const handleGenerateFromCategory = async (cat: SocialTopicCategory) => {
    const meta = (profile?.metadata || {}) as Record<string, unknown>;
    const result = await generateTopics({
      business_name: meta.business_name,
      industry: meta.industry,
      business_description: meta.business_description,
      target_audience: profile?.target_audience,
    });
    if (result) {
      const matching = result.find((c) => c.title.toLowerCase().includes(cat.title.toLowerCase()));
      const topicsToCreate = matching?.topics || result[0]?.topics || [];
      if (topicsToCreate.length > 0) {
        await bulkCreate(topicsToCreate.map((t) => ({ ...t, category_id: cat.id, source_type: "ai_generated" })));
        toast.success(`Generated ${topicsToCreate.length} topics`);
        setExpandedCategories((prev) => new Set(prev).add(cat.id));
      }
    }
  };

  const handleSaveTopic = async (data: { title: string; description?: string; category_id?: string }) => {
    try {
      await createTopic(data);
      toast.success("Topic created");
      setShowTopicModal(false);
    } catch { toast.error("Failed to create topic"); }
  };

  const handleSaveCategory = async (data: { title: string; color?: string }) => {
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, ...data });
        toast.success("Category updated");
      } else {
        await createCategory(data);
        toast.success("Category created");
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
    } catch { toast.error("Failed to save category"); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Topics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Topics are the talking points for your posts, they bring variety and direction to your content.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
            <Download className="w-4 h-4 mr-1.5" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> New Category
          </Button>
          <Button size="sm" onClick={() => { setDefaultCategoryId(undefined); setShowTopicModal(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> New Topic
          </Button>
        </div>
      </div>

      {/* Category list */}
      <div className="mt-6 space-y-3">
        {categories.map((cat) => {
          const catTopics = topicsForCategory(cat.id);
          const enabledCount = catTopics.filter((t) => t.enabled).length;
          const isExpanded = expandedCategories.has(cat.id);

          return (
            <div key={cat.id} className="border border-border rounded-xl bg-card overflow-hidden">
              {/* Category header */}
              <div
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleExpand(cat.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color || "#9CA3AF" }}
                  />
                  <div>
                    <span className="text-sm font-semibold text-foreground">{cat.title}</span>
                    <p className="text-xs text-muted-foreground">{enabledCount}/{catTopics.length} Enabled Topics</p>
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setDefaultCategoryId(cat.id); setShowTopicModal(true); }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleCategory(cat)}>
                        {cat.enabled ? "Disable Topics" : "Enable Topics"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGenerateFromCategory(cat)} disabled={isGenerating}>
                        Generate from Category
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }}>
                        Edit Category
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                        Delete Category
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Topic rows */}
              {isExpanded && catTopics.length > 0 && (
                <div className="border-t border-border">
                  {catTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{topic.title}</p>
                        {topic.description && (
                          <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteTopic(topic.id)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Switch
                          checked={topic.enabled}
                          onCheckedChange={() => handleToggleTopic(topic)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && catTopics.length === 0 && (
                <div className="border-t border-border px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No topics yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleGenerateFromCategory(cat)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Generating..." : "Generate Topics"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {/* Uncategorized */}
        {uncategorizedTopics.length > 0 && (
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="px-4 py-3.5">
              <span className="text-sm font-semibold text-foreground">Uncategorized</span>
              <p className="text-xs text-muted-foreground">{uncategorizedTopics.length} Topics</p>
            </div>
            <div className="border-t border-border">
              {uncategorizedTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{topic.title}</p>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
                    )}
                  </div>
                  <Switch checked={topic.enabled} onCheckedChange={() => handleToggleTopic(topic)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {categories.length === 0 && uncategorizedTopics.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <SlidersHorizontal className="w-8 h-8 text-accent/60" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">No topics yet</h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Add your website URL in AI Profile to auto-generate topics, or create them manually.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}>
                New Category
              </Button>
              <Button size="sm" onClick={() => setShowTopicModal(true)}>
                New Topic
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TopicEditorModal
        open={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        onSave={handleSaveTopic}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        isSaving={isCreating}
      />

      <TopicCategoryModal
        open={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
        onSave={handleSaveCategory}
        editing={editingCategory}
      />

      <TopicImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        categories={categories}
      />
    </div>
  );
}
