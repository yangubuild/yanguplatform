import { useState } from "react";
import { Link2, Sparkles, Coins } from "lucide-react";
import { Card, PrimaryButton } from "@/components/primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatifyTemplates } from "@/hooks/useCreatifyTemplates";

const CONTENT_TYPES = [
  { id: "video_ad", label: "Video Ad" },
  { id: "image_ad", label: "Image Ad" },
  { id: "ugc_video", label: "UGC-style Video" },
  { id: "carousel", label: "Carousel" },
  { id: "copy", label: "Copy & CTAs" },
];

const PLATFORMS = [
  { id: "meta", label: "Meta (Facebook & Instagram)" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube_shorts", label: "YouTube Shorts" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "pinterest", label: "Pinterest" },
  { id: "google_display", label: "Google Display" },
];

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "fr", label: "French" },
  { id: "sw", label: "Swahili" },
  { id: "lg", label: "Luganda" },
];

interface StudioCreateFormProps {
  onSubmit: (data: StudioFormData) => void;
  isLoading?: boolean;
  creditCost?: number;
}

export interface StudioFormData {
  productUrl: string;
  brandName: string;
  brandDescription: string;
  contentTypes: string[];
  platforms: string[];
  language: string;
  templateId?: string;
}

/**
 * StudioCreateForm - Form for creating new Studio projects
 * 
 * LOCKED BEHAVIOR:
 * - Shows "Generation uses credits" label
 * - NO Publish button, NO domain selector, NO KYC trigger, NO subscription gate
 */
export function StudioCreateForm({ onSubmit, isLoading, creditCost = 1 }: StudioCreateFormProps) {
  const [productUrl, setProductUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [contentTypes, setContentTypes] = useState<string[]>(["video_ad", "image_ad"]);
  const [platforms, setPlatforms] = useState<string[]>(["meta"]);
  const [language, setLanguage] = useState("en");
  const [templateId, setTemplateId] = useState<string>("");
  const { data: templates, isLoading: templatesLoading } = useCreatifyTemplates();

  const handleContentTypeToggle = (typeId: string) => {
    setContentTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((t) => t !== typeId)
        : [...prev, typeId]
    );
  };

  const handlePlatformToggle = (platformId: string) => {
    setPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      productUrl,
      brandName,
      brandDescription,
      contentTypes,
      platforms,
      language,
      templateId: templateId || undefined,
    });
  };

  const isValid = productUrl.trim() && contentTypes.length > 0 && platforms.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Link Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Link2 className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Product Link</h3>
          </div>
          <Input
            type="url"
            placeholder="Paste your product link (shop, marketplace, social...)"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            className="text-base"
          />
          <p className="text-sm text-muted-foreground">
            AI will scrape and analyze your product to create brand-native content.
          </p>
        </div>
      </Card>

      {/* Optional Brand Info */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Brand Details (Optional)</h3>
          <p className="text-sm text-muted-foreground">
            Leave empty to auto-detect from your product link.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="Auto-detect if empty"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="brandDescription">Short Description</Label>
            <Textarea
              id="brandDescription"
              placeholder="Auto-generate if empty"
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Content Types */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold">What to Generate</h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">

            {CONTENT_TYPES.map((type) => (
              <label
                key={type.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-elevated cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={contentTypes.includes(type.id)}
                  onCheckedChange={() => handleContentTypeToggle(type.id)}
                />
                <span className="text-sm font-medium">{type.label}</span>
              </label>
            ))}
          </div>

          {/* Template dropdown */}
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template">
                <SelectValue placeholder={templatesLoading ? "Loading…" : "Auto (no template)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Auto (no template)</SelectItem>
                {(templates || []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Target Platforms */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Target Platforms</h3>
          <p className="text-sm text-muted-foreground">
            AI will auto-resize and format for each platform.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {PLATFORMS.map((platform) => (
              <label
                key={platform.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-elevated cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={platforms.includes(platform.id)}
                  onCheckedChange={() => handlePlatformToggle(platform.id)}
                />
                <span className="text-sm font-medium">{platform.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Submit with credit warning */}
      <Card className="p-6 border-warning/30 bg-warning/5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <PrimaryButton
            type="submit"
            size="lg"
            disabled={!isValid || isLoading}
            className="w-full sm:w-auto"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {isLoading ? "Generating..." : "Generate Content"}
          </PrimaryButton>
          
          <div className="flex items-center gap-2 text-sm text-warning">
            <Coins className="h-4 w-4" />
            <span><strong>Generation uses credits</strong> — costs {creditCost} credit{creditCost !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </Card>
    </form>
  );
}
