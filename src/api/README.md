# API Routes Structure

This folder contains all API route definitions organized by feature. The routes are structured to provide better organization and maintainability compared to a single monolithic API client.

## Structure

```
src/routes/
├── base.ts          # Base API client class with common functionality
├── jobs.ts          # Jobs-related API endpoints
├── candidates.ts    # Candidates-related API endpoints
├── assessments.ts   # Assessments-related API endpoints
└── index.ts         # Main export file that combines all routes
```

## Usage

### Method 1: Use the Combined API Client (Recommended)

Import the main `apiClient` which provides access to all API methods:

```typescript
import { apiClient } from "@/routes";

// Jobs API
const jobs = await apiClient.getJobs({ status: "active" });
const newJob = await apiClient.createJob(jobData);

// Candidates API
const candidates = await apiClient.getCandidates({ stage: "interview" });
const candidate = await apiClient.getCandidate(id);

// Assessments API
const assessment = await apiClient.getAssessment(jobId);
```

### Method 2: Use Individual Route Modules

For more granular imports and better tree-shaking:

```typescript
import { jobsApi, candidatesApi, assessmentsApi } from "@/routes";

// Use specific API modules
const jobs = await jobsApi.getJobs({ status: "active" });
const candidates = await candidatesApi.getCandidates({ stage: "interview" });
const assessment = await assessmentsApi.getAssessment(jobId);
```

### Method 3: Import Specific APIs

```typescript
import { jobsApi } from "@/routes/jobs";
import { candidatesApi } from "@/routes/candidates";

// Use only what you need
const jobs = await jobsApi.getJobs();
```

## Available APIs

### Jobs API (`jobsApi`)

- `getJobs(params?)` - Get paginated list of jobs
- `createJob(jobData)` - Create a new job
- `updateJob(id, updates)` - Update existing job
- `reorderJob(id, fromOrder, toOrder)` - Reorder job position

### Candidates API (`candidatesApi`)

- `getCandidates(params?)` - Get paginated list of candidates
- `getCandidate(id)` - Get single candidate details
- `updateCandidate(id, updates)` - Update candidate information
- `getCandidateTimeline(id)` - Get candidate timeline events

### Assessments API (`assessmentsApi`)

- `getAssessment(jobId)` - Get assessment for a job
- `saveAssessment(jobId, data)` - Save/update assessment
- `submitAssessmentResponse(jobId, response)` - Submit assessment response

## Migration from Old API Client

The old `@/lib/api-client` import has been deprecated but still works for backward compatibility. Update imports like this:

```typescript
// Old (deprecated but still works)
import { apiClient } from "@/lib/api-client";

// New (recommended)
import { apiClient } from "@/routes";
```

## Adding New API Routes

1. Create a new file in the routes folder (e.g., `notifications.ts`)
2. Extend the `BaseApiClient` class:

```typescript
import { BaseApiClient } from "./base";

export class NotificationsApiClient extends BaseApiClient {
  async getNotifications() {
    return this.request<Notification[]>("/notifications");
  }
}

export const notificationsApi = new NotificationsApiClient();
```

3. Export it from `index.ts`:

```typescript
import { notificationsApi } from "./notifications";

class ApiClient {
  // ... existing methods
  getNotifications = notificationsApi.getNotifications.bind(notificationsApi);
}

export { notificationsApi } from "./notifications";
```

## Benefits

- **Better Organization**: Related API methods are grouped together
- **Tree Shaking**: Import only what you need for better bundle size
- **Maintainability**: Easier to find and update specific API logic
- **Type Safety**: Better TypeScript support with granular imports
- **Scalability**: Easy to add new API modules as the application grows
