import type { RouteObject } from "react-router-dom";
import { publicRoutes } from "./publicRoutes";
import { redirectRoutes } from "./redirectRoutes";
import { appRoutes } from "./appRoutes";

export const routes: RouteObject[] = [
  ...publicRoutes.filter((route) => route.path !== "*"), // Exclude catch-all route for now
  ...redirectRoutes,
  ...appRoutes,
  ...publicRoutes.filter((route) => route.path === "*"), // Add catch-all route at the end
];

// Export individual route groups for flexibility
export { publicRoutes } from "./publicRoutes";
export { redirectRoutes } from "./redirectRoutes";
export { appRoutes } from "./appRoutes";

// Export route constants and utilities
export { ROUTES, getCandidateProfileRoute, routeMetadata } from "./constants";
export type { RouteMetadata } from "./constants";
