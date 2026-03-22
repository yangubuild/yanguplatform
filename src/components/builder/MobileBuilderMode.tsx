import { useState } from "react";
import { LayoutGrid, Pencil, Settings, Rocket, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { EditorSection } from "@/hooks/useBuilderEditor";
import type { BuilderSurfaceType } from "@/types/builder";
import type { PageEditSettings } from "@/config/builderCoreSections";

export type MobilePanel = "none" | "sections" | "editor" | "settings" | "publish";

interface MobileBuilderToolbarProps {
  onOpenPanel: (panel: MobilePanel) => void;
  activePanel: MobilePanel;
}

export function MobileBuilderToolbar({ onOpenPanel, activePanel }: MobileBuilderToolbarProps) {
  const items = [
    { key: "sections" as const, icon: LayoutGrid, label: "Sections" },
    { key: "editor" as const, icon: Pencil, label: "Edit" },
    { key: "settings" as const, icon: Settings, label: "Settings" },
    { key: "publish" as const, icon: Rocket, label: "Publish" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around lg:hidden"
      style={{
        height: 56,
        background: "hsl(var(--background))",
        borderTop: "1px solid hsl(var(--border))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {items.map((item) => {
        const active = activePanel === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onOpenPanel(item.key)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

interface MobileBuilderSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function MobileBuilderSheet({ open, onClose, title, children }: MobileBuilderSheetProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="fixed inset-0 z-50 flex flex-col p-0 m-0 max-w-none max-h-none h-full w-full rounded-none border-0 lg:hidden [&>button]:hidden"
        style={{ background: "hsl(var(--background))" }}>
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{
            height: 48,
            borderBottom: "1px solid hsl(var(--border))" }}>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function MobileBuilderDesktopNotice() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="lg:hidden flex items-center gap-2 px-3 py-2 text-xs"
      style={{
        background: "hsl(var(--muted))",
        borderBottom: "1px solid hsl(var(--border))",
        color: "hsl(var(--muted-foreground))" }}>
      <Monitor className="w-3.5 h-3.5 shrink-0" />
      <span>For complex editing, best experience on iPad or desktop</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-auto text-[10px] font-medium shrink-0"
        style={{ color: "hsl(var(--foreground))" }}>
        Dismiss
      </button>
    </div>
  );
}
