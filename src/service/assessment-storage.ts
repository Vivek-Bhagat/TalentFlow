import type { Assessment } from "@/types";

// Storage keys
const STORAGE_KEYS = {
  ASSESSMENT_DRAFT: "talentflow_assessment_draft_",
  CANDIDATE_RESPONSES: "talentflow_responses_",
  PREVIEW_STATE: "talentflow_preview_state_",
} as const;

// Utility functions for localStorage with error handling
class AssessmentStorage {
  // Assessment Builder State Management
  static saveAssessmentDraft(assessment: Assessment): boolean {
    try {
      const key = `${STORAGE_KEYS.ASSESSMENT_DRAFT}${assessment.id}`;
      const data = {
        assessment,
        timestamp: Date.now(),
        version: "1.0",
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Failed to save assessment draft:", error);
      return false;
    }
  }

  static loadAssessmentDraft(assessmentId: string): Assessment | null {
    try {
      const key = `${STORAGE_KEYS.ASSESSMENT_DRAFT}${assessmentId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data = JSON.parse(stored);

      // Convert date strings back to Date objects
      if (data.assessment) {
        data.assessment.createdAt = new Date(data.assessment.createdAt);
        data.assessment.updatedAt = new Date(data.assessment.updatedAt);
        return data.assessment;
      }
      return null;
    } catch (error) {
      console.error("Failed to load assessment draft:", error);
      return null;
    }
  }

  static clearAssessmentDraft(assessmentId: string): boolean {
    try {
      const key = `${STORAGE_KEYS.ASSESSMENT_DRAFT}${assessmentId}`;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to clear assessment draft:", error);
      return false;
    }
  }

  static getAllAssessmentDrafts(): Array<{
    id: string;
    assessment: Assessment;
    timestamp: number;
  }> {
    const drafts: Array<{
      id: string;
      assessment: Assessment;
      timestamp: number;
    }> = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEYS.ASSESSMENT_DRAFT)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            if (data.assessment) {
              data.assessment.createdAt = new Date(data.assessment.createdAt);
              data.assessment.updatedAt = new Date(data.assessment.updatedAt);
              drafts.push({
                id: data.assessment.id,
                assessment: data.assessment,
                timestamp: data.timestamp,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to get assessment drafts:", error);
    }

    return drafts.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Candidate Response Management
  static saveCandidateResponses(
    assessmentId: string,
    responses: Record<string, any>
  ): boolean {
    try {
      const key = `${STORAGE_KEYS.CANDIDATE_RESPONSES}${assessmentId}`;
      const data = {
        responses,
        timestamp: Date.now(),
        assessmentId,
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Failed to save candidate responses:", error);
      return false;
    }
  }

  static loadCandidateResponses(assessmentId: string): Record<string, any> {
    try {
      const key = `${STORAGE_KEYS.CANDIDATE_RESPONSES}${assessmentId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return {};

      const data = JSON.parse(stored);
      return data.responses || {};
    } catch (error) {
      console.error("Failed to load candidate responses:", error);
      return {};
    }
  }

  static clearCandidateResponses(assessmentId: string): boolean {
    try {
      const key = `${STORAGE_KEYS.CANDIDATE_RESPONSES}${assessmentId}`;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to clear candidate responses:", error);
      return false;
    }
  }

  // Preview State Management (current section, progress, etc.)
  static savePreviewState(
    assessmentId: string,
    state: {
      currentSectionIndex: number;
      showResults: boolean;
      startTime?: number;
    }
  ): boolean {
    try {
      const key = `${STORAGE_KEYS.PREVIEW_STATE}${assessmentId}`;
      const data = {
        ...state,
        timestamp: Date.now(),
        assessmentId,
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Failed to save preview state:", error);
      return false;
    }
  }

  static loadPreviewState(assessmentId: string): {
    currentSectionIndex: number;
    showResults: boolean;
    startTime?: number;
  } | null {
    try {
      const key = `${STORAGE_KEYS.PREVIEW_STATE}${assessmentId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return {
        currentSectionIndex: data.currentSectionIndex || 0,
        showResults: data.showResults || false,
        startTime: data.startTime,
      };
    } catch (error) {
      console.error("Failed to load preview state:", error);
      return null;
    }
  }

  static clearPreviewState(assessmentId: string): boolean {
    try {
      const key = `${STORAGE_KEYS.PREVIEW_STATE}${assessmentId}`;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to clear preview state:", error);
      return false;
    }
  }

  // Storage cleanup utilities
  static cleanupOldData(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
    let cleanedCount = 0;
    const now = Date.now();

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith(STORAGE_KEYS.ASSESSMENT_DRAFT) ||
            key.startsWith(STORAGE_KEYS.CANDIDATE_RESPONSES) ||
            key.startsWith(STORAGE_KEYS.PREVIEW_STATE))
        ) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            if (data.timestamp && now - data.timestamp > maxAgeMs) {
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        cleanedCount++;
      });
    } catch (error) {
      console.error("Failed to cleanup old data:", error);
    }

    return cleanedCount;
  }

  static getStorageInfo(): {
    totalDrafts: number;
    totalResponses: number;
    totalStates: number;
    estimatedSizeKB: number;
  } {
    let totalDrafts = 0;
    let totalResponses = 0;
    let totalStates = 0;
    let totalSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (key.startsWith(STORAGE_KEYS.ASSESSMENT_DRAFT)) {
            totalDrafts++;
          } else if (key.startsWith(STORAGE_KEYS.CANDIDATE_RESPONSES)) {
            totalResponses++;
          } else if (key.startsWith(STORAGE_KEYS.PREVIEW_STATE)) {
            totalStates++;
          }

          if (key.startsWith("talentflow_")) {
            const value = localStorage.getItem(key);
            if (value) {
              totalSize += new Blob([value]).size;
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to get storage info:", error);
    }

    return {
      totalDrafts,
      totalResponses,
      totalStates,
      estimatedSizeKB: Math.round(totalSize / 1024),
    };
  }

  // Check if localStorage is available
  static isAvailable(): boolean {
    try {
      const test = "talentflow_test";
      localStorage.setItem(test, "test");
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

export default AssessmentStorage;

// Hook for using assessment storage with React
export const useAssessmentStorage = () => {
  const isAvailable = AssessmentStorage.isAvailable();

  return {
    isAvailable,
    saveAssessmentDraft: AssessmentStorage.saveAssessmentDraft,
    loadAssessmentDraft: AssessmentStorage.loadAssessmentDraft,
    clearAssessmentDraft: AssessmentStorage.clearAssessmentDraft,
    getAllAssessmentDrafts: AssessmentStorage.getAllAssessmentDrafts,
    saveCandidateResponses: AssessmentStorage.saveCandidateResponses,
    loadCandidateResponses: AssessmentStorage.loadCandidateResponses,
    clearCandidateResponses: AssessmentStorage.clearCandidateResponses,
    savePreviewState: AssessmentStorage.savePreviewState,
    loadPreviewState: AssessmentStorage.loadPreviewState,
    clearPreviewState: AssessmentStorage.clearPreviewState,
    cleanupOldData: AssessmentStorage.cleanupOldData,
    getStorageInfo: AssessmentStorage.getStorageInfo,
  };
};
