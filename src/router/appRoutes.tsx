import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";

// Lazy load all page components for better code splitting
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Jobs = lazy(() => import("../pages/job/Jobs"));
const JobDetail = lazy(() => import("../pages/job/JobDetail"));
const JobCandidatesKanban = lazy(
  () => import("../pages/kanban/JobCandidatesKanban")
);
const CandidatesKanban = lazy(() => import("../pages/kanban/CandidatesKanban"));
const CandidateProfile = lazy(
  () => import("../pages/candidate/CandidateProfile")
);
const CandidatesList = lazy(() => import("../pages/candidate/CandidatesList"));
const Assessments = lazy(() => import("../pages/assessment/Assessment"));

export const appRoutes: RouteObject[] = [
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "jobs",
        element: <Jobs />,
      },
      {
        path: "jobs/:id",
        element: <JobDetail />,
      },
      {
        path: "jobs/:id/candidates",
        element: <JobCandidatesKanban />,
      },
      {
        path: "candidates/list",
        element: <CandidatesList />,
      },
      {
        path: "candidates/kanban",
        element: <CandidatesKanban />,
      },
      {
        path: "candidates/:id",
        element: <CandidateProfile />,
      },
      {
        path: "assessments",
        element: <Assessments />,
      },
      {
        path: "analytics",
        element: <Dashboard />,
      },
      {
        path: "settings",
        element: <Dashboard />,
      },
    ],
  },
];
