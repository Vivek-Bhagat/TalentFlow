const BASE_URL = "/api";

export class BaseApiClient {
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    try {
      return await response.json();
    } catch (error) {
      // Handle cases where the response is not valid JSON (e.g., HTML error pages)
      const text = await response.text();
      if (text.includes("<!doctype") || text.includes("<html")) {
        throw new Error(
          "API endpoint returned HTML instead of JSON. Please check the URL and ensure the API service is running."
        );
      }
      throw new Error(
        `Invalid JSON response: ${
          error instanceof Error ? error.message : "Unknown parsing error"
        }`
      );
    }
  }

  protected buildSearchParams(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  }
}
