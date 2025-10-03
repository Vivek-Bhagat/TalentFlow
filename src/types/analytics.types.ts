/**
 * Dashboard and analytics types
 */

import type { Job } from "./database.types";

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  interviewsScheduled: number;
}

export interface RecentActivity {
  id: string;
  type:
    | "job_created"
    | "candidate_applied"
    | "interview_scheduled"
    | "offer_extended";
  title: string;
  description: string;
  timestamp: Date;
}

export interface PipelineStats {
  stage: string;
  count: number;
  percentage: number;
}

// For HiringChart component
export interface ChartData {
  date: string;
  hired: number;
  rejected: number;
}

// For PipelineChart component
export interface PipelineData {
  stage: string;
  candidates: number;
  fill: string;
}

// For JobAnalytics component
export interface AnalyticsData {
  totalViews: number;
  totalApplications: number;
  averageConversionRate: number;
  topPerformingJobs: Array<{
    job: Job;
    views: number;
    applications: number;
    conversionRate: number;
  }>;
  departmentStats: Array<{
    department: string;
    jobs: number;
    applications: number;
    averageSalary: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}
