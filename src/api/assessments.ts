import { BaseApiClient } from "./base";
import type { Assessment } from "@/types";

export class AssessmentsApiClient extends BaseApiClient {
  async getAssessments(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    jobId?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.pageSize)
      searchParams.set("pageSize", params.pageSize.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.jobId && params.jobId !== "all")
      searchParams.set("jobId", params.jobId);
    if (params?.status && params.status !== "all")
      searchParams.set("status", params.status);

    const url = `/assessments${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    return this.request<{
      assessments: Assessment[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(url);
  }

  async getAssessment(jobId: string) {
    return this.request<Assessment | null>(`/assessments/${jobId}`);
  }

  async saveAssessment(jobId: string, assessment: Partial<Assessment>) {
    return this.request<Assessment>(`/assessments/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(assessment),
    });
  }

  async submitAssessmentResponse(
    jobId: string,
    response: {
      assessmentId: string;
      candidateId: string;
      responses: { [questionId: string]: any };
      timeSpent?: number;
    }
  ) {
    return this.request<any>(`/assessments/${jobId}/submit`, {
      method: "POST",
      body: JSON.stringify(response),
    });
  }
}

// Export singleton instance
export const assessmentsApi = new AssessmentsApiClient();
