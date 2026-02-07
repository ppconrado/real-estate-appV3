import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";

export const viewingAdminRouter = router({
  listAll: protectedProcedure
    .input(z.object({
      status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).optional(),
      propertyId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      searchQuery: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Only admins can view all viewings
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      
      const { getAllViewings } = await import("./db");
      return getAllViewings({
        status: input.status,
        propertyId: input.propertyId,
        startDate: input.startDate,
        endDate: input.endDate,
        searchQuery: input.searchQuery,
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
      cancellationReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can update viewing status
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      
      const { updateViewing, getViewingById } = await import("./db");
      const { sendViewingCancellationEmail } = await import("./emailService");
      
      const viewing = await getViewingById(input.id);
      if (!viewing) {
        throw new Error("Viewing not found");
      }
      
      // Send cancellation email if status is being changed to cancelled
      if (input.status === "cancelled" && viewing.status !== "cancelled") {
        try {
          await sendViewingCancellationEmail(
            viewing.visitorEmail,
            viewing.visitorName,
            "Property Viewing",
            viewing.viewingDate
          );
        } catch (emailError) {
          console.error("Failed to send cancellation email:", emailError);
        }
      }
      
      await updateViewing(input.id, {
        status: input.status,
      });
      
      return { success: true };
    }),

  bulkUpdateStatus: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()),
      status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can bulk update
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      
      const { updateViewing, getViewingById } = await import("./db");
      const { sendViewingCancellationEmail } = await import("./emailService");
      
      for (const id of input.ids) {
        const viewing = await getViewingById(id);
        if (!viewing) continue;
        
        // Send cancellation email if needed
        if (input.status === "cancelled" && viewing.status !== "cancelled") {
          try {
            await sendViewingCancellationEmail(
              viewing.visitorEmail,
              viewing.visitorName,
              "Property Viewing",
              viewing.viewingDate
            );
          } catch (emailError) {
            console.error("Failed to send cancellation email:", emailError);
          }
        }
        
        await updateViewing(id, { status: input.status });
      }
      
      return { success: true, count: input.ids.length };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can delete viewings
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      
      const { deleteViewing } = await import("./db");
      await deleteViewing(input.id);
      return { success: true };
    }),
});
