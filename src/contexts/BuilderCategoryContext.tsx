/**
 * BuilderCategoryContext — Phase 1 Category Lock.
 *
 * Populated by BuilderEditorRouter from builder_surfaces.surface_type.
 * Exposes a Readonly<CategoryDefinition>. No setter. The category is
 * LOCKED for the lifetime of the build flow and propagates to every
 * downstream consumer (chat, voice, asset upload, logo gen, template
 * select, editor shell/panel).
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  type BuilderCategory,
  type CategoryDefinition,
  assertCategoryLocked,
  getCategory,
} from "@/lib/builder/categoryRegistry";

interface BuilderCategoryContextValue {
  category: Readonly<CategoryDefinition>;
  surfaceId: string;
  assertLocked: (incoming: BuilderCategory | undefined | null, where: string) => void;
}

const BuilderCategoryContext = createContext<BuilderCategoryContextValue | null>(null);

export interface BuilderCategoryProviderProps {
  surfaceId: string;
  categoryKey: BuilderCategory;
  children: ReactNode;
}

export function BuilderCategoryProvider({
  surfaceId,
  categoryKey,
  children,
}: BuilderCategoryProviderProps) {
  const category = getCategory(categoryKey);
  if (!category) {
    throw new Error(
      `[CATEGORY LOCK] BuilderCategoryProvider received unknown category "${categoryKey}". ` +
        `Valid keys: eshop|estore|emenu|esite|influencer|community.`,
    );
  }

  const value = useMemo<BuilderCategoryContextValue>(
    () => ({
      category,
      surfaceId,
      assertLocked: (incoming, where) =>
        assertCategoryLocked(category.key, incoming ?? null, where),
    }),
    [category, surfaceId],
  );

  return (
    <BuilderCategoryContext.Provider value={value}>{children}</BuilderCategoryContext.Provider>
  );
}

export function useBuilderCategory(): BuilderCategoryContextValue {
  const ctx = useContext(BuilderCategoryContext);
  if (!ctx) {
    throw new Error(
      "[CATEGORY LOCK] useBuilderCategory() called outside <BuilderCategoryProvider>. " +
        "Every builder flow must run inside the provider mounted by BuilderEditorRouter.",
    );
  }
  return ctx;
}

export function useBuilderCategoryOptional(): BuilderCategoryContextValue | null {
  return useContext(BuilderCategoryContext);
}