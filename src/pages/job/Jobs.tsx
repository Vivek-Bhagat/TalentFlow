import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Briefcase,
  AlertCircle,
  GripVertical,
  Plus,
  Loader,
  ArrowUpDown,
  Grid3x3,
  ListFilterPlus,
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";
import JobCreateForm from "@/components/Jobs/JobCreateForm";
import Pagination from "@/components/ui/pagination";
import GridJobCard from "@/components/Jobs/GridJobCard";
import ListJobRow from "@/components/Jobs/ListJobRow";

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const sortBy = "order"; // Sort by order by default

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // Fixed page size
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [archivingJob, setArchivingJob] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // List view is the reorder mode
  const isReorderMode = viewMode === "list";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch jobs with server-side filtering, pagination, and sorting
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        search?: string;
        status?: string;
        page: number;
        pageSize: number;
        sort: string;
      } = {
        page: isReorderMode ? 1 : currentPage, // Always page 1 in reorder mode
        pageSize: isReorderMode ? 10000 : pageSize, // Get all jobs in reorder mode
        sort: sortBy,
      };

      // Add search query if exists (not in reorder mode)
      if (searchQuery.trim() && !isReorderMode) {
        params.search = searchQuery.trim();
      }

      // Add status filter if not "all" (not in reorder mode)
      if (statusFilter !== "all" && !isReorderMode) {
        params.status = statusFilter;
      }

      const response = await apiClient.getJobs(params);

      setJobs(response.jobs);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch jobs";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    sortBy,
    searchQuery,
    statusFilter,
    isReorderMode,
    toast,
  ]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleEditJob = useCallback(
    (job: Job) => {
      setEditingJob(job);
      setShowCreateForm(true);
      // Clear the edit parameter from URL
      setSearchParams({});
    },
    [setSearchParams]
  );

  // Handle edit parameter from URL
  useEffect(() => {
    const editJobId = searchParams.get("edit");
    if (editJobId && jobs.length > 0) {
      const jobToEdit = jobs.find((job) => job.id === editJobId);
      if (jobToEdit) {
        handleEditJob(jobToEdit);
      }
    }
  }, [searchParams, jobs, handleEditJob]);

  // Debounced search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when search changes
      fetchJobs();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Refetch when exiting reorder mode to sync with server
  useEffect(() => {
    if (!isReorderMode) {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReorderMode]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setIsDragging(false);

      if (!over || active.id === over.id) return;

      const oldIndex = jobs.findIndex((job) => job.id === active.id);
      const newIndex = jobs.findIndex((job) => job.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const oldJob = jobs[oldIndex];
      const newJob = jobs[newIndex];

      // Store original jobs array for potential rollback
      const originalJobs = [...jobs];

      // Optimistic update - reorder in the jobs array and recalculate order values
      const reorderedJobs = arrayMove(jobs, oldIndex, newIndex).map(
        (job, index) => ({
          ...job,
          order: index + 1, // Recalculate order based on new position
        })
      );

      setJobs(reorderedJobs);

      // Show success toast for immediate feedback
      toast({
        title: "Success",
        description: "Job order updated successfully",
        variant: "default",
      });

      // Send update to server in the background (fire and forget for speed)
      apiClient
        .reorderJob(active.id as string, oldJob.order, newJob.order)
        .catch(() => {
          // Rollback on error
          setJobs(originalJobs);
          toast({
            title: "Error",
            description: "Failed to reorder jobs. Please try again.",
            variant: "destructive",
          });
        });
    },
    [jobs, toast]
  );

  const handleArchiveToggle = useCallback(
    async (job: Job) => {
      const newStatus = job.status === "active" ? "archived" : "active";

      try {
        setArchivingJob(job.id);

        // Optimistic update
        setJobs((prevJobs) =>
          prevJobs.map((j) =>
            j.id === job.id ? { ...j, status: newStatus } : j
          )
        );

        await apiClient.updateJob(job.id, { status: newStatus });

        toast({
          title: "Success",
          description: `Job ${
            newStatus === "active" ? "activated" : "archived"
          } successfully`,
          variant: "default",
        });

        // Refetch to ensure consistency
        fetchJobs();
      } catch (error) {
        // Rollback on error
        setJobs((prevJobs) => prevJobs.map((j) => (j.id === job.id ? job : j)));

        toast({
          title: "Error",
          description: `Failed to ${
            newStatus === "active" ? "activate" : "archive"
          } job. Please try again.`,
          variant: "destructive",
        });
      } finally {
        setArchivingJob(null);
      }
    },
    [toast, fetchJobs]
  );

  const handleJobCreated = useCallback(() => {
    // Refetch jobs to include the new job
    fetchJobs();
    toast({
      title: "Success",
      description: "Job created successfully",
      variant: "default",
    });
  }, [fetchJobs, toast]);

  const handleJobUpdated = useCallback(
    (updatedJob: Job) => {
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
      );
      toast({
        title: "Success",
        description: "Job updated successfully",
        variant: "default",
      });
    },
    [toast]
  );

  const handleViewJob = useCallback(
    (job: Job) => {
      navigate(`/app/jobs/${job.id}`);
    },
    [navigate]
  );

  const activeDragJob = useMemo(
    () => (activeId ? jobs.find((job) => job.id === activeId) : null),
    [activeId, jobs]
  );

  if (error && !loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 p-3 sm:p-6 space-y-4 sm:space-y-6 border-b bg-background">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Jobs
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage your job postings
              </p>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex items-center justify-center scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/20">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                Failed to load jobs
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-sm">
                {error}
              </p>
              <Button
                onClick={() => fetchJobs()}
                className="w-full sm:w-auto">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      {/* Fixed Header Section */}
      <motion.div
        className="flex-shrink-0 p-3 sm:p-6 space-y-4 sm:space-y-6 border-b bg-background"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        {/* Header */}
        <div className="flex  sm:flex-row  sm:items-center justify-between gap-4  items-center  ">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-500 dark:text-orange-500">
              Jobs
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your job postings
            </p>
          </div>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border bg-background ">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-9 px-4">
                <Grid3x3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Grid View</span>
                <span className="sm:hidden">Grid</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-9 px-4 sm:px-2">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Reorder</span>
                <span className="sm:hidden">Re-O</span>
              </Button>
            </div>

            <Button
              onClick={() => setShowCreateForm(true)}
              className="h-9 hover:bg-green-500 transition-colors duration-300 ">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Create Job</span>
              <span className="sm:hidden">Job</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        {!isReorderMode && (
          <div className="flex  sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1 flex">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, department, or tags..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 h-9 text-sm bg-background"
              />
            </div>

            {/* Filter Controls Row */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {/* Status Filter Dropdown */}
              <div className="flex rounded-lg border">
                <Select
                  value={statusFilter}
                  onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="border-0 focus:ring-0 h-9 px-2 text-sm font-medium min-w-[100px]">
                    <ListFilterPlus className="h-4 w-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="all"
                      className="text-sm">
                      All Jobs
                    </SelectItem>
                    <SelectItem
                      value="active"
                      className="text-sm">
                      Active
                    </SelectItem>
                    <SelectItem
                      value="archived"
                      className="text-sm">
                      Archived
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Content Section */}
      <div className="p-3 sm:p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader className="h-16 w-16 sm:h-8 sm:w-8 animate-spin text-orange-500" />
            <span className="ml-3 text-sm sm:text-base text-muted-foreground">
              Loading jobs...
            </span>
          </div>
        )}

        {/* Jobs Content */}
        {!loading && (
          <>
            {isReorderMode && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
                    <GripVertical className="h-5 w-5" />
                    <span className="font-medium">Reorder Mode Active</span>
                    <span className="text-blue-700 dark:text-blue-300">
                      - Drag and drop jobs to reorder them
                    </span>
                  </div>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Showing all {jobs.length} jobs
                  </span>
                </div>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}>
              <SortableContext
                items={jobs.map((job) => job.id)}
                strategy={rectSortingStrategy}>
                <AnimatePresence mode="popLayout">
                  {viewMode === "grid" ? (
                    // Grid View
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                      {jobs.map((job) => (
                        <GridJobCard
                          key={job.id}
                          job={job}
                          orderNumber={job.order}
                          onArchiveToggle={handleArchiveToggle}
                          archivingJob={archivingJob}
                          onView={handleViewJob}
                        />
                      ))}
                    </div>
                  ) : (
                    // List View - Reorder Mode
                    <div className="space-y-3">
                      <motion.div
                        className={cn(
                          "flex flex-col gap-3",
                          isDragging && "cursor-grabbing"
                        )}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}>
                        {jobs.map((job) => (
                          <ListJobRow
                            key={job.id}
                            job={job}
                            orderNumber={job.order}
                            onArchiveToggle={handleArchiveToggle}
                            archivingJob={archivingJob}
                            onView={handleViewJob}
                            isReorderMode={isReorderMode}
                          />
                        ))}
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </SortableContext>

              <DragOverlay>
                {activeDragJob ? (
                  viewMode === "grid" ? (
                    <GridJobCard
                      job={activeDragJob}
                      orderNumber={activeDragJob.order}
                      onArchiveToggle={handleArchiveToggle}
                      archivingJob={archivingJob}
                      onView={handleViewJob}
                    />
                  ) : (
                    <ListJobRow
                      job={activeDragJob}
                      orderNumber={activeDragJob.order}
                      onArchiveToggle={handleArchiveToggle}
                      archivingJob={archivingJob}
                      onView={handleViewJob}
                      isReorderMode={isReorderMode}
                    />
                  )
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* Empty State */}
            {jobs.length === 0 && !loading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                    No jobs found
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground text-center max-w-sm">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first job posting"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button
                      className="mt-4 w-full sm:w-auto"
                      onClick={() => setShowCreateForm(true)}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Create Job
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pagination Controls */}
            {!loading &&
              !isReorderMode &&
              jobs.length > 0 &&
              totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={pageSize}
                    totalItems={totalItems}
                  />
                </div>
              )}
          </>
        )}
      </div>

      {/* Job Create Form */}
      <JobCreateForm
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setEditingJob(null);
        }}
        onSuccess={editingJob ? handleJobUpdated : handleJobCreated}
        editingJob={editingJob}
      />
    </motion.div>
  );
}
