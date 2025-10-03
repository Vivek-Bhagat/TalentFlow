/**
 * Router and navigation types
 */

// Route path constants for type-safe navigation
export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/signup",

  // Redirect routes (legacy)
  LEGACY_JOBS: "/jobs",
  LEGACY_CANDIDATES: "/candidates",
  LEGACY_DASHBOARD: "/dashboard",

  // App routes
  APP: "/app",
  DASHBOARD: "/app/dashboard",
  JOBS: "/app/jobs",
  CANDIDATES_LIST: "/app/candidates/list",
  CANDIDATES_KANBAN: "/app/candidates/kanban",
  CANDIDATE_PROFILE: "/app/candidates/:id",
  ASSESSMENTS: "/app/assessments",
  ANALYTICS: "/app/analytics",
  SETTINGS: "/app/settings",
} as const;

// Route metadata for navigation menus
export interface RouteMetadata {
  path: string;
  title: string;
  description?: string;
  icon?: string;
  requiresAuth?: boolean;
  showInNavigation?: boolean;
}
