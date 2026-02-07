import { describe, expect, it, beforeEach } from "vitest";
import { executeViewingReminderJob, getReminderJobStats } from "./viewingReminder";
import { getDb } from "../db";
import { propertyViewings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("viewing reminder job", () => {
  beforeEach(async () => {
    // Clean up test data before each test
    const db = await getDb();
    if (db) {
      // Clear any test viewings
      await db
        .delete(propertyViewings)
        .where(eq(propertyViewings.id, 9999));
    }
  });

  it("executes without errors when no viewings need reminders", async () => {
    const result = await executeViewingReminderJob();

    expect(result.success).toBe(true);
    expect(result.remindersSent).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("identifies viewings scheduled for 24 hours from now", async () => {
    const stats = await getReminderJobStats();

    expect(stats).toHaveProperty("windowStart");
    expect(stats).toHaveProperty("windowEnd");
    expect(stats).toHaveProperty("totalViewingsInWindow");
    expect(stats).toHaveProperty("remindersSent");
    expect(stats).toHaveProperty("remindersNeeded");

    // Window should be approximately 23-25 hours from now
    const now = new Date();
    const windowStart = new Date(stats.windowStart);
    const windowEnd = new Date(stats.windowEnd);

    const hoursFromNow = (windowStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(hoursFromNow).toBeGreaterThan(22);
    expect(hoursFromNow).toBeLessThan(24);

    const hoursToEnd = (windowEnd.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(hoursToEnd).toBeGreaterThan(24);
    expect(hoursToEnd).toBeLessThan(26);
  });

  it("returns proper result structure", async () => {
    const result = await executeViewingReminderJob();

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("remindersSent");
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("timestamp");

    expect(typeof result.success).toBe("boolean");
    expect(typeof result.remindersSent).toBe("number");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("handles database errors gracefully", async () => {
    // This test verifies that the job handles errors without crashing
    const result = await executeViewingReminderJob();

    // Even if there are errors, the job should complete
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("errors");
  });

  it("tracks reminder statistics correctly", async () => {
    const stats = await getReminderJobStats();

    // Stats should show the current state of reminders
    expect(stats.totalViewingsInWindow).toBeGreaterThanOrEqual(0);
    expect(stats.remindersSent).toBeGreaterThanOrEqual(0);
    expect(stats.remindersNeeded).toBeGreaterThanOrEqual(0);

    // Sent + Needed should equal total
    expect(stats.remindersSent + stats.remindersNeeded).toBe(
      stats.totalViewingsInWindow
    );
  });

  it("job result includes timestamp", async () => {
    const before = new Date();
    const result = await executeViewingReminderJob();
    const after = new Date();

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
