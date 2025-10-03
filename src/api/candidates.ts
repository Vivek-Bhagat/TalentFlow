import { BaseApiClient } from "./base";
import type { Candidate } from "@/types";

export class CandidatesApiClient extends BaseApiClient {
  async getCandidates(
    params: {
      search?: string;
      stage?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    const searchParams = this.buildSearchParams(params);

    return this.request<{
      candidates: Candidate[];
      total: number;
    }>(`/candidates?${searchParams}`);
  }

  async createCandidate(candidate: Partial<Candidate>) {
    return this.request<Candidate>("/candidates", {
      method: "POST",
      body: JSON.stringify(candidate),
    });
  }

  async getCandidate(id: string) {
    return this.request<Candidate>(`/candidates/${id}`);
  }

  async updateCandidate(id: string, updates: Partial<Candidate>) {
    return this.request<Candidate>(`/candidates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async getCandidateTimeline(id: string) {
    return this.request<
      Array<{
        id: string;
        type: string;
        from?: string;
        to?: string;
        timestamp: Date;
        note: string;
      }>
    >(`/candidates/${id}/timeline`);
  }
}

// Export singleton instance
export const candidatesApi = new CandidatesApiClient();
