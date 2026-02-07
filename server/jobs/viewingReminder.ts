import { getDb } from "../db";
import { propertyViewings } from "../../drizzle/schema";
import { sendViewingReminderEmail } from "../emailService";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Viewing Reminder Job
 * Sends reminder emails to visitors 24 hours before their scheduled viewing
 * 
 * This job should run every hour to check for viewings that are scheduled
 * for approximately 24 hours from now
 */

interface ReminderJobResult {
  success: boolean;
  remindersSent: number;
  errors: Array<{ viewingId: number; error: string }>;
  timestamp: Date;
}

/**
 * Calculate the time window for reminders (23-25 hours from now)
 * This ensures we catch viewings even if the job runs at slightly different times
 */
function getReminderTimeWindow() {
  const now = new Date();
  
  // 23 hours from now (earliest reminder window)
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  
  // 25 hours from now (latest reminder window)
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  
  return { windowStart, windowEnd };
}

/**
 * Get all viewings that need reminders (scheduled for ~24 hours from now)
 */
async function getViewingsNeedingReminders() {
  const { windowStart, windowEnd } = getReminderTimeWindow();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const upcomingViewings = await db
    .select()
    .from(propertyViewings)
    .where(
      and(
        eq(propertyViewings.status, "scheduled"),
        gte(propertyViewings.viewingDate, windowStart),
        lte(propertyViewings.viewingDate, windowEnd),
        eq(propertyViewings.reminderSent, false) // Only send reminder once
      )
    );
  
  return upcomingViewings;
}

/**
 * Mark a viewing as having its reminder sent
 */
async function markReminderSent(viewingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(propertyViewings)
    .set({ reminderSent: true })
    .where(eq(propertyViewings.id, viewingId));
}

/**
 * Execute the viewing reminder job
 * Sends reminder emails to all visitors with viewings scheduled ~24 hours from now
 */
export async function executeViewingReminderJob(): Promise<ReminderJobResult> {
  const result: ReminderJobResult = {
    success: true,
    remindersSent: 0,
    errors: [],
    timestamp: new Date(),
  };

  try {
    console.log("[Reminder Job] Starting viewing reminder job...");
    
    const viewingsToRemind = await getViewingsNeedingReminders();
    console.log(`[Reminder Job] Found ${viewingsToRemind.length} viewings needing reminders`);

    for (const viewing of viewingsToRemind) {
      try {
        // Send reminder email
        await sendViewingReminderEmail({
          visitorEmail: viewing.visitorEmail,
          visitorName: viewing.visitorName,
          propertyTitle: "Property Viewing",
          propertyAddress: "",
          viewingDate: viewing.viewingDate,
          viewingTime: viewing.viewingTime,
          duration: viewing.duration,
          agentName: "Real Estate Agent",
          agentPhone: "",
          agentEmail: "",
        });

        // Mark reminder as sent
        await markReminderSent(viewing.id);
        
        result.remindersSent++;
        console.log(`[Reminder Job] Reminder sent for viewing ${viewing.id} to ${viewing.visitorEmail}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push({
          viewingId: viewing.id,
          error: errorMessage,
        });
        console.error(`[Reminder Job] Failed to send reminder for viewing ${viewing.id}:`, error);
      }
    }

    console.log(
      `[Reminder Job] Job completed. Sent ${result.remindersSent} reminders with ${result.errors.length} errors`
    );
  } catch (error) {
    result.success = false;
    console.error("[Reminder Job] Fatal error in reminder job:", error);
  }

  return result;
}

/**
 * Get job statistics (for monitoring/debugging)
 */
export async function getReminderJobStats() {
  const { windowStart, windowEnd } = getReminderTimeWindow();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const viewingsInWindow = await db
    .select()
    .from(propertyViewings)
    .where(
      and(
        eq(propertyViewings.status, "scheduled"),
        gte(propertyViewings.viewingDate, windowStart),
        lte(propertyViewings.viewingDate, windowEnd)
      )
    );

  const remindersSent = viewingsInWindow.filter((v: any) => v.reminderSent).length;
  const remindersNeeded = viewingsInWindow.filter((v: any) => !v.reminderSent).length;

  return {
    windowStart,
    windowEnd,
    totalViewingsInWindow: viewingsInWindow.length,
    remindersSent,
    remindersNeeded,
  };
}
