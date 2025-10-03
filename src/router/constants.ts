import { ROUTES, type RouteMetadata } from "@/types";

// Re-export for backward compatibility
export { ROUTES };
export type { RouteMetadata };

// Helper function to generate candidate profile route
export const getCandidateProfileRoute = (candidateId: string): string => {
  return ROUTES.CANDIDATE_PROFILE.replace(":id", candidateId);
};

export const routeMetadata: RouteMetadata[] = [
  {
    path: ROUTES.DASHBOARD,
    title: "Dashboard",
    description: "Overview and analytics",
    icon: "Home",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    path: ROUTES.JOBS,
    title: "Jobs",
    description: "Manage job postings",
    icon: "BriefcaseBusiness",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    path: ROUTES.CANDIDATES_LIST,
    title: "Candidates",
    description: "View and manage candidates",
    icon: "Users",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    path: ROUTES.ASSESSMENTS,
    title: "Assessments",
    description: "Create and manage assessments",
    icon: "FileText",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    path: ROUTES.ANALYTICS,
    title: "Analytics",
    description: "Performance metrics and insights",
    icon: "BarChart3",
    requiresAuth: true,
    showInNavigation: false, // Hidden for now
  },
  {
    path: ROUTES.SETTINGS,
    title: "Settings",
    description: "Application settings",
    icon: "Settings",
    requiresAuth: true,
    showInNavigation: false, // Hidden for now
  },
];
