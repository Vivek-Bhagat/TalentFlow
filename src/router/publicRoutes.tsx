import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

// Lazy load public pages
const Landing = lazy(() => import("../pages/landing/Landing"));
const NotFound = lazy(() => import("../pages/not-found"));
const LoginPage = lazy(() => import("@/pages/signup/Signup"));
export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/signup",
    element: <LoginPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
