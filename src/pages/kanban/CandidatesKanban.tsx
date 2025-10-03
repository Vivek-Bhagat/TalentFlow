import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  lazy,
  Suspense,
} from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Search,
  Users,
  AlertCircle,
  Filter,
  Loader,
  ListFilter,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Candidate } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

// Lazy load the heavy Kanban component
const CandidateKanban = lazy(() => import("@/components/Kanban/Kanban"));

// Define 3-stage groups for filtering
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

const CandidatesKanban = memo(() => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageGroupFilter, setStageGroupFilter] = useState("all");
  const [sortOption, setSortOption] = useState<string>("none"); // No sort by default

  const { toast } = useToast();

  // Debounce search query for server-side search
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch candidates with server-side search
      const response = await apiClient.getCandidates({
        search: debouncedSearchQuery || undefined, // Pass search query to server
        pageSize: 500,
      });

      setCandidates(response.candidates);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch candidates";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, debouncedSearchQuery]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleCandidatesChange = useCallback(
    (updatedCandidates: Candidate[]) => {
      // Force re-render by creating a new array reference
      setCandidates([...updatedCandidates]);
    },
    []
  );

  // Memoized sorted candidates (no client-side search filtering)
  const filteredCandidates = useMemo(() => {
    let sorted = candidates;

    // Apply sort if selected and not 'none'
    if (sortOption === "name-asc") {
      sorted = [...sorted].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "name-desc") {
      sorted = [...sorted].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === "date-asc") {
      sorted = [...sorted].sort(
        (a, b) =>
          new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
      );
    } else if (sortOption === "date-desc") {
      sorted = [...sorted].sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      );
    }

    return sorted;
  }, [candidates, sortOption]);

  // Memoized stage group counts calculation
  const stageGroupCounts = useMemo(() => {
    return STAGE_GROUPS.reduce((acc, group) => {
      if (group.id === "all") {
        acc[group.id] = filteredCandidates.length;
      } else {
        acc[group.id] = filteredCandidates.filter((c) =>
          group.stages.includes(c.stage)
        ).length;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [filteredCandidates]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleStageGroupFilterChange = (filterId: string) => {
    setStageGroupFilter(filterId);
  };

  if (error && !loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 ">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Candidates
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage candidate pipeline
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 text-center">
              Failed to load candidates
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md">
              {error}
            </p>
            <Button
              onClick={fetchCandidates}
              size="sm"
              className="w-full sm:w-auto">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}>
        {/* Header Row with Title, Search, Filter, and Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4 dark:bg-[#202020] bg-white p-3 ">
          {/* Title Section */}
          <div className="flex-shrink-0 px-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-500 dark:text-white">
              Kanban View
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage candidate pipeline
            </p>
          </div>

          {/* Search, Filter, and Sort Section */}
          <div className="flex sm:flex-1 gap-2 sm:gap-3 lg:justify-end">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-sm lg:max-w-md">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 text-sm border-border focus:border-emerald-500 focus:ring-emerald-500 bg-white dark:bg-gray-400/10"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full hover:bg-muted/80 transition-colors group"
                  aria-label="Clear search">
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Filter Selector */}
            <div className="flex items-center">
              <Select
                value={stageGroupFilter}
                onValueChange={handleStageGroupFilterChange}>
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

            {/* Sort Selector */}
            <div className="flex items-center">
              <Select
                value={sortOption}
                onValueChange={setSortOption}>
                <SelectTrigger className="h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm font-medium gap-1 sm:gap-2 min-w-[140px] sm:min-w-[160px]">
                  <Filter className="h-3.5 w-3.5 " />
                  <SelectValue placeholder="Select sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sort</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="date-asc">
                    Applied Date (Oldest)
                  </SelectItem>
                  <SelectItem value="date-desc">
                    Applied Date (Newest)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64 sm:h-96 w-full">
            <Loader className="h-16 w-16 sm:h-8 sm:w-8 animate-spin text-emerald-600" />
          </div>
        )}

        {/* Kanban Content: Only show if sortOption is selected and not 'none' */}
        {!loading && sortOption !== "none" && (
          <div className="w-full overflow-hidden">
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

            {/* Empty State */}
            {stageGroupCounts[stageGroupFilter] === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-2 text-center">
                    No candidates found
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-md px-4">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : stageGroupFilter !== "all"
                      ? `No candidates in ${STAGE_GROUPS.find(
                          (g) => g.id === stageGroupFilter
                        )?.label.toLowerCase()} stages`
                      : "No candidates in your pipeline yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Show prompt if no sort selected */}
        {!loading && sortOption === "none" && (
          <div className="flex flex-col items-center justify-center h-64 sm:h-96">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-2 text-center">
                  Select a sort option to view candidates
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-md px-4">
                  Please choose a sort order above to display the Kanban board.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
});

CandidatesKanban.displayName = "CandidatesKanban";

export default CandidatesKanban;
