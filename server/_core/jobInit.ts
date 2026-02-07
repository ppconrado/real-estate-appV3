import { initializeJobScheduler, stopJobScheduler } from "../jobs/scheduler";

/**
 * Initialize background jobs when the server starts
 */
export function initializeBackgroundJobs() {
  try {
    console.log("[Jobs] Initializing background jobs...");
    initializeJobScheduler();
    console.log("[Jobs] Background jobs initialized successfully");
  } catch (error) {
    console.error("[Jobs] Failed to initialize background jobs:", error);
  }
}

/**
 * Gracefully shutdown background jobs
 */
export function shutdownBackgroundJobs() {
  try {
    console.log("[Jobs] Shutting down background jobs...");
    stopJobScheduler();
    console.log("[Jobs] Background jobs shut down successfully");
  } catch (error) {
    console.error("[Jobs] Failed to shutdown background jobs:", error);
  }
}
