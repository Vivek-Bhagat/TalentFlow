/**
 * Assessment-related types
 */

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  submittedAt: Date;
  timeSpent: number; // in seconds
  sections: AssessmentSectionResult[];
}

export interface AssessmentSectionResult {
  sectionId: string;
  sectionTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  questions: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: string;
  candidateAnswer: any;
  correctAnswer?: any;
  isCorrect?: boolean;
  points: number;
  maxPoints: number;
  feedback?: string;
}
