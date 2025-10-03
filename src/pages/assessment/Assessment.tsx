import { useState, useEffect, useMemo, memo, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  FileText,
  Clock,
  Users,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  Eye,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ArrowLeftCircle,
  ScanEye,
  Loader,
  Filter,
  ListFilterPlus,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Assessment, Job } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useAssessmentStorage } from "@/service/assessment-storage";

const AssessmentBuilder = lazy(
  () => import("@/components/Assessment/AssessmentBuilder")
);

const AssessmentCard = memo(
  ({
    assessment,
    job,
    onPreview,
    onEdit,
    onDuplicate,
    onDelete,
  }: {
    assessment: Assessment;
    job: Job | undefined;
    onPreview: (assessment: Assessment) => void;
    onEdit: (assessment: Assessment) => void;
    onDuplicate: (assessment: Assessment) => void;
    onDelete: (id: string) => void;
  }) => {
    const totalQuestions = assessment.sections.reduce(
      (total, section) => total + section.questions.length,
      0
    );

    return (
      <Card className="card-hover group h-full flex flex-col hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg text-foreground mb-1 line-clamp-2">
                {assessment.title}
              </CardTitle>
              {job && (
                <div className="space-y-0.5">
                  <p className="text-sm text-muted-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground/70">
                    Job ID: {assessment.jobId}
                  </p>
                </div>
              )}
              {!job && (
                <p className="text-xs text-muted-foreground/70">
                  Job ID: {assessment.jobId}
                </p>
              )}
            </div>
            <Badge
              className={cn(
                "status-badge ml-2 shrink-0",
                (assessment as any).isLocalDraft
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  : assessment.isPublished
                  ? "status-success"
                  : "status-pending"
              )}>
              {(assessment as any).isLocalDraft
                ? "Local Draft"
                : assessment.isPublished
                ? "Published"
                : "Draft"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 space-y-4">
            {/* Description */}
            {assessment.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {assessment.description}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <FileText className="mr-2 h-3 w-3 shrink-0" />
                <span>{assessment.sections.length} sections</span>
              </div>
              <div className="flex items-center">
                <Users className="mr-2 h-3 w-3 shrink-0" />
                <span>{totalQuestions} questions</span>
              </div>
              {assessment.timeLimit && (
                <div className="flex items-center">
                  <Clock className="mr-2 h-3 w-3 shrink-0" />
                  <span>{assessment.timeLimit} min limit</span>
                </div>
              )}
              <div className="text-xs">
                {(assessment as any).isLocalDraft
                  ? `Modified ${
                      (assessment as any).lastModified
                        ? new Date(
                            (assessment as any).lastModified
                          ).toLocaleDateString()
                        : "Recently"
                    }`
                  : `Updated ${new Date(
                      assessment.updatedAt
                    ).toLocaleDateString()}`}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-3 mt-auto ">
            <div className="flex gap-2 opacity-100  transition-opacity -ml-3.5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onPreview(assessment)}>
                <Eye className="mr-1 h-3 w-3" />
                Preview
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(assessment)}>
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDuplicate(assessment)}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(assessment.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

AssessmentCard.displayName = "AssessmentCard";

export default function Assessments() {
  const storage = useAssessmentStorage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [localDrafts, setLocalDrafts] = useState<Assessment[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("recent");
  const [currentView, setCurrentView] = useState<
    "list" | "builder" | "preview"
  >("list");
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(
    null
  );
  const [previewingAssessment, setPreviewingAssessment] =
    useState<Assessment | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { toast } = useToast();

  // Auto-save preview answers to localStorage
  useEffect(() => {
    if (
      !previewingAssessment ||
      !storage.isAvailable ||
      Object.keys(previewAnswers).length === 0
    ) {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      storage.saveCandidateResponses(previewingAssessment.id, previewAnswers);
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [previewAnswers, previewingAssessment, storage]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const itemsPerPage = 9;

  const fetchLocalDrafts = () => {
    if (!storage.isAvailable) {
      setLocalDrafts([]);
      return;
    }

    try {
      const draftEntries = storage.getAllAssessmentDrafts();
      const drafts = draftEntries.map((entry) => ({
        ...entry.assessment,
        isLocalDraft: true,
        lastModified: new Date(entry.timestamp),
      }));
      setLocalDrafts(drafts);
    } catch (err) {
      console.error("Error fetching local drafts:", err);
      setLocalDrafts([]);
    }
  };

  const fetchAssessments = async (force = false) => {
    if (
      !force &&
      initialLoadComplete &&
      assessments.length > 0 &&
      jobs.length > 0
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchParams: {
        pageSize: number;
        search?: string;
        jobId?: string;
        status?: string;
      } = {
        pageSize: 100,
      };

      if (debouncedSearchQuery && statusFilter !== "local-drafts") {
        searchParams.search = debouncedSearchQuery;
      }

      if (selectedJobId !== "all" && statusFilter !== "local-drafts") {
        searchParams.jobId = selectedJobId;
      }

      if (statusFilter !== "all" && statusFilter !== "local-drafts") {
        searchParams.status = statusFilter;
      }

      const [jobsResponse, assessmentsResponse] = await Promise.all([
        apiClient.getJobs({ pageSize: 100 }),
        apiClient.getAssessments(searchParams),
      ]);

      setJobs(jobsResponse.jobs);
      setAssessments(assessmentsResponse.assessments);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch assessments";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  useEffect(() => {
    fetchLocalDrafts();

    if (!initialLoadComplete) {
      fetchAssessments();
    }
  }, [initialLoadComplete]);

  useEffect(() => {
    const jobParam = searchParams.get("job");
    const editParam = searchParams.get("edit");
    const previewParam = searchParams.get("preview");

    if (jobParam && jobs.length > 0) {
      setSelectedJobId(jobParam);
      setCurrentView("builder");
      setEditingAssessment(null);
      setSearchParams({});
    } else if (
      editParam &&
      (assessments.length > 0 || localDrafts.length > 0)
    ) {
      const assessment = [...assessments, ...localDrafts].find(
        (a) => a.id === editParam
      );
      if (assessment) {
        setEditingAssessment(assessment);
        setCurrentView("builder");
        setSearchParams({});
      }
    } else if (
      previewParam &&
      (assessments.length > 0 || localDrafts.length > 0)
    ) {
      const assessment = [...assessments, ...localDrafts].find(
        (a) => a.id === previewParam
      );
      if (assessment) {
        handlePreviewAssessment(assessment);
        setSearchParams({});
      }
    }
  }, [searchParams, jobs, assessments, localDrafts, setSearchParams]);

  useEffect(() => {
    if (!initialLoadComplete) {
      return;
    }

    if (currentView === "list") {
      fetchLocalDrafts();
    }

    if (statusFilter !== "local-drafts") {
      const timer = setTimeout(() => {
        fetchAssessments(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    debouncedSearchQuery,
    selectedJobId,
    statusFilter,
    initialLoadComplete,
    currentView,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedJobId, statusFilter]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("talentflow_assessment_draft_")) {
        fetchLocalDrafts();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleCreateAssessment = () => {
    if (jobs.length === 0) {
      toast({
        title: "No Jobs Available",
        description: "Create a job first before adding assessments.",
        variant: "destructive",
      });
      return;
    }

    setEditingAssessment(null);
    setCurrentView("builder");
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setCurrentView("builder");
  };

  const handleBackToList = (shouldRefresh?: boolean | React.MouseEvent) => {
    if (previewingAssessment && storage.isAvailable) {
      storage.clearCandidateResponses(previewingAssessment.id);
    }

    setCurrentView("list");
    setEditingAssessment(null);
    setPreviewingAssessment(null);
    setPreviewAnswers({});
    setCurrentSectionIndex(0);
    setShowResults(false);

    if (typeof shouldRefresh === "boolean" && shouldRefresh) {
      fetchAssessments();
    }
  };

  const handleSaveAssessment = (savedAssessment?: Assessment) => {
    toast({
      title: "Success",
      description: "Assessment saved successfully",
    });

    if (savedAssessment) {
      if ((savedAssessment as any).isLocalDraft) {
        fetchLocalDrafts();
      } else {
        setAssessments((prevAssessments) => {
          const existingIndex = prevAssessments.findIndex(
            (a) => a.id === savedAssessment.id
          );
          if (existingIndex >= 0) {
            const updated = [...prevAssessments];
            updated[existingIndex] = savedAssessment;
            return updated;
          } else {
            return [...prevAssessments, savedAssessment];
          }
        });
      }
    } else {
      fetchAssessments(true);
      fetchLocalDrafts();
    }

    setCurrentView("list");
    setEditingAssessment(null);
  };

  const handlePreviewAssessment = (assessment: Assessment) => {
    let restoredAnswers = {};
    let restoredSectionIndex = 0;

    if (storage.isAvailable) {
      const responses = storage.loadCandidateResponses(assessment.id);
      if (responses && Object.keys(responses).length > 0) {
        restoredAnswers = responses;
        const questionIds = Object.keys(responses);
        if (questionIds.length > 0) {
          for (let i = assessment.sections.length - 1; i >= 0; i--) {
            const sectionQuestions = assessment.sections[i].questions;
            if (sectionQuestions.some((q) => questionIds.includes(q.id))) {
              restoredSectionIndex = i;
              break;
            }
          }
        }

        setTimeout(() => {
          toast({
            title: "Progress Restored",
            description: "Your previous assessment progress has been restored.",
            duration: 5000,
          });
        }, 100);
      }
    }

    setPreviewingAssessment(assessment);
    setPreviewAnswers(restoredAnswers);
    setCurrentSectionIndex(restoredSectionIndex);
    setShowResults(false);
    setCurrentView("preview");
  };

  const handleDeleteAssessment = async (id: string) => {
    const isLocalDraft = localDrafts.some((draft) => draft.id === id);

    if (isLocalDraft) {
      if (storage.isAvailable) {
        storage.clearAssessmentDraft(id);
        fetchLocalDrafts();
        toast({
          title: "Local Draft Deleted",
          description:
            "The local draft has been removed from your browser storage.",
        });
      }
    } else {
      toast({
        title: "Delete Assessment",
        description:
          "Delete functionality for server assessments would be implemented here",
      });
    }
  };

  const handleDuplicateAssessment = async (assessment: Assessment) => {
    // Create a copy WITHOUT an ID - backend will generate new ID
    const { id, createdAt, updatedAt, ...assessmentData } = assessment;

    const duplicated = {
      ...assessmentData,
      title: `${assessment.title} (Copy)`,
      isPublished: false,
    } as Assessment;

    toast({
      title: "Assessment Duplicated",
      description:
        "Review and save the duplicated assessment to create a copy.",
      duration: 4000,
    });

    setEditingAssessment(duplicated);
    setCurrentView("builder");
  };

  const filteredAssessments = useMemo(() => {
    let allAssessments: Assessment[] = [];

    if (statusFilter === "all") {
      allAssessments = [...assessments, ...localDrafts];
    } else if (statusFilter === "published") {
      allAssessments = assessments.filter((a) => a.isPublished);
    } else if (statusFilter === "draft") {
      allAssessments = assessments.filter((a) => !a.isPublished);
    } else if (statusFilter === "local-drafts") {
      allAssessments = localDrafts;
    }

    let filtered = allAssessments.filter((assessment) => {
      const matchesSearch =
        !debouncedSearchQuery ||
        assessment.title
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        assessment.description
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase());

      const matchesJob =
        selectedJobId === "all" || assessment.jobId === selectedJobId;

      return matchesSearch && matchesJob;
    });

    filtered = filtered.slice();
    if (sortOption === "recent") {
      filtered.sort((a, b) => {
        const aDate = (a as any).isLocalDraft
          ? new Date((a as any).lastModified).getTime()
          : new Date(a.updatedAt).getTime();
        const bDate = (b as any).isLocalDraft
          ? new Date((b as any).lastModified).getTime()
          : new Date(b.updatedAt).getTime();
        return bDate - aDate;
      });
    } else if (sortOption === "oldest") {
      filtered.sort((a, b) => {
        const aDate = (a as any).isLocalDraft
          ? new Date((a as any).lastModified).getTime()
          : new Date(a.updatedAt).getTime();
        const bDate = (b as any).isLocalDraft
          ? new Date((b as any).lastModified).getTime()
          : new Date(b.updatedAt).getTime();
        return aDate - bDate;
      });
    } else if (sortOption === "az") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === "za") {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    }

    return filtered;
  }, [
    assessments,
    localDrafts,
    debouncedSearchQuery,
    selectedJobId,
    statusFilter,
    sortOption,
  ]);

  const paginatedAssessments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssessments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssessments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);

  if (currentView === "builder") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {editingAssessment ? "Edit Assessment" : "Create Assessment"}
            </h1>
            <p className="text-muted-foreground">
              {editingAssessment
                ? "Modify your assessment"
                : "Build a custom assessment for your job"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="hover:bg-primary hover:text-white  transition-all duration-300 hover:tracking-wide">
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </Button>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Loading Builder
                </h3>
                <p className="text-muted-foreground">
                  Setting up assessment builder...
                </p>
              </div>
            </div>
          }>
          <AssessmentBuilder
            jobId={editingAssessment?.jobId || jobs[0]?.id}
            assessment={editingAssessment || undefined}
            jobs={jobs}
            onSave={handleSaveAssessment}
          />
        </Suspense>
      </div>
    );
  }

  if (currentView === "preview" && previewingAssessment) {
    const currentSection = previewingAssessment.sections[currentSectionIndex];
    const totalSections = previewingAssessment.sections.length;
    const isLastSection = currentSectionIndex === totalSections - 1;
    const progress = ((currentSectionIndex + 1) / totalSections) * 100;

    const handleAnswerChange = (questionId: string, answer: any) => {
      setPreviewAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }));
    };

    const handleNextSection = () => {
      if (isLastSection) {
        setShowResults(true);
        // Clear localStorage when assessment is completed
        if (storage.isAvailable) {
          storage.clearCandidateResponses(previewingAssessment.id);
        }
      } else {
        setCurrentSectionIndex((prev) => prev + 1);
      }
    };

    const handlePrevSection = () => {
      if (currentSectionIndex > 0) {
        setCurrentSectionIndex((prev) => prev - 1);
      }
    };

    const renderQuestionInput = (question: any) => {
      const answer = previewAnswers[question.id] || "";

      switch (question.type) {
        case "single-choice":
          return (
            <div className="space-y-3">
              {question.options?.map((option: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${question.id}-${index}`}
                    name={question.id}
                    value={option}
                    checked={answer === option}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <label
                    htmlFor={`${question.id}-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          );

        case "multi-choice":
          const selectedOptions = Array.isArray(answer) ? answer : [];
          return (
            <div className="space-y-3">
              {question.options?.map((option: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${question.id}-${index}`}
                    value={option}
                    checked={selectedOptions.includes(option)}
                    onChange={(e) => {
                      const newAnswer = e.target.checked
                        ? [...selectedOptions, option]
                        : selectedOptions.filter(
                            (item: string) => item !== option
                          );
                      handleAnswerChange(question.id, newAnswer);
                    }}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label
                    htmlFor={`${question.id}-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          );

        case "short-text":
          return (
            <Input
              value={answer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer..."
              className="mt-2"
            />
          );

        case "long-text":
          return (
            <Textarea
              value={answer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your detailed answer..."
              rows={4}
              className="mt-2"
            />
          );

        case "numeric":
          return (
            <Input
              type="number"
              value={answer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter a number..."
              className="mt-2"
            />
          );

        case "file-upload":
          return (
            <div className="mt-2">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleAnswerChange(question.id, file?.name || "");
                  }}
                  id={`file-${question.id}`}
                />
                <label
                  htmlFor={`file-${question.id}`}
                  className="cursor-pointer">
                  <div className="text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Click to upload a file</p>
                    {answer && (
                      <p className="text-xs mt-1">Selected: {answer}</p>
                    )}
                  </div>
                </label>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    if (showResults) {
      return (
        <div className="min-h-screen  p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg -mt-6">
                <div className="flex items-center justify-center mb-4 pt-2.5">
                  <CheckCircle className="h-16 w-16" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  Assessment Completed!
                </CardTitle>
                <p className="text-green-100 mt-2 pb-4">
                  Thank you for completing the assessment preview.
                </p>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div className="text-center space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900">
                        Total Questions
                      </h3>
                      <p className="text-2xl font-bold text-blue-700">
                        {previewingAssessment.sections.reduce(
                          (total, section) => total + section.questions.length,
                          0
                        )}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900">Answered</h3>
                      <p className="text-2xl font-bold text-green-700">
                        {Object.keys(previewAnswers).length}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900">
                        Sections
                      </h3>
                      <p className="text-2xl font-bold text-purple-700">
                        {previewingAssessment.sections.length}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={handleBackToList}
                      size="lg"
                      className="hover:tracking-wide transition-all duration-300">
                      <ArrowLeftCircle className="h-4 w-4 " />
                      Back to Assessments
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowResults(false);
                        setCurrentSectionIndex(0);
                        setPreviewAnswers({});
                      }}
                      size="lg">
                      Restart Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Assessment preview component page
    return (
      <div className="min-h-screen bg-gradient-to-br  p-4 sm:p-6">
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Assessments</span>
            </Button>
            <Badge
              variant="outline"
              className=" p-2 bg-green-600 text-white ">
              <ScanEye className="h-4 w-4 " />
              Preview Mode
            </Badge>
          </div>

          {/* Assessment Info */}

          <div className="border-2 p-6 rounded-lg">
            <Card className="mb-6 border-none shadow-none">
              <CardHeader className=" rounded-t-lg -mt-6">
                <CardTitle className="text-xl sm:text-2xl font-bold py-2 text-center pt-6">
                  {previewingAssessment.title}
                </CardTitle>
                {previewingAssessment.description && (
                  <p className="text-center text-muted-foreground pb-2 sm:text-sm">
                    {previewingAssessment.description}
                  </p>
                )}
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mt-4">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Instructions
                  </h3>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5 list-disc list-inside">
                    <li>Read each question carefully before answering</li>
                    <li>
                      Questions marked with{" "}
                      <span className="text-red-500">*</span> are required
                    </li>
                    <li>
                      You can navigate between sections using the Previous/Next
                      buttons
                    </li>
                    <li>
                      Your progress is automatically saved as you complete each
                      section
                    </li>
                    <li>
                      Some questions may appear based on your previous answers
                    </li>
                    <li>
                      Click "Submit Assessment" after completing the final
                      section
                    </li>
                  </ul>
                </div>
              </CardHeader>
              <CardContent className="py-0 px-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>
                    Section {currentSectionIndex + 1} of {totalSections}
                  </span>
                  {previewingAssessment.timeLimit && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{previewingAssessment.timeLimit} minutes</span>
                    </div>
                  )}
                </div>
                <Progress
                  value={progress}
                  className="h-2"
                />
              </CardContent>
            </Card>

            {/* Current Section */}
            {currentSection && (
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    {currentSection.title}
                  </CardTitle>
                  {currentSection.description && (
                    <p className="text-muted-foreground">
                      {currentSection.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentSection.questions.map((question, index) => {
                    // Conditional question logic
                    if (question.conditional) {
                      const dependsOnId = question.conditional.dependsOn;
                      const showWhen = question.conditional.showWhen;
                      const dependsOnAnswer = previewAnswers[dependsOnId];
                      if (
                        dependsOnId &&
                        showWhen !== undefined &&
                        showWhen !== ""
                      ) {
                        // Only show if the answer matches showWhen (string match or array includes for multi-choice)
                        const isVisible = Array.isArray(dependsOnAnswer)
                          ? dependsOnAnswer.includes(showWhen)
                          : dependsOnAnswer === showWhen;
                        if (!isVisible) return null;
                      }
                    }
                    return (
                      <div
                        key={question.id}
                        className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-1">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">
                              {question.text}
                              {question.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </h3>
                            {question.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {question.description}
                              </p>
                            )}
                            <div className="mt-3">
                              {renderQuestionInput(question)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
                <CardContent className="pt-0">
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevSection}
                      disabled={currentSectionIndex === 0}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleNextSection}
                      className="hover:bg-green-600">
                      {isLastSection ? (
                        <>
                          Submit Assessment
                          <CheckCircle className="h-4 w-4 ml-2 " />
                        </>
                      ) : (
                        <>
                          Next Section
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Assessments</h1>
            <p className="text-muted-foreground">
              Create and manage candidate assessments
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Failed to load assessments
            </h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={() => fetchAssessments(true)}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      <motion.div
        className="flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        <div>
          <h1 className="text-2xl font-bold text-primary">Assessments</h1>
          <p className="text-muted-foreground">
            Create and manage candidate assessments
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          <Button onClick={handleCreateAssessment}>
            <Plus className="mr-2 h-4 w-4" />
            Create Assessment
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <div className="border-none bg-transparent ">
        <CardContent className="py-0 px-0">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assessments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Select
                value={selectedJobId}
                onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-30">
                  <ListFilterPlus className="h-4 w-4 " />
                  <SelectValue placeholder="Filter by job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem
                      key={job.id}
                      value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}>
                <SelectTrigger className="w-30">
                  <Filter />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assessments</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Server Drafts</SelectItem>
                  <SelectItem value="local-drafts">Local Drafts</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortOption}
                onValueChange={setSortOption}>
                <SelectTrigger className="w-30">
                  <SlidersHorizontal />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="az">Title A-Z</SelectItem>
                  <SelectItem value="za">Title Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </div>

      {loading && !initialLoadComplete && (
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}>
            <Loader className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Loading Assessments
            </h3>
            <p className="text-muted-foreground">
              Fetching your assessment data...
            </p>
          </motion.div>
        </div>
      )}

      {(!loading || initialLoadComplete) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
            {paginatedAssessments.map((assessment) => {
              const job = jobs.find((j) => j.id === assessment.jobId);

              return (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  job={job}
                  onPreview={handlePreviewAssessment}
                  onEdit={handleEditAssessment}
                  onDuplicate={handleDuplicateAssessment}
                  onDelete={handleDeleteAssessment}
                />
              );
            })}
          </div>

          {filteredAssessments.length === 0 && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No assessments found
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery || (selectedJobId && selectedJobId !== "all")
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first assessment"}
                </p>
                {!searchQuery &&
                  (!selectedJobId || selectedJobId === "all") && (
                    <Button onClick={handleCreateAssessment}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Assessment
                    </Button>
                  )}
              </CardContent>
            </Card>
          )}

          {filteredAssessments.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAssessments.length}
            />
          )}
        </>
      )}
    </motion.div>
  );
}
