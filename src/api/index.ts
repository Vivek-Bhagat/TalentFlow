import { jobsApi } from "./jobs";
import { candidatesApi } from "./candidates";
import { assessmentsApi } from "./assessments";

// Main API client that combines all route modules
class ApiClient {
  // Jobs API methods
  getJobs = jobsApi.getJobs.bind(jobsApi);
  createJob = jobsApi.createJob.bind(jobsApi);
  updateJob = jobsApi.updateJob.bind(jobsApi);
  reorderJob = jobsApi.reorderJob.bind(jobsApi);

  // Candidates API methods
  getCandidates = candidatesApi.getCandidates.bind(candidatesApi);
  createCandidate = candidatesApi.createCandidate.bind(candidatesApi);
  getCandidate = candidatesApi.getCandidate.bind(candidatesApi);
  updateCandidate = candidatesApi.updateCandidate.bind(candidatesApi);
  getCandidateTimeline = candidatesApi.getCandidateTimeline.bind(candidatesApi);

  // Assessments API methods
  getAssessments = assessmentsApi.getAssessments.bind(assessmentsApi);
  getAssessment = assessmentsApi.getAssessment.bind(assessmentsApi);
  saveAssessment = assessmentsApi.saveAssessment.bind(assessmentsApi);
  submitAssessmentResponse =
    assessmentsApi.submitAssessmentResponse.bind(assessmentsApi);
}

// Export singleton instance for backward compatibility
export const apiClient = new ApiClient();

// Export individual API modules for more granular imports
export { jobsApi } from "./jobs";
export { candidatesApi } from "./candidates";
export { assessmentsApi } from "./assessments";
export { BaseApiClient } from "./base";

// Export types for route parameters and responses
export type { JobsApiClient } from "./jobs";
export type { CandidatesApiClient } from "./candidates";
export type { AssessmentsApiClient } from "./assessments";
