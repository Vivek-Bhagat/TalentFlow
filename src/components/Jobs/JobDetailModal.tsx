import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Edit,
  Archive,
  RotateCcw,
  Share,
  FileText,
  TrendingUp,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {  JobDetailsModalProps } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function JobDetailsModal({
  job,
  isOpen,
  onClose,
  onEdit,
  onArchiveToggle,
}: JobDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  if (!job) return null;

  const handleShare = async () => {
    const jobUrl = `${window.location.origin}/jobs/${job.slug}`;

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

  const mockAnalytics = {
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
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0">
            <div className="space-y-2 flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl lg:text-3xl pr-4">
                {job.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="capitalize">
                    {job.type.replace("-", " ")}
                  </span>
                </span>
                <Badge
                  className={cn(
                    "status-badge text-xs",
                    job.status === "active"
                      ? "status-success"
                      : "status-rejected"
                  )}>
                  {job.status}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto md:pr-5 lg:pr-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Share className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(job)}
                className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onArchiveToggle(job)}
                className="flex-1 sm:flex-none text-xs sm:text-sm">
                {job.status === "active" ? (
                  <>
                    <Archive className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Archive</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Activate</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm py-2 px-2 sm:px-4">
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="description"
              className="text-xs sm:text-sm py-2 px-2 sm:px-4">
              Description
            </TabsTrigger>
            <TabsTrigger
              value="requirements"
              className="text-xs sm:text-sm py-2 px-2 sm:px-4">
              Requirements
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="text-xs sm:text-sm py-2 px-2 sm:px-4">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    {job.applicationCount}
                  </div>
                  <div className="flex items-center text-xs text-success mt-1">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +12% this week
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4 text-emerald-600" />
                    Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    {mockAnalytics.views.toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-emerald-600 mt-1">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +8% this week
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    {mockAnalytics.conversionRate}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    applications/views
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Avg. Time to Apply
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    {mockAnalytics.averageTimeToApply}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    from first view
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              <Card className="hover:shadow-md transition-shadow xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Compensation & Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                          Salary Range
                        </span>
                        <span className="font-semibold text-sm sm:text-base">
                          {job.salary.currency}{" "}
                          {job.salary.min.toLocaleString()} -{" "}
                          {job.salary.max.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                          Employment Type
                        </span>
                        <span className="font-semibold text-sm sm:text-base capitalize">
                          {job.type.replace("-", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                          Department
                        </span>
                        <span className="font-semibold text-sm sm:text-base">
                          {job.department}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                          Location
                        </span>
                        <span className="font-semibold text-sm sm:text-base">
                          {job.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Created
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Last Updated
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {new Date(job.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Status
                    </span>
                    <Badge
                      className={cn(
                        "status-badge w-fit",
                        job.status === "active"
                          ? "status-success"
                          : "status-rejected"
                      )}>
                      {job.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Skills & Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 lg:gap-3">
                  {job.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs sm:text-sm py-1 px-2 sm:px-3 hover:bg-primary/10 transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {job.tags.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No tags specified
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="description"
            className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed text-sm sm:text-base lg:text-lg">
                    {job.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="requirements"
            className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ul className="space-y-3 lg:space-y-4">
                  {job.requirements.map((requirement, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 lg:gap-4">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                      <span className="text-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
                        {requirement}
                      </span>
                    </li>
                  ))}
                </ul>
                {job.requirements.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No requirements specified
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="analytics"
            className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Application Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockAnalytics.topSources.map((source) => (
                    <div
                      key={source.source}
                      className="flex items-center justify-between gap-4">
                      <span className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium min-w-0">
                        {source.source}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-20 sm:w-24 lg:w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                job.applicationCount > 0
                                  ? (source.applications /
                                      job.applicationCount) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm lg:text-base font-semibold w-8 text-right">
                          {source.applications}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Eye className="h-5 w-5 text-emerald-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 lg:space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm lg:text-base">
                      <span className="text-muted-foreground font-medium">
                        Application Rate
                      </span>
                      <span className="font-bold text-lg sm:text-xl">
                        {mockAnalytics.conversionRate}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                        style={{ width: `${mockAnalytics.conversionRate}%` }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium">
                        Total Views
                      </span>
                      <span className="font-bold text-sm sm:text-base lg:text-lg">
                        {mockAnalytics.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium">
                        Applications
                      </span>
                      <span className="font-bold text-sm sm:text-base lg:text-lg">
                        {job.applicationCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium">
                        Avg. Time to Apply
                      </span>
                      <span className="font-bold text-sm sm:text-base lg:text-lg">
                        {mockAnalytics.averageTimeToApply}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
