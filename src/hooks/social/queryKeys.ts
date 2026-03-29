/**
 * YANGU Social Media — Query Key Factory
 * Consistent query key strategy for all social media queries.
 */

export const socialKeys = {
  all: ["social"] as const,

  // Workspace
  workspace: () => [...socialKeys.all, "workspace"] as const,
  workspaceDetail: (id: string) => [...socialKeys.workspace(), id] as const,

  // Onboarding
  onboarding: () => [...socialKeys.all, "onboarding"] as const,

  // Connected Accounts
  accounts: () => [...socialKeys.all, "accounts"] as const,
  accountsByWorkspace: (wsId: string) => [...socialKeys.accounts(), wsId] as const,

  // Posts
  posts: () => [...socialKeys.all, "posts"] as const,
  postsList: (filters: Record<string, unknown>) => [...socialKeys.posts(), "list", filters] as const,
  postDetail: (id: string) => [...socialKeys.posts(), id] as const,
  postCounts: () => [...socialKeys.posts(), "counts"] as const,

  // Calendar
  calendar: (month: string) => [...socialKeys.all, "calendar", month] as const,

  // Analytics
  analytics: () => [...socialKeys.all, "analytics"] as const,
  analyticsSummary: (range: string) => [...socialKeys.analytics(), "summary", range] as const,
  analyticsReady: () => [...socialKeys.analytics(), "ready"] as const,

  // Library
  library: () => [...socialKeys.all, "library"] as const,
  libraryList: (filters?: Record<string, unknown>) => [...socialKeys.library(), "list", filters] as const,

  // Topics
  topics: () => [...socialKeys.all, "topics"] as const,
  topicCategories: () => [...socialKeys.topics(), "categories"] as const,

  // Brand / AI Profile
  brandProfile: () => [...socialKeys.all, "brand-profile"] as const,

  // Home summary
  homeSummary: () => [...socialKeys.all, "home-summary"] as const,
};
