import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Square, RectangleHorizontal, RectangleVertical } from "lucide-react";

interface Props {
  model: string;
  onModelChange: (v: string) => void;
  orientation: string;
  onOrientationChange: (v: string) => void;
  count: string;
  onCountChange: (v: string) => void;
  onGenerate: () => void;
}

export function ImageAdsBottomBar({
  model, onModelChange,
  orientation, onOrientationChange,
  count, onCountChange,
  onGenerate,
}: Props) {
  return (
    <div className="sticky bottom-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3 max-w-5xl mx-auto gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Model */}
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="w-[170px] h-9 rounded-lg bg-card border-border/60 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="design-pro">Design Pro</SelectItem>
              <SelectItem value="design-master">
                <span className="flex items-center gap-1.5">
                  Design Master
                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent leading-none">NEW</span>
                </span>
              </SelectItem>
              <SelectItem value="nano-banana">Nano Banana</SelectItem>
            </SelectContent>
          </Select>

          {/* Orientation */}
          <Select value={orientation} onValueChange={onOrientationChange}>
            <SelectTrigger className="w-[140px] h-9 rounded-lg bg-card border-border/60 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="square">
                <span className="flex items-center gap-1.5"><Square className="h-3 w-3" /> Square</span>
              </SelectItem>
              <SelectItem value="landscape">
                <span className="flex items-center gap-1.5"><RectangleHorizontal className="h-3 w-3" /> Landscape</span>
              </SelectItem>
              <SelectItem value="portrait">
                <span className="flex items-center gap-1.5"><RectangleVertical className="h-3 w-3" /> Portrait</span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Count */}
          <Select value={count} onValueChange={onCountChange}>
            <SelectTrigger className="w-[120px] h-9 rounded-lg bg-card border-border/60 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="4">4 images</SelectItem>
              <SelectItem value="10">10 images</SelectItem>
              <SelectItem value="20">20 images</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={onGenerate}
          className="h-9 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold gap-1.5 px-6">
          <Sparkles className="h-4 w-4" />
          Generate
        </Button>
      </div>
    </div>
  );
}
