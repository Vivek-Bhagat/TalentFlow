import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Users,
  BriefcaseBusinessIcon,
  Loader,
  ListFilter,
} from "lucide-react";

import type { Job, Candidate } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";

// Lazy load the heavy Kanban component
const CandidateKanban = lazy(() => import("@/components/Kanban/Kanban"));

// Define stage groups for filtering
const STAGE_GROUPS = [
  {
    id: "all",
    label: "All Stages",
    stages: [
      "applied",
      "screen",
      "technical",
      "offer",
      "hired",
      "rejected",
    ] as string[],
  },
  {
    id: "early",
    label: "Early Stage",
    stages: ["applied", "screen", "technical"] as string[],
  },
  {
    id: "active",
    label: "Active Process",
    stages: ["screen", "technical", "offer"] as string[],
  },
  {
    id: "final",
    label: "Final Status",
    stages: ["offer", "hired", "rejected"] as string[],
  },
] as const;

export default function JobCandidatesKanban() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "jobTitle" | "position">(
    "jobTitle"
  );
  const [stageGroupFilter, setStageGroupFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) {
        toast({
          title: "Error",
          description: "Job ID is required",
          variant: "destructive",
        });
        navigate("/app/jobs");
        return;
      }

      try {
        setLoading(true);

        // Fetch job details
        const jobsResponse = await apiClient.getJobs({
          page: 1,
          pageSize: 1000,
        });
        const foundJob = jobsResponse.jobs.find((j) => j.id === jobId);

        if (!foundJob) {
          toast({
            title: "Error",
            description: "Job not found",
            variant: "destructive",
          });
          navigate("/app/jobs");
          return;
        }

        setJob(foundJob);

        // Fetch all candidates
        const candidatesResponse = await apiClient.getCandidates({
          pageSize: 500, // Increased for better performance
        });
        setAllCandidates(candidatesResponse.candidates);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch data";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, navigate, toast]);

  useEffect(() => {
    if (!job || !allCandidates.length) {
      setFilteredCandidates([]);
      return;
    }

    let filtered = allCandidates;

    // Filter by job/position
    if (filterBy === "jobTitle" || filterBy === "position") {
      filtered = allCandidates.filter((candidate) => {
        const jobTitle = job.title.toLowerCase();
        const candidatePosition = candidate.position.toLowerCase();

        return (
          candidatePosition.includes(jobTitle) ||
          candidatePosition === jobTitle ||
          jobTitle.includes(candidatePosition)
        );
      });
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(search) ||
          candidate.email.toLowerCase().includes(search) ||
          candidate.position.toLowerCase().includes(search) ||
          candidate.skills.some((skill) => skill.toLowerCase().includes(search))
      );
    }

    setFilteredCandidates(filtered);
  }, [job, allCandidates, filterBy, searchTerm]);

  const handleBack = () => {
    navigate(`/app/jobs/${jobId}`);
  };

  const handleCandidatesChange = (updatedCandidates: Candidate[]) => {
    // Update the filtered candidates
    setFilteredCandidates(updatedCandidates);

    // Update the all candidates array with the changes
    const updatedAllCandidates = allCandidates.map((candidate) => {
      const updated = updatedCandidates.find((c) => c.id === candidate.id);
      return updated || candidate;
    });
    setAllCandidates(updatedAllCandidates);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        {/* Dot Pattern Background */}

        <div className="relative z-10 flex items-center justify-center h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4">
            <Loader className="h-18 w-18 animate-spin text-green-500" />
            <span className="text-muted-foreground font-medium">
              Loading candidates...
            </span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Dot Pattern Background */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-2 sm:space-y-3 lg:space-y-4">
        {/* Header */}
        <div className="z-20 p-3 sm:p-4 lg:p-1 rounded-lg bg-white dark:bg-[#202020] shadow-sm">
          <div className="mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              {/* Title and Back Button */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0 justify-between">
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBack}
                    className="transition-colors hover:bg-primary hover:text-primary-foreground h-8 sm:h-9 text-xs sm:text-sm">
                    <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className=" sm:inline">Back to Job</span>
                  </Button>
                  <Separator
                    orientation="vertical"
                    className="h-6 hidden sm:inline"
                  />
                </div>
                <div className="flex items-center gap-1 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border rounded-lg flex items-center justify-center shadow-sm">
                    <BriefcaseBusinessIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold line-clamp-1 text-primary">
                    {job?.title}
                  </h1>
                  <div></div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex ">
                {/* Search Input */}
                <div className="flex flex-1  gap-2">
                  <div className="flex-1 sm:max-w-sm lg:max-w-lg">
                    <Label
                      htmlFor="search"
                      className="sr-only">
                      Search candidates
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        type="text"
                        placeholder="Search candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm border-border focus:border-emerald-500 focus:ring-emerald-500 bg-background"
                      />
                    </div>
                  </div>

                  {/* Stage Group Filter Selector */}
                  <div className="flex items-center">
                    <Select
                      value={stageGroupFilter}
                      onValueChange={setStageGroupFilter}>
                      <SelectTrigger className="h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm font-medium gap-1 sm:gap-2 min-w-[140px] sm:min-w-[160px]">
                        <ListFilter className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <SelectValue placeholder="Filter by stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGE_GROUPS.map((group) => (
                          <SelectItem
                            key={group.id}
                            value={group.id}
                            className="text-xs sm:text-sm">
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span>{group.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="px-2 ">
          {filteredCandidates.length > 0 ? (
            <Suspense
              fallback={
                <div className="flex justify-center items-center h-64 sm:h-96">
                  <Loader className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-emerald-600" />
                </div>
              }>
              <CandidateKanban
                candidates={filteredCandidates}
                onCandidatesChange={handleCandidatesChange}
                activeStageGroup={stageGroupFilter}
              />
            </Suspense>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-64 sm:h-96 text-center bg-card/50 backdrop-blur-sm rounded-lg border p-4 sm:p-6 lg:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                No candidates found
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-4 sm:mb-6 px-2">
                {searchTerm || filterBy !== "jobTitle"
                  ? "No candidates match your current search and filter criteria. Try adjusting your filters."
                  : `No candidates have applied for "${job?.title}" yet, or they may be using different position titles.`}
              </p>
              {(searchTerm || filterBy !== "jobTitle") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterBy("jobTitle");
                  }}>
                  Clear filters
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
