/**
 * Component prop types
 */

import type {
  Job,
  Candidate,
  Assessment,
  Interview,
  Note,
} from "./database.types";
import type { AssessmentResult } from "./assessment.types";

// Job component props
export interface GridJobCardProps {
  job: Job;
  orderNumber: number;
  onArchiveToggle: (job: Job) => void;
  archivingJob: string | null;
  onView: (job: Job) => void;
}

export interface ListJobRowProps {
  job: Job;
  orderNumber: number;
  onArchiveToggle: (job: Job) => void;
  archivingJob: string | null;
  onView: (job: Job) => void;
  isReorderMode?: boolean;
}

export interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (job: Job) => void;
  onArchiveToggle: (job: Job) => void;
}

export interface JobFormData {
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract";
  description: string;
  requirements: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  tags: string[];
}

export interface JobCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (job: Job) => void;
  editingJob?: Job | null;
}

export interface JobAnalyticsProps {
  jobs: Job[];
  className?: string;
}

// Candidate component props
export interface VirtualizedCandidateListProps {
  candidates: Candidate[];
  loading?: boolean;
  onCandidateClick?: (candidate: Candidate) => void;
}

export interface CandidateItemProps {
  candidate: Candidate;
  onCandidateClick?: (candidate: Candidate) => void;
}

export interface NotesManagerProps {
  candidateId: string;
  notes: Note[];
  onAddNote?: (note: Omit<Note, "id" | "createdAt">) => void;
}

export interface InterviewSchedulerProps {
  candidateId: string;
  interviews?: Interview[];
  onSchedule?: (
    interview: Omit<Interview, "id" | "createdAt" | "updatedAt">
  ) => void;
}

export interface AssessmentResultsProps {
  candidateId: string;
  assessmentResults?: AssessmentResult[];
}

// Kanban component props
export interface CandidateKanbanProps {
  jobId?: string;
}

// Assessment component props
export interface AssessmentBuilderProps {
  jobId: string;
  assessment?: Assessment;
  onSave?: (assessment: Assessment) => void;
}

// UI component props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

export interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
  glow?: boolean;
  [key: string]: unknown;
}
