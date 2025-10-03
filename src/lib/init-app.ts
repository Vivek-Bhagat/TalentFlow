import { setupWorker } from "msw/browser";
import { handlers } from "./msw/handler";
import { db } from "../config/database";
import { seedDatabase } from "./seed/seed-data";

// Global flag to prevent multiple initializations
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function initializeApp() {
  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Return immediately if already initialized
  if (isInitialized) {
    console.log("� TalentFlow already initialized, skipping...");
    return;
  }

  console.log("�🚀 Initializing TalentFlow...");

  // Create and store the initialization promise
  initializationPromise = (async () => {
    // Initialize MSW
    const worker = setupWorker(...handlers);
    await worker.start({
      onUnhandledRequest: "bypass",
    });
    console.log("✅ MSW worker started");

    // Initialize database
    try {
      await db.open();
      console.log("✅ Database connected");

      // Check if we need to seed data
      const jobCount = await db.jobs.count();
      if (jobCount === 0) {
        await seedDatabase();
      } else {
        console.log("📦 Database already contains data");
      }
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    }

    isInitialized = true;
    console.log("🎉 TalentFlow initialized successfully");
  })();

  return initializationPromise;
}
