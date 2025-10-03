import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

export const redirectRoutes: RouteObject[] = [
  {
    path: "/jobs",
    element: (
      <Navigate
        to="/app/jobs"
        replace
      />
    ),
  },
  {
    path: "/candidates",
    element: (
      <Navigate
        to="/app/candidates/kanban"
        replace
      />
    ),
  },
  {
    path: "/dashboard",
    element: (
      <Navigate
        to="/app/dashboard"
        replace
      />
    ),
  },
];
