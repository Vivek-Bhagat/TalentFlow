import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
// import type { Job, Candidate, Assessment } from "@/lib/database";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import HiringChart from "@/components/Dashboard/HiringChart";
import PipelineChart from "@/components/Dashboard/PipelineChart";

interface DashboardStats {
  activeJobs: number;
  totalCandidates: number;
  pendingAssessments: number;
  hireRate: number;
}

interface RecentActivity {
  id: string;
  type: "application" | "stage_change" | "assessment" | "hired" | "rejected";
  message: string;
  time: string;
  candidate: string;
  candidateId?: string;
}

interface PipelineStats {
  applied: number;
  screen: number;
  technical: number;
  offer: number;
  hired: number;
  rejected: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all necessary data in parallel
      const [jobsResponse, candidatesResponse] = await Promise.all([
        apiClient.getJobs({ pageSize: 1000 }),
        apiClient.getCandidates({ pageSize: 1000 }),
      ]);

      const jobs = jobsResponse.jobs;
      const candidates = candidatesResponse.candidates;

      // Calculate stats
      const activeJobs = jobs.filter((job) => job.status === "active").length;
      const totalCandidates = candidates.length;

      // Group candidates by stage
      const candidatesByStage = candidates.reduce((acc, candidate) => {
        acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pipelineData: PipelineStats = {
        applied: candidatesByStage.applied || 0,
        screen: candidatesByStage.screen || 0,
        technical: candidatesByStage.technical || 0,
        offer: candidatesByStage.offer || 0,
        hired: candidatesByStage.hired || 0,
        rejected: candidatesByStage.rejected || 0,
      };

      const totalInPipeline =
        pipelineData.applied +
        pipelineData.screen +
        pipelineData.technical +
        pipelineData.offer;
      const hireRate =
        totalInPipeline > 0
          ? Math.round(
              (pipelineData.hired /
                (pipelineData.hired + pipelineData.rejected)) *
                100
            )
          : 0;

      // Get recent activity (recent candidates sorted by updatedAt)
      const recentCandidates = candidates
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 4);

      const activity: RecentActivity[] = recentCandidates.map(
        (candidate, index) => {
          const timeDiff = Date.now() - new Date(candidate.updatedAt).getTime();
          const timeAgo = getTimeAgo(timeDiff);

          let type: RecentActivity["type"] = "application";
          let message = "";

          if (candidate.stage === "hired") {
            type = "hired";
            message = `Candidate hired for ${candidate.position}`;
          } else if (candidate.stage === "rejected") {
            type = "rejected";
            message = `Candidate rejected for ${candidate.position}`;
          } else if (candidate.stage === "offer") {
            type = "stage_change";
            message = `Candidate moved to offer stage for ${candidate.position}`;
          } else if (candidate.stage === "technical") {
            type = "stage_change";
            message = `Candidate moved to technical stage for ${candidate.position}`;
          } else if (candidate.stage === "screen") {
            type = "stage_change";
            message = `Candidate moved to screening for ${candidate.position}`;
          } else {
            type = "application";
            message = `New application for ${candidate.position}`;
          }

          return {
            id: `${candidate.id}-${index}`,
            type,
            message,
            time: timeAgo,
            candidate: candidate.name,
            candidateId: candidate.id,
          };
        }
      );

      setStats({
        activeJobs,
        totalCandidates,
        pendingAssessments: candidatesByStage.screen || 0, // Approximate pending assessments
        hireRate,
      });

      setPipelineStats(pipelineData);
      setRecentActivity(activity);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch dashboard data";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timeDiff: number): string => {
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "application":
        return <Users className="h-4 w-4 text-primary" />;
      case "stage_change":
        return <Activity className="h-4 w-4 text-warning" />;
      case "assessment":
        return <FileText className="h-4 w-4 text-accent" />;
      case "hired":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}>
          
          <Loader className="w-16 h-16  rounded-full animate-spin mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Loading Dashboard
          </h3>
          <p className="text-muted-foreground">
            Fetching your hiring pipeline data...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !stats || !pipelineStats) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Unable to load dashboard data
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Failed to load dashboard
            </h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={fetchDashboardData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsData = [
    {
      title: "Active Jobs",
      value: stats.activeJobs.toString(),
      change: `${stats.activeJobs > 0 ? "+" : ""}${stats.activeJobs} total`,
      icon: Briefcase,
      color: "text-primary",
      onClick: () => navigate("/app/jobs"),
    },
    {
      title: "Total Candidates",
      value: stats.totalCandidates.toLocaleString(),
      change: `${pipelineStats.applied} new applications`,
      icon: Users,
      color: "text-success",
      onClick: () => navigate("/app/candidates/list"),
    },
    {
      title: "In Pipeline",
      value: (
        pipelineStats.applied +
        pipelineStats.screen +
        pipelineStats.technical +
        pipelineStats.offer
      ).toString(),
      change: `${pipelineStats.screen} in screening`,
      icon: FileText,
      color: "text-warning",
      onClick: () => navigate("/app/candidates/kanban"),
    },
    {
      title: "Hire Rate",
      value: `${stats.hireRate}%`,
      change: `${pipelineStats.hired} hired, ${pipelineStats.rejected} rejected`,
      icon: TrendingUp,
      color: "text-success",
      onClick: () => navigate("/app/candidates/list"),
    },
  ];

  return (
    <motion.div
      className="px-6 space-y-6 pb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your hiring pipeline.
          </p>
        </div> */}
        <div className="flex gap-2">
          {/* <Button
            variant="outline"
            onClick={() => navigate("/app/jobs")}>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button> */}
          {/* <Button onClick={() => navigate("/app/assessments")}>
            <FileText className="mr-2 h-4 w-4" />
            Create Assessment
          </Button> */}
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}>
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              <Card
                className="card-hover cursor-pointer"
                onClick={stat.onClick}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {stat.change}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Content Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}>
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Activity
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/app/candidates/list")}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() =>
                      activity.candidateId &&
                      navigate(`/app/candidates/${activity.candidateId}`)
                    }>
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.candidate} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hiring Pipeline */}
        <PipelineChart />
      </motion.div>
      {/* Hiring Trends Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}>
        <HiringChart />
      </motion.div>
    </motion.div>
  );
}
