"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import type { ChartData } from "@/types";

export const description = "An interactive area chart";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  hired: {
    label: "Hired",
    color: "hsl(142, 76%, 36%)",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

// Helper function to format date keys
const getDateKey = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Helper function to get days to subtract based on timeRange
const getDaysToSubtract = (timeRange: string): number => {
  switch (timeRange) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    default:
      return 90;
  }
};

export default function HiringChart() {
  const [timeRange, setTimeRange] = React.useState("7d");
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchChartData = React.useCallback(async () => {
    try {
      setLoading(true);
      // Only fetch candidates with relevant stages
      const response = await apiClient.getCandidates({ pageSize: 1000 });
      const candidates = response.candidates;

      // Group candidates by date
      const dateMap = new Map<string, { hired: number; rejected: number }>();

      // Get the last 90 days
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 89);

      // Initialize date map with only last 90 days
      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = getDateKey(date);
        dateMap.set(dateKey, { hired: 0, rejected: 0 });
      }

      // Process candidates - filter relevant candidates first
      const relevantCandidates = candidates.filter(
        (c) => c.stage === "hired" || c.stage === "rejected"
      );

      relevantCandidates.forEach((candidate) => {
        const appliedDate = new Date(candidate.appliedAt);
        const dateKey = getDateKey(appliedDate);

        const data = dateMap.get(dateKey);
        if (data) {
          if (candidate.stage === "hired") data.hired += 1;
          else if (candidate.stage === "rejected") data.rejected += 1;
        }
      });

      // Convert to cumulative data
      let cumulativeHired = 0;
      let cumulativeRejected = 0;

      const formattedData: ChartData[] = Array.from(dateMap.entries()).map(
        ([date, counts]) => {
          cumulativeHired += counts.hired;
          cumulativeRejected += counts.rejected;

          return {
            date,
            hired: cumulativeHired,
            rejected: cumulativeRejected,
          };
        }
      );

      setChartData(formattedData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      toast({
        title: "Error",
        description: "Failed to load chart data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Memoize filtered data to avoid recalculating on every render
  const filteredData = React.useMemo(() => {
    const daysToSubtract = getDaysToSubtract(timeRange);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    const startDateKey = getDateKey(startDate);

    return chartData.filter((item) => item.date >= startDateKey);
  }, [chartData, timeRange]);

  // Memoize loading component
  const LoadingState = React.useMemo(
    () => (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Hiring Trends</CardTitle>
            <CardDescription>
              Showing hired and rejected candidates over time
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex h-[250px] items-center justify-center">
            <Loader className="h-16 w-16 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    ),
    []
  );

  if (loading) {
    return LoadingState;
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Hiring Trends</CardTitle>
          <CardDescription>
            Showing hired and rejected candidates over time
          </CardDescription>
        </div>
        <Select
          value={timeRange}
          onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value">
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem
              value="90d"
              className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem
              value="30d"
              className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem
              value="7d"
              className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient
                id="fillHired"
                x1="0"
                y1="0"
                x2="0"
                y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-hired)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-hired)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient
                id="fillRejected"
                x1="0"
                y1="0"
                x2="0"
                y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-rejected)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-rejected)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="rejected"
              type="natural"
              fill="url(#fillRejected)"
              stroke="var(--color-rejected)"
              stackId="a"
            />
            <Area
              dataKey="hired"
              type="natural"
              fill="url(#fillHired)"
              stroke="var(--color-hired)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
