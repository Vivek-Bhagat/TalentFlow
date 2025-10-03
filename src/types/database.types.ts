/**
 * Database entity types
 * Core data models for the TalentFlow application
 */

export interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract";
  status: "active" | "archived";
  description: string;
  requirements: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  tags: string[];
  order: number; // Display order (changes when reordered)
  createdAt: Date;
  updatedAt: Date;
  applicationCount: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  jobId: string;
  stage: "applied" | "screen" | "technical" | "offer" | "hired" | "rejected";
  rating: number;
  appliedAt: Date;
  updatedAt: Date;
  avatar?: string;
  skills: string[];
  experience: string;
  resume?: string;
  notes: Note[];
}

export interface Note {
  id: string;
  candidateId: string;
  content: string;
  author: string;
  mentions: string[];
  createdAt: Date;
}

export interface Assessment {
  id: string;
  jobId: string;
  title: string;
  description: string;
  sections: AssessmentSection[];
  timeLimit?: number;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  order: number;
}

export interface Question {
  id: string;
  type:
    | "single-choice"
    | "multi-choice"
    | "short-text"
    | "long-text"
    | "numeric"
    | "file-upload";
  text: string;
  description?: string;
  required: boolean;
  order: number;
  options?: string[]; // for choice questions
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  conditional?: {
    dependsOn: string; // question id
    showWhen: string; // value to match
  };
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  candidateId: string;
  responses: { [questionId: string]: any };
  submittedAt: Date;
  timeSpent: number; // in seconds
}

export interface TimelineEvent {
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
}

export interface Interview {
  id: string;
  candidateId: string;
  type: "phone" | "video" | "in-person" | "technical" | "final";
  scheduledAt: Date;
  duration: number; // in minutes
  interviewers: string[];
  location?: string;
  meetingLink?: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}
