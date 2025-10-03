import { BaseApiClient } from "./base";
import type { Job } from "@/types";

export class JobsApiClient extends BaseApiClient {
  async getJobs(
    params: {
      search?: string;
      status?: string;
      page?: number;
      pageSize?: number;
      sort?: string;
    } = {}
  ) {
    const searchParams = this.buildSearchParams(params);

    return this.request<{
      jobs: Job[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/jobs?${searchParams}`);
  }

  async createJob(job: Partial<Job>) {
    return this.request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(job),
    });
  }

  async updateJob(id: string, updates: Partial<Job>) {
    return this.request<Job>(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async reorderJob(id: string, fromOrder: number, toOrder: number) {
    return this.request<{ success: boolean }>(`/jobs/${id}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ fromOrder, toOrder }),
    });
  }
}

// Export singleton instance
export const jobsApi = new JobsApiClient();
