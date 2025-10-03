import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import {
  ArrowLeft,
  Share2,
  Edit,
  Archive,
  RotateCcw,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Eye,
  TrendingUp,
  FileText,
  Calendar,
  Kanban,
  Building2,
  Target,
  Award,
  CheckCircle2,
  BarChart3,
  Globe,
  Sparkles,
  BriefcaseBusiness,
  Loader,
  Plus,
  ClipboardList,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job, Assessment } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  useEffect(() => {
    const fetchJob = async () => {
      if (!id) {
        setError("Job ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Since the API doesn't have a specific getJob endpoint, we'll fetch all jobs and find the one we need
        const response = await apiClient.getJobs({ page: 1, pageSize: 1000 });
        const foundJob = response.jobs.find((j) => j.id === id);

        if (!foundJob) {
          setError("Job not found");
        } else {
          setJob(foundJob);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch job";
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

    fetchJob();
  }, [id, toast]);

  // Fetch assessments for this job
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!id) return;

      try {
        setAssessmentsLoading(true);
        // Fetch assessments filtered by this job's ID
        const response = await apiClient.getAssessments({ jobId: id });
        // Additional client-side filter to ensure only assessments for this job are shown
        const jobAssessments = response.assessments.filter(
          (assessment) => assessment.jobId === id
        );
        console.log(
          `Loaded ${jobAssessments.length} assessment(s) for job ${id}`
        );
        setAssessments(jobAssessments);
      } catch (err) {
        console.error("Failed to fetch assessments:", err);
        setAssessments([]); // Set empty array on error
        toast({
          title: "Failed to Load Assessments",
          description: "Could not load assessments for this job.",
          variant: "destructive",
        });
      } finally {
        setAssessmentsLoading(false);
      }
    };

    if (activeTab === "assessment") {
      fetchAssessments();
    }
  }, [id, activeTab]);

  const handleBack = () => {
    navigate("/app/jobs");
  };

  const handleEdit = () => {
    // Navigate back to jobs page with edit mode - we'll implement this in the Jobs component
    navigate(`/app/jobs?edit=${job?.id}`);
  };

  const handleArchiveToggle = async () => {
    if (!job) return;

    const newStatus = job.status === "active" ? "archived" : "active";

    try {
      const updatedJob = await apiClient.updateJob(job.id, {
        status: newStatus,
      });
      setJob(updatedJob);

      toast({
        title: "Success",
        description: `Job ${
          newStatus === "active" ? "activated" : "archived"
        } successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${
          newStatus === "active" ? "activate" : "archive"
        } job`,
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!job) return;

    const jobUrl = `${window.location.origin}/app/jobs/${job.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job opportunity: ${job.title} at ${job.department}`,
          url: jobUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(jobUrl);
      toast({
        title: "Link Copied",
        description: "Job link has been copied to your clipboard",
      });
    }
  };

  const handleKanbanView = () => {
    navigate(`/app/jobs/${id}/candidates`);
  };

  const handleCreateAssessment = () => {
    navigate(`/app/assessments?job=${id}`);
  };

  const formatSalary = (min: number, max: number, currency: string) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };
    return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`;
  };

  // Mock analytics data
  const mockAnalytics = job
    ? {
        views: 1247,
        applications: job.applicationCount,
        conversionRate:
          job.applicationCount > 0
            ? Math.round((job.applicationCount / 1247) * 100)
            : 0,
        averageTimeToApply: "3.2 days",
        topSources: [
          {
            source: "LinkedIn",
            applications: Math.floor(job.applicationCount * 0.4),
          },
          {
            source: "Indeed",
            applications: Math.floor(job.applicationCount * 0.3),
          },
          {
            source: "Company Website",
            applications: Math.floor(job.applicationCount * 0.2),
          },
          {
            source: "Referrals",
            applications: Math.floor(job.applicationCount * 0.1),
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader className="h-18 w-18 animate-spin text-orange-500" />
          <span className="text-lg text-muted-foreground">
            Loading job details...
          </span>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {error || "Job not found"}
            </h3>
            <p className="text-base text-muted-foreground text-center mb-6">
              The job you're looking for doesn't exist or may have been removed.
            </p>
            <Button
              onClick={handleBack}
              className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      {/* Hero Header Section - Minimal */}
      <div className="relative bg-background border-b overflow-hidden">
        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2 ">
            {/* Back Button */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className=" hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="lg:hidden">Back</span>
                <span className="hidden lg:inline">Back to Jobs</span>
              </Button>
            </motion.div>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <motion.div
                className="flex-1 sm:flex-initial"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleKanbanView}
                  className="bg-background  w-full">
                  <Kanban className="mr-2 h-4 w-4 text-yellow-500" />
                  <span className="lg:hidden">Kanban</span>
                  <span className="hidden lg:inline">Kanban View</span>
                </Button>
              </motion.div>
              <motion.div className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="bg-background hover:bg-muted w-full">
                  <Share2 className="mr-2 h-4 w-4 text-purple-500" />
                  Share
                </Button>
              </motion.div>
              <motion.div className="flex-1 sm:flex-initial">
                {" "}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="bg-background hover:bg-muted w-full">
                  <Edit className="mr-2 h-4 w-4 text-green-500" />
                  Edit
                </Button>{" "}
              </motion.div>
              <motion.div className="flex-1 sm:flex-initial">
                {" "}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchiveToggle}
                  className="">
                  {job.status === "active" ? (
                    <>
                      <Archive className="mr-2 h-4 w-4 text-orange-500" />
                      Archive
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 text-green-500" />
                      Activate
                    </>
                  )}
                </Button>{" "}
              </motion.div>
            </div>
          </div>

          {/* Job Header Content */}
          <div className="space-y-3 border mt-2 rounded-2xl p-2 bg-gray-100 dark:bg-[#242424] hover:shadow-lg transition-shadow">
            {/* Title & Status */}
            <motion.div
              className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}>
              <div className="flex-1 space-y-3  items-center pt-2  rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <h1 className="text-3xl font-bold  mb-2 ">{job.title}</h1>
                    <div className="p-2 border rounded-lg">
                      <BriefcaseBusiness className="h-4 w-4 " />
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "text-sm font-medium px-3 py-1 rounded-4xl",
                          job.status === "active"
                            ? "bg-emerald-500/10 text-green-700 dark:text-white border border-emerald-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        )}>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-2xl mr-2",
                            job.status === "active"
                              ? "bg-green-500"
                              : "bg-gray-500"
                          )}
                        />
                        {job.status === "active" ? "Active" : "Archived"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Department & Tags */}
            <motion.div
              className="flex flex-wrap items-center gap-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}>
              <div className="flex items-center gap-2 px-4 py-2  rounded-full border ">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium ">{job.department}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.tags.slice(0, 5).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-muted/50 hover:bg-primary transition-colors">
                    {tag}
                  </Badge>
                ))}
                {job.tags.length > 5 && (
                  <Badge
                    variant="outline"
                    className="border-border">
                    +{job.tags.length - 5} more
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Key Info Cards Row */}
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-2 leading-loose rounded-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}>
              <div className="flex items-center gap-1.5  px-4 py-1">
                <div className=" rounded-md">
                  <MapPin className="h-7 w-7 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-blue-500">
                    {job.location}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Location
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5  px-4 py-1">
                <div className=" rounded-md">
                  <Clock className="h-7 w-7 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold capitalize truncate text-purple-500">
                    {job.type.replace("-", " ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Type
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5  px-4 py-1">
                <div className=" rounded-md">
                  <DollarSign className="h-7 w-7 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-green-600">
                    {formatSalary(
                      job.salary.min,
                      job.salary.max,
                      job.salary.currency
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Salary
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5  px-4 py-1">
                <div className=" rounded-md">
                  <Users className="h-7 w-7 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1 ">
                  <p className="text-md font-semibold text-orange-500">
                    {job.applicationCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Applications
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4  lg:p-8 ">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-1">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-muted/50 gap-2">
            <TabsTrigger
              value="overview"
              className="text-sm py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Target className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="description"
              className="text-sm py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4 mr-2" />
              Description
            </TabsTrigger>
            <TabsTrigger
              value="requirements"
              className="text-sm py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Requirements
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="text-sm py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="assessment"
              className="text-sm py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Assessment
            </TabsTrigger>
          </TabsList>

          {/* // Overview Tabs Content */}
          <TabsContent
            value="overview"
            className="space-y-4 mt-4">
            {/* Stats Cards with Modern Design */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}>
              <Card className=" hover:shadow-lg dark:hover:shadow-white dark:hover:shadow-sm transition-all ">
                <CardContent className="px-4 py-1">
                  <div className="flex items-start justify-between mb-3 ">
                    <div className="p-2 border rounded-lg group-hover:scale-110 transition-transform">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <Badge
                      variant="outline"
                      className=" text-xs text-green-500">
                      <TrendingUp className="mr-1 h-2.5 w-2.5" />
                      +12%
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Total Applications
                    </p>
                    <p className="text-4xl font-bold text-orange-500">
                      {job.applicationCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      This week's growth
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg dark:hover:shadow-white dark:hover:shadow-sm transition-all ">
                <CardContent className="px-4 py-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 border rounded-lg group-hover:scale-110 transition-transform">
                      <Eye className="h-5 w-5 text-orange-500" />
                    </div>
                    <Badge
                      variant="outline"
                      className=" text-green-500 border text-xs">
                      <TrendingUp className="mr-1 h-2.5 w-2.5" />
                      +8%
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Total Views
                    </p>
                    <p className="text-4xl font-bold text-blue-500">
                      {mockAnalytics?.views.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Page impressions
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg dark:hover:shadow-white dark:hover:shadow-sm transition-all border">
                <CardContent className="px-4 py-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 border rounded-lg group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <Badge
                      variant="outline"
                      className=" text-yellow-700 border-yellow-800 text-xs">
                      <Sparkles className="mr-1 h-2.5 w-2.5" />
                      Good
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Conversion Rate
                    </p>
                    <p className="text-4xl font-bold text-purple-500">
                      {mockAnalytics?.conversionRate}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Views to applications
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg dark:hover:shadow-white dark:hover:shadow-sm transition-all border">
                <CardContent className="px-4 py-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 border rounded-lg group-hover:scale-110 transition-transform">
                      <Clock className="h-5 w-5 text-orange-500" />
                    </div>
                    <Badge
                      variant="outline"
                      className=" text-purple-700 border text-xs">
                      <Award className="mr-1 h-2.5 w-2.5" />
                      Fast
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Avg. Time to Apply
                    </p>
                    <p className="text-4xl font-bold text-green-500">
                      {mockAnalytics?.averageTimeToApply}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      From first view
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Compensation & Details - Modern Layout */}
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}>
              {/* Compensation Card */}
              <Card className="lg:col-span-2 overflow-hidden border hover:shadow-lg transition-all">
                <div className="bg-muted/30 p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-500">
                        Compensation Package
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Salary range and benefits
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>Annual Salary Range</span>
                        </div>
                        <div className="text-lg font-bold text-green-500">
                          {formatSalary(
                            job.salary.min,
                            job.salary.max,
                            job.salary.currency
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Competitive market rate
                        </p>
                      </div>
                      <Separator />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>Department</span>
                        </div>
                        <div className="text-sm font-semibold text-purple-500">
                          {job.department}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Employment Type</span>
                        </div>
                        <div className="text-sm font-semibold text-orange-500 capitalize">
                          {job.type.replace("-", " ")}
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-1 ">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground ">
                          <Globe className="h-3 w-3" />
                          <span>Work Location</span>
                        </div>
                        <div className="text-sm font-semibold text-blue-500">
                          {job.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card className="overflow-hidden border hover:shadow-lg transition-all">
                <div className="bg-muted/30 p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 border rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Timeline
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Job posting history
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-muted/50 rounded-lg mt-0.5">
                        <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Posted on
                        </p>
                        <p className="text-xs font-semibold text-foreground">
                          {new Date(job.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-muted/50 rounded-lg mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Last updated
                        </p>
                        <p className="text-xs font-semibold text-foreground">
                          {new Date(job.updatedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-muted/50 rounded-lg mt-0.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Total applications
                        </p>
                        <p className="text-xs font-semibold text-foreground">
                          {job.applicationCount} candidates
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Skills & Tags - Enhanced Design */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}>
              <Card className="overflow-hidden border hover:shadow-lg transition-all">
                <div className="bg-muted/30 p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Skills & Tags
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {job.tags.length} skills required
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs px-3 py-1 font-medium bg-muted/50 hover:bg-muted transition-all hover:scale-105">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {job.tags.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-xs text-muted-foreground italic">
                        No specific skills or tags specified
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent
            value="description"
            className="space-y-4 mt-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}>
              <Card className="overflow-hidden border hover:shadow-lg transition-all">
                <div className="bg-muted/30 p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Job Description
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Detailed overview of the position
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
                      {job.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent
            value="requirements"
            className="space-y-4 mt-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}>
              <Card className="overflow-hidden border hover:shadow-lg transition-all">
                <div className="bg-muted/30 p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Requirements & Qualifications
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {job.requirements.length} requirements for this role
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <ul className="space-y-3">
                    {job.requirements.map((requirement, index) => (
                      <motion.li
                        key={index}
                        className="flex items-start gap-3 group"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}>
                        <div className="flex items-center justify-center w-6 h-6 bg-emerald-50 rounded-full shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-xs text-foreground/90 leading-relaxed flex-1">
                          {requirement}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  {job.requirements.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No specific requirements listed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent
            value="analytics"
            className="space-y-4 mt-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Application Sources */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}>
                <Card className="overflow-hidden border hover:shadow-lg transition-all h-full">
                  <div className="bg-muted/30 p-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="p-2  rounded-lg">
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Application Sources
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Where candidates are coming from
                        </p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {mockAnalytics?.topSources.map((source, index) => (
                        <motion.div
                          key={source.source}
                          className="space-y-2"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs bg-muted/50 text-foreground">
                                #{index + 1}
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {source.source}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-foreground">
                                {source.applications}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                applications
                              </div>
                            </div>
                          </div>
                          <Progress
                            value={
                              mockAnalytics
                                ? (source.applications /
                                    mockAnalytics.applications) *
                                  100
                                : 0
                            }
                            className="h-1.5 bg-muted/50"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Performance Metrics */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}>
                <Card className="overflow-hidden border hover:shadow-lg transition-all h-full">
                  <div className="bg-muted/30 p-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Performance Metrics
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Key performance indicators
                        </p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Conversion Rate */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            View-to-Application Rate
                          </span>
                          <span className="text-lg font-bold text-foreground">
                            {mockAnalytics?.conversionRate}%
                          </span>
                        </div>
                        <Progress
                          value={mockAnalytics?.conversionRate || 0}
                          className="h-2 bg-muted/50"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Higher than average conversion rate
                        </p>
                      </div>

                      <Separator />

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 rounded-lg">
                              <Eye className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">
                                Total Views
                              </p>
                              <p className="text-sm font-bold text-foreground">
                                {mockAnalytics?.views.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            <TrendingUp className="mr-1 h-2.5 w-2.5" />
                            +8%
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 rounded-lg">
                              <Users className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">
                                Total Applications
                              </p>
                              <p className="text-sm font-bold text-foreground">
                                {job.applicationCount}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            <TrendingUp className="mr-1 h-2.5 w-2.5" />
                            +12%
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 rounded-lg">
                              <Clock className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">
                                Avg. Time to Apply
                              </p>
                              <p className="text-sm font-bold text-foreground">
                                {mockAnalytics?.averageTimeToApply}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            <Award className="mr-1 h-2.5 w-2.5" />
                            Fast
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Assessment Tab Content */}
          <TabsContent
            value="assessment"
            className="space-y-4 mt-4">
            {/* Job Context Banner */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}>
              <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 text-sm">
                    <BriefcaseBusiness className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-muted-foreground">
                      Showing assessments for:
                    </span>
                    <span className="font-semibold text-foreground">
                      {job.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-2">
                      {job.department}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {assessmentsLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Loading assessments for {job.title}...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : assessments.length === 0 ? (
              // No assessment created
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}>
                <Card className="overflow-hidden border">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <ClipboardList className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Assessment Created
                    </h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md mb-2">
                      Create an assessment to evaluate candidates for{" "}
                      <span className="font-semibold text-foreground">
                        {job.title}
                      </span>
                      . Assessments help you identify the best-fit candidates
                      efficiently.
                    </p>
                    <p className="text-xs text-muted-foreground text-center max-w-md mb-6">
                      This assessment will be specifically linked to this job
                      position.
                    </p>
                    <Button
                      onClick={handleCreateAssessment}
                      className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Assessment for {job.title}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              // Assessment exists
              <div className="space-y-4">
                {assessments.map((assessment, index) => {
                  // Double-check that assessment belongs to this job
                  if (assessment.jobId !== id) {
                    console.warn(
                      `Assessment ${assessment.id} does not belong to job ${id}`
                    );
                    return null; // Skip rendering assessments that don't belong to this job
                  }

                  const totalQuestions = assessment.sections.reduce(
                    (total, section) => total + section.questions.length,
                    0
                  );
                  const totalSections = assessment.sections.length;

                  return (
                    <motion.div
                      key={assessment.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}>
                      <Card className="overflow-hidden border hover:shadow-lg transition-all">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 border-b">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <ListChecks className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">
                                  {assessment.title}
                                </h3>
                                <Badge
                                  variant={
                                    assessment.isPublished
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={cn(
                                    assessment.isPublished &&
                                      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                  )}>
                                  {assessment.isPublished
                                    ? "Published"
                                    : "Draft"}
                                </Badge>
                              </div>
                              {assessment.description && (
                                <p className="text-sm text-muted-foreground">
                                  {assessment.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/app/assessments?edit=${assessment.id}`
                                )
                              }>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          {/* Assessment Stats */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Total Questions
                                </p>
                                <p className="text-xl font-bold text-foreground">
                                  {totalQuestions}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                              <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Sections
                                </p>
                                <p className="text-xl font-bold text-foreground">
                                  {totalSections}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                              <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Time Limit
                                </p>
                                <p className="text-xl font-bold text-foreground">
                                  {assessment.timeLimit
                                    ? `${assessment.timeLimit}m`
                                    : "None"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Responses
                                </p>
                                <p className="text-xl font-bold text-foreground">
                                  0
                                </p>
                              </div>
                            </div>
                          </div>

                          <Separator className="mb-4" />

                          {/* Assessment Sections */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <ListChecks className="h-4 w-4 text-primary" />
                              Assessment Sections
                            </h4>
                            <div className="space-y-2">
                              {assessment.sections.map((section, sIdx) => (
                                <div
                                  key={section.id}
                                  className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border">
                                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">
                                    {sIdx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-foreground truncate">
                                      {section.title}
                                    </h5>
                                    {section.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {section.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2">
                                      <div className="text-xs text-muted-foreground">
                                        {section.questions.length}{" "}
                                        {section.questions.length === 1
                                          ? "question"
                                          : "questions"}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        •
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {
                                          section.questions.filter(
                                            (q) => q.required
                                          ).length
                                        }{" "}
                                        required
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Assessment Actions */}
                          <div className="flex items-center gap-3 mt-6 pt-6 border-t">
                            <Button
                              variant="default"
                              onClick={() =>
                                navigate(
                                  `/app/assessments?preview=${assessment.id}`
                                )
                              }
                              className="gap-2">
                              <Eye className="h-4 w-4" />
                              Preview Assessment
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                navigate(
                                  `/app/assessments?edit=${assessment.id}`
                                )
                              }
                              className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit Assessment
                            </Button>
                          </div>

                          {/* Last Updated */}
                          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Last updated:{" "}
                            {new Date(assessment.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}

                {/* Create Another Assessment */}
                <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-all">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Button
                      onClick={handleCreateAssessment}
                      variant="outline"
                      className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Another Assessment
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
