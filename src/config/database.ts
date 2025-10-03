import Dexie, { type Table } from "dexie";
import type {
  Job,
  Candidate,
  Note,
  Assessment,
  AssessmentResponse,
  TimelineEvent,
} from "@/types";

// Re-export types for backward compatibility
export type {
  Job,
  Candidate,
  Note,
  Assessment,
  AssessmentSection,
  Question,
  AssessmentResponse,
  TimelineEvent,
} from "@/types";

export class TalentFlowDatabase extends Dexie {
  jobs!: Table<Job>;
  candidates!: Table<Candidate>;
  notes!: Table<Note>;
  assessments!: Table<Assessment>;
  assessmentResponses!: Table<AssessmentResponse>;
  timelineEvents!: Table<TimelineEvent>;

  constructor() {
    super("TalentFlowDatabase");
    this.version(1).stores({
      jobs: "++id, title, slug, department, status, order, createdAt",
      candidates: "++id, name, email, jobId, stage, appliedAt",
      notes: "++id, candidateId, createdAt",
      assessments: "++id, jobId, createdAt",
      assessmentResponses: "++id, assessmentId, candidateId, submittedAt",
      timelineEvents: "++id, candidateId, type, timestamp",
    });
  }
}

export const db = new TalentFlowDatabase();
