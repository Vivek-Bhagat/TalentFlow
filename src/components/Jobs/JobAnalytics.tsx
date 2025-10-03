import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Target,
  BarChart3,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {  JobAnalyticsProps, AnalyticsData } from "@/types";

export default function JobAnalytics({ jobs, className }: JobAnalyticsProps) {
  // Generate mock analytics data based on actual jobs
  const generateAnalytics = (): AnalyticsData => {
    const totalApplications = jobs.reduce(
      (sum, job) => sum + job.applicationCount,
      0
    );
    const totalViews = Math.floor(totalApplications * 4.2); // Mock views multiplier
    const averageConversionRate =
      totalViews > 0 ? Math.round((totalApplications / totalViews) * 100) : 0;

    // Top performing jobs (sorted by application count)
    const topPerformingJobs = jobs
      .map((job) => ({
        job,
        views: Math.floor(job.applicationCount * 4.2),
        applications: job.applicationCount,
        conversionRate:
          job.applicationCount > 0
            ? Math.round(
                (job.applicationCount / (job.applicationCount * 4.2)) * 100
              )
            : 0,
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5);

    // Department statistics
    const departmentMap = new Map<
      string,
      { jobs: number; applications: number; salaries: number[] }
    >();

    jobs.forEach((job) => {
      const existing = departmentMap.get(job.department) || {
        jobs: 0,
        applications: 0,
        salaries: [],
      };
      existing.jobs += 1;
      existing.applications += job.applicationCount;
      existing.salaries.push((job.salary.min + job.salary.max) / 2);
      departmentMap.set(job.department, existing);
    });

    const departmentStats = Array.from(departmentMap.entries()).map(
      ([department, data]) => ({
        department,
        jobs: data.jobs,
        applications: data.applications,
        averageSalary: Math.round(
          data.salaries.reduce((sum, salary) => sum + salary, 0) /
            data.salaries.length
        ),
      })
    );

    // Status distribution
    const statusMap = new Map<string, number>();
    jobs.forEach((job) => {
      statusMap.set(job.status, (statusMap.get(job.status) || 0) + 1);
    });

    const statusDistribution = Array.from(statusMap.entries()).map(
      ([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / jobs.length) * 100),
      })
    );

    return {
      totalViews,
      totalApplications,
      averageConversionRate,
      topPerformingJobs,
      departmentStats,
      statusDistribution,
    };
  };

  const analytics = generateAnalytics();

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (jobs.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Analytics Available
          </h3>
          <p className="text-muted-foreground text-center">
            Create some jobs to start seeing analytics data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(analytics.totalViews)}
            </div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +15% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(analytics.totalApplications)}
            </div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <Target className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics.averageConversionRate}%
            </div>
            <div className="flex items-center text-xs text-destructive">
              <TrendingDown className="mr-1 h-3 w-3" />
              -2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Jobs
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics.statusDistribution.find((s) => s.status === "active")
                ?.count || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              of {jobs.length} total jobs
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformingJobs.map((item, index) => (
                <div
                  key={item.job.id}
                  className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.job.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.applications} applications • {item.conversionRate}%
                      rate
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {formatNumber(item.views)}
                    </p>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Department Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.departmentStats.map((dept) => (
                <div
                  key={dept.department}
                  className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {dept.department}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {dept.jobs} jobs
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {dept.applications} applications
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={
                        (dept.applications / analytics.totalApplications) * 100
                      }
                      className="flex-1 h-2"
                    />
                    <span className="text-xs text-muted-foreground">
                      ${dept.averageSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Job Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.statusDistribution.map((status) => (
              <div
                key={status.status}
                className="text-center p-4 bg-muted/30 rounded-lg">
                <Badge
                  className={cn(
                    "status-badge mb-2",
                    status.status === "active"
                      ? "status-success"
                      : "status-rejected"
                  )}>
                  {status.status}
                </Badge>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {status.count}
                </div>
                <div className="text-sm text-muted-foreground">
                  {status.percentage}% of total
                </div>
                <Progress
                  value={status.percentage}
                  className="mt-2 h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
