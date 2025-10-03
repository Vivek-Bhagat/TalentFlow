import { http, HttpResponse } from "msw";
import { db } from "../../config/database";

// Artificial latency and error rates
const addLatency = () =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 200));

// Specific latency and error rates for write operations (POST, PUT, DELETE, PATCH)
const addWriteLatency = () =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 200)); // 200-1200ms

// Higher error rate for write operations (5-10%)
const shouldWriteFail = () => Math.random() < 0.05 + Math.random() * 0.05; // 5-10% error rate

export const handlers = [
  // Jobs endpoints
  http.get("/api/jobs", async ({ request }) => {
    await addLatency();

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "9");
    const sort = url.searchParams.get("sort") || "order"; // Default sort by order

    try {
      // Parse sort parameter - check for descending order (prefix with -)
      const isDescending = sort.startsWith("-");
      const sortField = isDescending ? sort.substring(1) : sort;

      // Get all jobs with initial filter
      let query = db.jobs.toCollection();

      if (status && status !== "all") {
        query = query.filter((job) => job.status === status);
      }

      let allJobs = await query.toArray();

      // Client-side search
      const filteredJobs = search
        ? allJobs.filter(
            (job) =>
              job.title.toLowerCase().includes(search.toLowerCase()) ||
              job.department.toLowerCase().includes(search.toLowerCase()) ||
              job.location.toLowerCase().includes(search.toLowerCase()) ||
              job.tags.some((tag) =>
                tag.toLowerCase().includes(search.toLowerCase())
              )
          )
        : allJobs;

      // Sort the filtered jobs
      filteredJobs.sort((a: any, b: any) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        // Handle different types
        if (typeof aVal === "string" && typeof bVal === "string") {
          const comparison = aVal.localeCompare(bVal);
          return isDescending ? -comparison : comparison;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          const comparison = aVal.getTime() - bVal.getTime();
          return isDescending ? -comparison : comparison;
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          const comparison = aVal - bVal;
          return isDescending ? -comparison : comparison;
        }
        return 0;
      });

      // Pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedJobs = filteredJobs.slice(start, end);

      return HttpResponse.json({
        jobs: paginatedJobs,
        total: filteredJobs.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredJobs.length / pageSize),
      });
    } catch (error) {
      console.error("Error in GET /api/jobs:", error);
      return new HttpResponse(null, { status: 500 });
    }
  }),

  http.post("/api/jobs", async ({ request }) => {
    await addWriteLatency();

    if (shouldWriteFail()) {
      return new HttpResponse(null, { status: 500 });
    }

    try {
      const jobData = (await request.json()) as any;

      // Get all existing jobs to determine the next job ID
      const allJobs = await db.jobs.toArray();

      // Find the highest job number from existing job IDs
      let maxJobNumber = 0;
      allJobs.forEach((job) => {
        const match = job.id.match(/^job-(\d+)$/);
        if (match) {
          const jobNumber = parseInt(match[1], 10);
          if (jobNumber > maxJobNumber) {
            maxJobNumber = jobNumber;
          }
        }
      });

      // Generate next job ID with zero-padded format
      const nextJobNumber = maxJobNumber + 1;
      const newJobId = `job-${String(nextJobNumber).padStart(4, "0")}`;

      const newJob = {
        ...jobData,
        id: newJobId,
        createdAt: new Date(),
        updatedAt: new Date(),
        applicationCount: 0,
      };

      await db.jobs.add(newJob);
      return HttpResponse.json(newJob, { status: 201 });
    } catch (error) {
      return new HttpResponse(null, { status: 400 });
    }
  }),

  http.patch("/api/jobs/:id", async ({ params, request }) => {
    await addWriteLatency();

    if (shouldWriteFail()) {
      return new HttpResponse(null, { status: 500 });
    }

    try {
      const { id } = params;
      const updates = (await request.json()) as any;

      await db.jobs.update(id as string, {
        ...updates,
        updatedAt: new Date(),
      });

      const updatedJob = await db.jobs.get(id as string);
      return HttpResponse.json(updatedJob);
    } catch (error) {
      return new HttpResponse(null, { status: 404 });
    }
  }),

  http.patch("/api/jobs/:id/reorder", async ({ params, request }) => {
    await addWriteLatency();

    // Higher failure rate for reorder to test rollback
    if (shouldWriteFail()) {
      return new HttpResponse(null, { status: 500 });
    }

    try {
      const { id } = params;
      const { fromOrder, toOrder } = (await request.json()) as any;

      // Update the job's order
      await db.jobs.update(id as string, { order: toOrder });

      // Update other jobs' orders if needed
      const jobs = await db.jobs.orderBy("order").toArray();

      if (fromOrder < toOrder) {
        // Moving down: shift jobs up
        for (const job of jobs) {
          if (job.id !== id && job.order > fromOrder && job.order <= toOrder) {
            await db.jobs.update(job.id, { order: job.order - 1 });
          }
        }
      } else if (fromOrder > toOrder) {
        // Moving up: shift jobs down
        for (const job of jobs) {
          if (job.id !== id && job.order >= toOrder && job.order < fromOrder) {
            await db.jobs.update(job.id, { order: job.order + 1 });
          }
        }
      }

      return HttpResponse.json({ success: true });
    } catch (error) {
      return new HttpResponse(null, { status: 500 });
    }
  }),

  // Candidates endpoints
  http.get("/api/candidates", async ({ request }) => {
    await addLatency();

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const stage = url.searchParams.get("stage") || "";
    // const page = parseInt(url.searchParams.get("page") || "1");
    // const pageSize = parseInt(url.searchParams.get("pageSize") || "50");

    try {
      let query = db.candidates.orderBy("appliedAt").reverse();

      if (stage && stage !== "all") {
        query = query.filter((candidate) => candidate.stage === stage);
      }

      const allCandidates = await query.toArray();

      // Client-side search
      const filteredCandidates = search
        ? allCandidates.filter(
            (candidate) =>
              candidate.name.toLowerCase().includes(search.toLowerCase()) ||
              candidate.email.toLowerCase().includes(search.toLowerCase())
          )
        : allCandidates;

      // For virtualized lists, return all filtered results
      return HttpResponse.json({
        candidates: filteredCandidates,
        total: filteredCandidates.length,
      });
    } catch (error) {
      return new HttpResponse(null, { status: 500 });
    }
  }),

  http.post("/api/candidates", async ({ request }) => {
    await addWriteLatency();

    if (shouldWriteFail()) {
      return new HttpResponse(null, { status: 500 });
    }

    try {
      const candidateData = (await request.json()) as any;
      const newCandidate = {
        ...candidateData,
        id: crypto.randomUUID(),
        stage: candidateData.stage || "applied",
        appliedAt: new Date(),
        updatedAt: new Date(),
      };

      await db.candidates.add(newCandidate);

      // Add initial timeline event
      const timelineEvent = {
        id: `${newCandidate.id}-application-submitted`,
        candidateId: newCandidate.id,
        type: "application_submitted" as const,
        title: "Application submitted",
        description: `Applied for ${candidateData.position || "position"}`,
        timestamp: new Date(),
        createdBy: "system",
      };

      await db.timelineEvents.add(timelineEvent);

      return HttpResponse.json(newCandidate, { status: 201 });
    } catch (error) {
      return new HttpResponse(null, { status: 400 });
    }
  }),

  http.get("/api/candidates/:id", async ({ params }) => {
    await addLatency();

    try {
      const { id } = params;
      const candidate = await db.candidates.get(id as string);

      if (!candidate) {
        return new HttpResponse(null, { status: 404 });
      }

      return HttpResponse.json(candidate);
    } catch (error) {
      return new HttpResponse(null, { status: 500 });
    }
  }),

  http.patch("/api/candidates/:id", async ({ params, request }) => {
    await addWriteLatency();

    if (shouldWriteFail()) {
      return new HttpResponse(null, { status: 500 });
    }

    try {
      const { id } = params;
      const updates = (await request.json()) as any;
      const candidateId = id as string;

      // Get the current candidate to check for stage changes
      const currentCandidate = await db.candidates.get(candidateId);

      if (!currentCandidate) {
        return new HttpResponse(null, { status: 404 });
      }

      // Update the candidate
      await db.candidates.update(candidateId, {
        ...updates,
        updatedAt: new Date(),
      });

      // If stage changed, add timeline event
      if (updates.stage && updates.stage !== currentCandidate.stage) {
        const timelineEvent = {
          id: `${candidateId}-stage-${Date.now()}`,
          candidateId: candidateId,
          type: "stage_change" as const,
          title: `Moved to ${updates.stage}`,
          description: `Candidate progressed from ${currentCandidate.stage} to ${updates.stage}`,
          from: currentCandidate.stage,
          to: updates.stage,
          timestamp: new Date(),
          createdBy: "system",
        };

        await db.timelineEvents.add(timelineEvent);
      }

      const updatedCandidate = await db.candidates.get(candidateId);
      return HttpResponse.json(updatedCandidate);
    } catch (error) {
      return new HttpResponse(null, { status: 404 });
    }
  }),

  http.get("/api/candidates/:id/timeline", async ({ params }) => {
    await addLatency();

    try {
      const { id } = params;
      const candidate = await db.candidates.get(id as string);

      if (!candidate) {
        return new HttpResponse(null, { status: 404 });
      }

      // Check if timeline events already exist in DB
      const existingEvents = await db.timelineEvents
        .where("candidateId")
        .equals(id as string)
        .toArray();

      if (existingEvents.length > 0) {
        // Sort by timestamp (newest first) and return
        const sortedEvents = existingEvents.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return HttpResponse.json(sortedEvents);
      }

      // Generate comprehensive timeline data
      const timeline: any[] = [];
      const baseTime = new Date(candidate.appliedAt);
      const candidateId = id as string;

      // 1. Application submitted
      timeline.push({
        id: `${candidateId}-1`,
        candidateId: candidateId,
        type: "application_submitted",
        title: "Application submitted",
        description: `Applied for ${candidate.position}`,
        timestamp: baseTime,
        createdBy: "system",
      });

      // 2. Generate stage progression timeline
      const stages = ["applied", "screen", "technical", "offer", "hired"];
      const stageIndex = stages.indexOf(candidate.stage);

      for (let i = 1; i <= stageIndex; i++) {
        const stageTime = new Date(
          baseTime.getTime() + i * 2 * 24 * 60 * 60 * 1000
        ); // 2 days between stages
        timeline.push({
          id: `${candidateId}-stage-${i}`,
          candidateId: candidateId,
          type: "stage_change",
          title: `Moved to ${stages[i]}`,
          description: `Candidate progressed from ${stages[i - 1]} to ${
            stages[i]
          }`,
          from: stages[i - 1],
          to: stages[i],
          timestamp: stageTime,
          createdBy: "system",
        });
      }

      // 3. Add some realistic interview events
      if (stageIndex >= 1) {
        // Has passed screening
        const screenTime = new Date(baseTime.getTime() + 24 * 60 * 60 * 1000);
        timeline.push({
          id: `${candidateId}-interview-1`,
          candidateId: candidateId,
          type: "interview_completed",
          title: "Phone screening completed",
          description: "Initial phone screening with HR team",
          timestamp: screenTime,
          createdBy: "HR Team",
        });
      }

      if (stageIndex >= 2) {
        // Has technical interview
        const techTime = new Date(baseTime.getTime() + 3 * 24 * 60 * 60 * 1000);
        timeline.push({
          id: `${candidateId}-interview-2`,
          candidateId: candidateId,
          type: "interview_completed",
          title: "Technical interview completed",
          description: "Technical assessment and coding interview",
          timestamp: techTime,
          createdBy: "Tech Team",
        });
      }

      // 4. Add notes events
      const candidateNotes = await db.notes
        .where("candidateId")
        .equals(candidateId)
        .toArray();

      candidateNotes.forEach((note, index) => {
        timeline.push({
          id: `${candidateId}-note-${index}`,
          candidateId: candidateId,
          type: "note_added",
          title: "Note added",
          description:
            note.content.substring(0, 100) +
            (note.content.length > 100 ? "..." : ""),
          timestamp: note.createdAt,
          createdBy: note.author,
        });
      });

      // Sort timeline by timestamp (newest first)
      timeline.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return HttpResponse.json(timeline);
    } catch (error) {
      console.error("Timeline error:", error);
      return new HttpResponse(null, { status: 500 });
    }
  }),

  // Assessments endpoints
  http.get("/api/assessments", async ({ request }) => {
    await addLatency();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50");

    try {
      const allAssessments = await db.assessments
        .orderBy("createdAt")
        .reverse()
        .toArray();

      // Pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedAssessments = allAssessments.slice(start, end);

      return HttpResponse.json({
        assessments: paginatedAssessments,
        total: allAssessments.length,
        page,
        pageSize,
        totalPages: Math.ceil(allAssessments.length / pageSize),
      });
    } catch (error) {
      return new HttpResponse(null, { status: 500 });
    }
  }),

  http.get("/api/assessments/:jobId", async ({ params }) => {
    await addLatency();

    try {
      const { jobId } = params;
      const assessment = await db.assessments
        .where("jobId")
        .equals(jobId as string)
        .first();

      return HttpResponse.json(assessment || null);
    } catch (error) {
      return new HttpResponse(null, { status: 500 });
    }
  }),

  http.put("/api/assessments/:jobId", async ({ params, request }) => {
    await addWriteLatency();

    if (shouldWriteFail()) {
      return new HttpResponse(null, { status: 500 });
    }

    try {
      const { jobId } = params;
      const assessmentData = (await request.json()) as any;

      console.log("🔍 PUT /api/assessments - Request:", {
        jobId,
        assessmentId: assessmentData.id,
        title: assessmentData.title,
      });

      // Check if assessment exists by ID only (not by jobId)
      // This allows multiple assessments per job
      let existing = null;
      if (assessmentData.id) {
        existing = await db.assessments.get(assessmentData.id);
        console.log(
          "🔍 Existing assessment found:",
          existing ? "YES" : "NO",
          existing?.id
        );
      }

      if (existing) {
        // Update existing assessment
        console.log("✏️ UPDATING existing assessment:", existing.id);
        const updateData = {
          ...assessmentData,
          jobId: jobId as string, // Ensure jobId is correct
          updatedAt: new Date(),
        };
        await db.assessments.update(existing.id, updateData);
        const updated = await db.assessments.get(existing.id);
        return HttpResponse.json(updated);
      } else {
        // Create new assessment (duplicate or new creation)
        console.log("✨ CREATING new assessment (no existing ID found)");

        // Don't provide an ID - let Dexie auto-generate it
        const newAssessment: any = {
          jobId: jobId as string,
          title: assessmentData.title,
          description: assessmentData.description || "",
          sections: assessmentData.sections || [],
          timeLimit: assessmentData.timeLimit,
          isPublished: assessmentData.isPublished || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add without ID - Dexie will auto-generate
        const newId = await db.assessments.add(newAssessment);
        const created = await db.assessments.get(newId);

        console.log(
          "✅ New assessment created with auto-generated ID:",
          created?.id
        );
        return HttpResponse.json(created, { status: 201 });
      }
    } catch (error) {
      console.error("Error in PUT /api/assessments/:jobId:", error);
      return new HttpResponse(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),

  http.post("/api/assessments/:jobId/submit", async ({ request }) => {
    await addWriteLatency();

    if (shouldWriteFail()) {
      return new HttpResponse(null, { status: 500 });
    }

    try {
      // const { jobId } = params;
      const responseData = (await request.json()) as any;

      const assessmentResponse = {
        id: crypto.randomUUID(),
        assessmentId: responseData.assessmentId,
        candidateId: responseData.candidateId,
        responses: responseData.responses,
        submittedAt: new Date(),
        timeSpent: responseData.timeSpent || 0,
      };

      await db.assessmentResponses.add(assessmentResponse);
      return HttpResponse.json(assessmentResponse, { status: 201 });
    } catch (error) {
      return new HttpResponse(null, { status: 500 });
    }
  }),
];
