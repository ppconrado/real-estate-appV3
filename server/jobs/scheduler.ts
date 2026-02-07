import { executeViewingReminderJob } from "./viewingReminder";

/**
 * Job Scheduler
 * Manages scheduled jobs that run at regular intervals
 */

interface ScheduledJob {
  name: string;
  interval: number; // in milliseconds
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
  execute: () => Promise<void>;
}

class JobScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isStarted = false;

  /**
   * Register a new scheduled job
   */
  registerJob(name: string, intervalMs: number, execute: () => Promise<void>) {
    const job: ScheduledJob = {
      name,
      interval: intervalMs,
      isRunning: false,
      execute,
    };

    this.jobs.set(name, job);
    console.log(`[Scheduler] Registered job: ${name} (interval: ${intervalMs}ms)`);
  }

  /**
   * Start all registered jobs
   */
  start() {
    if (this.isStarted) {
      console.warn("[Scheduler] Already started");
      return;
    }

    this.isStarted = true;
    console.log("[Scheduler] Starting job scheduler...");

    this.jobs.forEach((job, name) => {
      this.scheduleJob(name, job);
    });

    console.log(`[Scheduler] Started ${this.jobs.size} jobs`);
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    if (!this.isStarted) {
      console.warn("[Scheduler] Not started");
      return;
    }

    console.log("[Scheduler] Stopping job scheduler...");

    this.timers.forEach((timer, name) => {
      clearInterval(timer);
      console.log(`[Scheduler] Stopped job: ${name}`);
    });

    this.timers.clear();
    this.isStarted = false;
  }

  /**
   * Schedule a single job to run at regular intervals
   */
  private scheduleJob(name: string, job: ScheduledJob) {
    // Run immediately on first start
    this.runJob(name, job);

    // Then schedule for regular intervals
    const timer = setInterval(() => {
      this.runJob(name, job);
    }, job.interval);

    this.timers.set(name, timer);
  }

  /**
   * Execute a job with error handling
   */
  private async runJob(name: string, job: ScheduledJob) {
    if (job.isRunning) {
      console.log(`[Scheduler] Job ${name} is already running, skipping...`);
      return;
    }

    job.isRunning = true;
    job.lastRun = new Date();
    job.nextRun = new Date(Date.now() + job.interval);

    try {
      console.log(`[Scheduler] Executing job: ${name}`);
      await job.execute();
      console.log(`[Scheduler] Job ${name} completed successfully`);
    } catch (error) {
      console.error(`[Scheduler] Job ${name} failed:`, error);
    } finally {
      job.isRunning = false;
    }
  }

  /**
   * Get job status
   */
  getJobStatus(name: string) {
    const job = this.jobs.get(name);
    if (!job) return null;

    return {
      name: job.name,
      interval: job.interval,
      isRunning: job.isRunning,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
    };
  }

  /**
   * Get all jobs status
   */
  getAllJobsStatus() {
    const statuses: any[] = [];
    this.jobs.forEach((job, _name) => {
      statuses.push({
        name: job.name,
        interval: job.interval,
        isRunning: job.isRunning,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
      });
    });
    return statuses;
  }
}

// Global scheduler instance
let scheduler: JobScheduler | null = null;

/**
 * Initialize and start the job scheduler
 */
export function initializeJobScheduler() {
  if (scheduler) {
    console.warn("[Scheduler] Already initialized");
    return scheduler;
  }

  scheduler = new JobScheduler();

  // Register viewing reminder job - runs every hour
  scheduler.registerJob(
    "viewing-reminder",
    60 * 60 * 1000, // 1 hour
    async () => {
      await executeViewingReminderJob();
    }
  );

  // Start the scheduler
  scheduler.start();

  return scheduler;
}

/**
 * Get the global scheduler instance
 */
export function getScheduler(): JobScheduler | null {
  return scheduler;
}

/**
 * Stop the job scheduler
 */
export function stopJobScheduler() {
  if (scheduler) {
    scheduler.stop();
    scheduler = null;
  }
}

/**
 * Get job scheduler status
 */
export function getSchedulerStatus() {
  if (!scheduler) {
    return { isRunning: false, jobs: [] };
  }

  return {
    isRunning: true,
    jobs: scheduler.getAllJobsStatus(),
  };
}
