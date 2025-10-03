"use client";

import * as React from "react";
import { Loader, TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";
import type { PipelineData } from "@/types";

export const description = "A donut chart with text";

const chartConfig = {
  candidates: {
    label: "Candidates",
  },
  applied: {
    label: "Applied",
    color: "var(--chart-1)",
  },
  screen: {
    label: "Screening",
    color: "var(--chart-2)",
  },
  technical: {
    label: "Technical",
    color: "var(--chart-3)",
  },
  offer: {
    label: "Offer",
    color: "var(--chart-4)",
  },
  hired: {
    label: "Hired",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig;

export default function PipelineChart() {
  const [chartData, setChartData] = React.useState<PipelineData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCandidates({ pageSize: 1000 });
      const candidates = response.candidates;

      // Group candidates by stage (excluding rejected)
      const stageCount = candidates.reduce((acc, candidate) => {
        if (candidate.stage !== "rejected") {
          acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Map to chart data - always show all stages even if count is 0
      const data: PipelineData[] = [
        {
          stage: "applied",
          candidates: stageCount.applied || 0,
          fill: "var(--color-applied)",
        },
        {
          stage: "screen",
          candidates: stageCount.screen || 0,
          fill: "var(--color-screen)",
        },
        {
          stage: "technical",
          candidates: stageCount.technical || 0,
          fill: "var(--color-technical)",
        },
        {
          stage: "offer",
          candidates: stageCount.offer || 0,
          fill: "var(--color-offer)",
        },
        {
          stage: "hired",
          candidates: stageCount.hired || 0,
          fill: "var(--color-hired)",
        },
      ];

      setChartData(data);
    } catch (error) {
      console.error("Error fetching pipeline data:", error);
      toast({
        title: "Error",
        description: "Failed to load pipeline data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.candidates, 0);
  }, [chartData]);

  if (loading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Hiring Pipeline</CardTitle>
          <CardDescription>Current candidate distribution</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex h-[250px] items-center justify-center">
            {/* <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div> */}
            <Loader className="h-16 w-16 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Hiring Pipeline</CardTitle>
        <CardDescription>Current candidate distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="candidates"
              nameKey="stage"
              innerRadius={60}
              strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold">
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground">
                          In Pipeline
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Active candidates in the pipeline <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Excluding rejected candidates
        </div>
      </CardFooter>
    </Card>
  );
}
