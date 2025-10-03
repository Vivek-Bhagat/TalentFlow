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
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  Download,
  Edit,
  Clock,
  User,
  FileText,
  Activity,
  Loader,
  AlertCircle,
  CalendarPlus,
  Users,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Candidate, Job } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";

// Lazy load heavy components to improve initial load time
const InterviewScheduler = lazy(
  () => import("@/components/Candidates/InterviewScheduler")
);
const NotesManager = lazy(() => import("@/components/Candidates/NotesManager"));
const AssessmentResults = lazy(
  () => import("@/components/Candidates/CandidatesAssessmentResults")
);

// Import types separately to avoid loading components
import type { Note } from "@/components/Candidates/NotesManager";
import type { AssessmentResult } from "@/components/Candidates/CandidatesAssessmentResults";

// Memoized Interview Card component for better performance
const InterviewCard = memo(
  ({ interview, index = 0 }: { interview: Interview; index?: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}>
      <Card>
        <CardContent className="pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
            <div className="space-y-1 flex-1 min-w-0">
              <h4 className="font-medium text-foreground text-sm sm:text-base">
                {interview.title}
              </h4>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {interview.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {interview.duration} minutes
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">
                    {interview.interviewers.join(", ")}
                  </span>
                </span>
              </div>
              {interview.location && (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{interview.location}</span>
                </p>
              )}
            </div>
            <Badge
              className={cn(
                "status-badge text-xs flex-shrink-0",
                interview.status === "completed"
                  ? "status-success"
                  : interview.status === "scheduled"
                  ? "status-pending"
                  : interview.status === "cancelled"
                  ? "status-rejected"
                  : "status-warning"
              )}>
              {interview.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
);

InterviewCard.displayName = "InterviewCard";

interface TimelineEvent {
  id: string;
  candidateId: string;
  type:
    | "stage_change"
    | "note_added"
    | "interview_scheduled"
    | "interview_completed"
    | "assessment_completed"
    | "application_submitted"
    | "email_sent"
    | "call_made";
  title: string;
  description?: string;
  from?: string;
  to?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdBy?: string;
  note?: string; // For backward compatibility
}

interface Interview {
  id: string;
  candidateId: string;
  type: "phone" | "video" | "in-person" | "technical" | "final";
  title: string;
  date: Date;
  duration: number;
  location?: string;
  meetingLink?: string;
  interviewers: string[];
  notes?: string;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
}

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<
    AssessmentResult[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);
  const [appliedJob, setAppliedJob] = useState<Job | null>(null);

  const fetchCandidate = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const [candidateData, timelineData] = await Promise.all([
        apiClient.getCandidate(id),
        apiClient.getCandidateTimeline(id),
      ]);

      setCandidate(candidateData);
      // Cast timeline data to our interface
      setTimeline(timelineData as TimelineEvent[]);

      // Fetch the job details for the applied position
      if (candidateData.jobId) {
        try {
          const jobsResponse = await apiClient.getJobs({
            page: 1,
            pageSize: 1000,
          });
          const job = jobsResponse.jobs.find(
            (j) => j.id === candidateData.jobId
          );
          if (job) {
            setAppliedJob(job);
          }
        } catch (err) {
          console.error("Failed to fetch job details:", err);
        }
      }

      // Mock data for notes, interviews, and assessments
      // In a real app, these would come from API calls
      setNotes([
        {
          id: "1",
          candidateId: id,
          content:
            "Had a great initial phone screening. Strong technical background and good communication skills.",
          author: "Sarah Johnson",
          mentions: [],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isPinned: true,
          isPrivate: false,
          tags: [],
          type: "interview",
        },
        {
          id: "2",
          candidateId: id,
          content:
            "Excellent problem-solving approach during the technical interview. Shows deep understanding of React and Node.js.",
          author: "Mike Chen",
          mentions: [],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          isPinned: false,
          isPrivate: false,
          tags: [],
          type: "technical",
        },
      ]);

      setInterviews([
        {
          id: "1",
          candidateId: id,
          type: "phone",
          title: "Initial Phone Screening",
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          duration: 30,
          interviewers: ["Sarah Johnson"],
          status: "completed",
        },
        {
          id: "2",
          candidateId: id,
          type: "technical",
          title: "Technical Interview - Frontend",
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          duration: 90,
          interviewers: ["Mike Chen", "Alex Rodriguez"],
          status: "completed",
        },
      ]);

      // Mock assessment results
      if (candidateData.stage !== "applied") {
        setAssessmentResults([
          {
            id: "1",
            assessmentId: "assess-1",
            assessmentTitle: "Frontend Developer Assessment",
            candidateId: id,
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            timeSpent: 3600, // 1 hour
            totalQuestions: 25,
            answeredQuestions: 25,
            score: 85,
            maxScore: 100,
            status: "completed",
            sections: [
              {
                id: "section-1",
                sectionTitle: "JavaScript Fundamentals",
                questions: [],
                score: 45,
                maxScore: 50,
                timeSpent: 1200,
              },
              {
                id: "section-2",
                sectionTitle: "React & Components",
                questions: [],
                score: 40,
                maxScore: 50,
                timeSpent: 2400,
              },
            ],
          },
        ]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch candidate";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const handleInterviewScheduled = useCallback((interview: Interview) => {
    setInterviews((prev) => [...prev, interview]);

    // Add timeline event
    const timelineEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      candidateId: id || "",
      type: "interview_scheduled",
      title: "Interview scheduled",
      description: `${
        interview.title
      } scheduled for ${interview.date.toLocaleDateString()}`,
      timestamp: new Date(),
      createdBy: "system",
    };
    setTimeline((prev) => [timelineEvent, ...prev]);
  }, []);

  const handleNoteAdded = useCallback(
    (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
      const newNote: Note = {
        ...note,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNotes((prev) => [newNote, ...prev]);
    },
    []
  );

  const handleNoteUpdated = useCallback(
    (noteId: string, updates: Partial<Note>) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId ? { ...note, ...updates } : note
        )
      );
    },
    []
  );

  const handleNoteDeleted = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  }, []);

  const handleAssessmentView = useCallback(
    (_result: AssessmentResult) => {
      toast({
        title: "Assessment Details",
        description: "Assessment details view would open here",
      });
    },
    [toast]
  );

  const handleAssessmentDownload = useCallback(
    (_result: AssessmentResult) => {
      toast({
        title: "Download Started",
        description: "Assessment report download would start here",
      });
    },
    [toast]
  );

  // Memoized navigation handlers
  const handleBackToList = useCallback(() => {
    navigate("/app/candidates/list");
  }, [navigate]);

  const handleToggleInterviewScheduler = useCallback(() => {
    setShowInterviewScheduler((prev) => !prev);
  }, []);

  const handleCloseInterviewScheduler = useCallback(() => {
    setShowInterviewScheduler(false);
  }, []);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  // Memoized computed values for better performance
  const statusBadge = useMemo(() => {
    if (!candidate) return null;

    const getStatusBadge = (stage: string) => {
      switch (stage) {
        case "applied":
          return <Badge className="status-badge status-pending">Applied</Badge>;
        case "screen":
          return (
            <Badge className="status-badge status-pending">Screening</Badge>
          );
        case "technical":
          return (
            <Badge className="status-badge status-warning">Technical</Badge>
          );
        case "offer":
          return <Badge className="status-badge status-success">Offer</Badge>;
        case "hired":
          return <Badge className="status-badge status-success">Hired</Badge>;
        case "rejected":
          return (
            <Badge className="status-badge status-rejected">Rejected</Badge>
          );
        default:
          return <Badge className="status-badge">{stage}</Badge>;
      }
    };

    return getStatusBadge(candidate.stage);
  }, [candidate?.stage]);

  const candidateInitials = useMemo(() => {
    if (!candidate) return "";

    return candidate.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }, [candidate?.name]);

  // Memoized timeline events formatting
  const formattedTimelineEvents = useMemo(() => {
    const formatTimelineEvent = (event: TimelineEvent) => {
      switch (event.type) {
        case "stage_change":
          return {
            icon: <Activity className="h-4 w-4" />,
            title:
              event.title ||
              (event.from
                ? `Moved from ${event.from} to ${event.to}`
                : `Application ${event.to}`),
            description: event.description || event.note,
            color: "bg-blue-100 text-blue-600 border-blue-200",
          };
        case "application_submitted":
          return {
            icon: <FileText className="h-4 w-4" />,
            title: event.title || "Application submitted",
            description:
              event.description || "Candidate submitted their application",
            color: "bg-green-100 text-green-600 border-green-200",
          };
        case "interview_scheduled":
          return {
            icon: <CalendarPlus className="h-4 w-4" />,
            title: event.title || "Interview scheduled",
            description:
              event.description || "New interview has been scheduled",
            color: "bg-purple-100 text-purple-600 border-purple-200",
          };
        case "interview_completed":
          return {
            icon: <Users className="h-4 w-4" />,
            title: event.title || "Interview completed",
            description: event.description || "Interview session completed",
            color: "bg-indigo-100 text-indigo-600 border-indigo-200",
          };
        case "note_added":
          return {
            icon: <MessageSquare className="h-4 w-4" />,
            title: event.title || "Note added",
            description:
              event.description || "New note added to candidate profile",
            color: "bg-yellow-100 text-yellow-600 border-yellow-200",
          };
        case "assessment_completed":
          return {
            icon: <FileText className="h-4 w-4" />,
            title: event.title || "Assessment completed",
            description: event.description || "Candidate completed assessment",
            color: "bg-orange-100 text-orange-600 border-orange-200",
          };
        case "email_sent":
          return {
            icon: <Mail className="h-4 w-4" />,
            title: event.title || "Email sent",
            description: event.description || "Email communication sent",
            color: "bg-cyan-100 text-cyan-600 border-cyan-200",
          };
        case "call_made":
          return {
            icon: <Phone className="h-4 w-4" />,
            title: event.title || "Call made",
            description: event.description || "Phone call conducted",
            color: "bg-pink-100 text-pink-600 border-pink-200",
          };
        default:
          return {
            icon: <Clock className="h-4 w-4" />,
            title: event.title || event.note || "Timeline event",
            description: event.description || "",
            color: "bg-gray-100 text-gray-600 border-gray-200",
          };
      }
    };

    return timeline
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .map((event) => ({
        ...event,
        formatted: formatTimelineEvent(event),
      }));
  }, [timeline]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Candidates
          </Button>
        </div>

        <div className="flex items-center justify-center py-12">
          <Loader className="h-18 w-18 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">
            Loading candidate profile...
          </span>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Candidates
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {error || "Candidate not found"}
            </h3>
            <Button onClick={fetchCandidate}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto  p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="self-start">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Candidates
          </Button>
        </motion.div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 sm:flex-initial">
            <Button
              variant="outline"
              onClick={handleToggleInterviewScheduler}
              className="w-full">
              <CalendarPlus className="mr-2 h-4 w-4 text-blue-500" />
              <span className="hidden xs:inline">Schedule Interview</span>
              <span className="xs:hidden">Schedule</span>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 sm:flex-initial">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  aria-label="Send Message">
                  <MessageSquare className="mr-2 h-4 w-4 text-yellow-500" />
                  <span className="hidden sm:inline">Send Message</span>
                  <span className="sm:hidden">Message</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                className="w-80 p-4 "
                sideOffset={8}>
                <div className="mb-2 font-semibold text-foreground">
                  Send Message to Candidate
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // TODO: Implement send message logic
                  }}
                  className="space-y-2">
                  <textarea
                    className="w-full  rounded p-2 text-sm resize-none min-h-[60px]"
                    placeholder="Type your message..."
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="">
                      Send
                      <Send className="h-4 w-4 mr-1" />
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 sm:flex-initial">
            <Button
              variant="outline"
              className="w-full">
              <Download className="mr-2 h-4 w-4 text-green-500" />
              <span className="hidden sm:inline ">Download Resume</span>
              <span className="sm:hidden">Download</span>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 sm:flex-initial">
            <Button
              variant={"outline"}
              className="w-full">
              <Edit className="mr-2 h-4 w-4 text-purple-500" />
              <span className="hidden sm:inline ">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}>
        <Card className="pt-0">
          <CardContent className="pt-3 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}>
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 self-center sm:self-start">
                  <AvatarImage src={candidate.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl">
                    {candidateInitials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              <div className="flex-1 w-full">
                <motion.div
                  className="text-center sm:text-left mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    {candidate.name}
                  </h1>
                  <p className="text-lg sm:text-xl text-muted-foreground mb-2">
                    {candidate.position}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 mb-3">
                    <span className="text-sm sm:text-base">Status:</span>
                    {statusBadge}
                  </div>
                </motion.div>

                {/* Contact Information */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}>
                  <motion.div
                    className="flex items-center justify-center sm:justify-start"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}>
                    <Mail className="mr-2 h-4 w-4  flex-shrink-0 text-blue-500" />
                    <span className="truncate">{candidate.email}</span>
                  </motion.div>
                  <motion.div
                    className="flex items-center justify-center sm:justify-start"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}>
                    <Phone className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="truncate">{candidate.phone}</span>
                  </motion.div>
                  <motion.div
                    className="flex items-center justify-center sm:justify-start sm:col-span-2 lg:col-span-1"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}>
                    <MapPin className="mr-2 h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span className="truncate">{candidate.location}</span>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}>
        <Tabs
          defaultValue="overview"
          className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm ">
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="text-xs sm:text-sm">
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              className="text-xs sm:text-sm">
              Assessments
            </TabsTrigger>
            <TabsTrigger
              value="interviews"
              className="text-xs sm:text-sm">
              Interviews
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="text-xs sm:text-sm col-span-2 sm:col-span-1">
              Notes
            </TabsTrigger>
          </TabsList>
          {/* // Overview Tab */}
          <TabsContent
            value="overview"
            className="space-y-4 sm:space-y-6 ">
            <motion.div
              className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}>
              {/* Skills & Experience */}
              <motion.div
                className="xl:col-span-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.01 }}>
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      Skills & Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                    <div>
                      <h4 className="font-medium mb-2 text-sm sm:text-base text-green-500">
                        Experience
                      </h4>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        {candidate.experience} of professional experience
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3 text-sm sm:text-base text-purple-500">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {candidate.skills.map((skill, index) => (
                          <motion.div
                            key={skill}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.05 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}>
                            <Badge
                              variant="outline"
                              className="text-xs sm:text-sm px-2 py-1 text-muted-foreground rounded-3xl border-blue-600 ">
                              {skill}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Application Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                whileHover={{ scale: 1.01 }}>
                <Card>
                  <CardHeader className="pb-3 sm:pb-6 lg:pb-5">
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      Application Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Applied
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-right text-blue-500">
                        {new Date(candidate.appliedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Last Updated
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-right">
                        {new Date(candidate.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Current Stage
                      </span>
                      <span className="text-xs sm:text-sm font-medium capitalize text-right">
                        {candidate.stage}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Applied Job
                      </span>
                      <span className="text-xs sm:text-sm font-medium capitalize text-right">
                        {appliedJob?.title || candidate.position || "N/A"}
                      </span>
                    </div>
                    {candidate.jobId && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          Job ID
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-right">
                          {candidate.jobId}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>{" "}
          <TabsContent
            value="timeline"
            className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}>
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    <span className="text-purple-500">
                      Application Timeline
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {formattedTimelineEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No timeline events yet
                        </p>
                      </div>
                    ) : (
                      formattedTimelineEvents.map((event, index) => (
                        <motion.div
                          key={event.id}
                          className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-border last:border-0"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.4 }}
                          whileHover={{ x: 5, transition: { duration: 0.2 } }}>
                          <motion.div
                            className={cn(
                              "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border",
                              event.formatted.color
                            )}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              delay: 0.15 * index,
                              type: "spring",
                              stiffness: 200,
                            }}>
                            {event.formatted.icon}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-foreground text-sm sm:text-base">
                                {event.formatted.title}
                              </h4>
                              {event.createdBy && (
                                <span className="text-xs text-muted-foreground">
                                  by {event.createdBy}
                                </span>
                              )}
                            </div>
                            {event.formatted.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                                {event.formatted.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(event.timestamp).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          <TabsContent
            value="assessments"
            className="space-y-6">
            <Suspense
              fallback={
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">
                      Loading assessment results...
                    </span>
                  </CardContent>
                </Card>
              }>
              <AssessmentResults
                results={assessmentResults}
                onViewDetails={handleAssessmentView}
                onDownloadReport={handleAssessmentDownload}
              />
            </Suspense>
          </TabsContent>
          <TabsContent
            value="interviews"
            className="space-y-4 sm:space-y-6">
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}>
              <div>
                <h3 className="text-base sm:text-lg font-medium text-foreground">
                  Interview History
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Track all interviews and schedule new ones
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleToggleInterviewScheduler}
                  className="self-start sm:self-auto">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Schedule Interview</span>
                  <span className="sm:hidden">Schedule</span>
                </Button>
              </motion.div>
            </motion.div>

            {interviews.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                      No Interviews Scheduled
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-sm">
                      Start the interview process by scheduling the first
                      interview
                    </p>
                    <Button onClick={handleToggleInterviewScheduler}>
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Schedule First Interview
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {interviews.map((interview, index) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent
            value="notes"
            className="space-y-6">
            <Suspense
              fallback={
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">
                      Loading notes manager...
                    </span>
                  </CardContent>
                </Card>
              }>
              <NotesManager
                candidateId={id!}
                notes={notes}
                onAddNote={handleNoteAdded}
                onUpdateNote={handleNoteUpdated}
                onDeleteNote={handleNoteDeleted}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Interview Scheduler Modal */}
      {showInterviewScheduler && (
        <Suspense fallback={<div />}>
          <InterviewScheduler
            candidateId={id!}
            candidateName={candidate?.name || ""}
            isOpen={showInterviewScheduler}
            onClose={handleCloseInterviewScheduler}
            onScheduled={handleInterviewScheduled}
            existingInterviews={interviews}
          />
        </Suspense>
      )}
    </motion.div>
  );
}
