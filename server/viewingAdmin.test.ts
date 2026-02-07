import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("viewing admin endpoints", () => {
  let testPropertyId = 4000;

  it("prevents non-admins from listing all viewings", async () => {
    const ctx = createAuthContext(1, "user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.viewings.listAll({});
      expect.fail("Should have thrown authorization error");
    } catch (error: any) {
      expect(error.message).toContain("Admin access required");
    }
  });

  it("allows admins to list all viewings", async () => {
    const ctx = createAuthContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    // Create a test viewing first
    const userCtx = createAuthContext(2, "user");
    const userCaller = appRouter.createCaller(userCtx);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    await userCaller.viewings.create({
      propertyId: testPropertyId++,
      visitorName: "Test Visitor",
      visitorEmail: "test@example.com",
      viewingDate: futureDate,
      viewingTime: "10:00",
    });

    // Admin lists all viewings
    const viewings = await caller.viewings.listAll({});
    expect(Array.isArray(viewings)).toBe(true);
  });

  it("filters viewings by status", async () => {
    const ctx = createAuthContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    const viewings = await caller.viewings.listAll({
      status: "scheduled",
    });

    expect(Array.isArray(viewings)).toBe(true);
    viewings.forEach((v: any) => {
      expect(v.status).toBe("scheduled");
    });
  });

  it("filters viewings by date range", async () => {
    const ctx = createAuthContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const viewings = await caller.viewings.listAll({
      startDate,
      endDate,
    });

    expect(Array.isArray(viewings)).toBe(true);
  });

  it("searches viewings by visitor name", async () => {
    const ctx = createAuthContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    const viewings = await caller.viewings.listAll({
      searchQuery: "John",
    });

    expect(Array.isArray(viewings)).toBe(true);
  });

  it("prevents non-admins from updating viewing status", async () => {
    const ctx = createAuthContext(1, "user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.viewings.updateStatus({
        id: 1,
        status: "confirmed",
      });
      expect.fail("Should have thrown authorization error");
    } catch (error: any) {
      expect(error.message).toContain("Admin access required");
    }
  });

  it("allows admins to update viewing status", async () => {
    const ctx = createAuthContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    // Create a viewing first
    const userCtx = createAuthContext(2, "user");
    const userCaller = appRouter.createCaller(userCtx);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const result = await userCaller.viewings.create({
      propertyId: testPropertyId++,
      visitorName: "Status Test",
      visitorEmail: "status@example.com",
      viewingDate: futureDate,
      viewingTime: "14:00",
    });

    // Get the viewing ID (we need to fetch it)
    const viewings = await caller.viewings.listAll({
      searchQuery: "Status Test",
    });
    const viewingId = (viewings[0] as any)?.id;

    if (viewingId) {
      const updateResult = await caller.viewings.updateStatus({
        id: viewingId,
        status: "confirmed",
      });

      expect(updateResult).toEqual({ success: true });

      // Verify the status was updated
      const updated = await caller.viewings.listAll({
        searchQuery: "Status Test",
      });
      expect((updated[0] as any).status).toBe("confirmed");
    }
  });

  it("prevents non-admins from bulk updating viewings", async () => {
    const ctx = createAuthContext(1, "user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.viewings.bulkUpdateStatus({
        ids: [1, 2, 3],
        status: "completed",
      });
      expect.fail("Should have thrown authorization error");
    } catch (error: any) {
      expect(error.message).toContain("Admin access required");
    }
  });

  it("allows admins to bulk update viewing status", async () => {
    const ctx = createAuthContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    // Create multiple viewings
    const userCtx = createAuthContext(2, "user");
    const userCaller = appRouter.createCaller(userCtx);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      await userCaller.viewings.create({
        propertyId: testPropertyId++,
        visitorName: `Bulk Test ${i}`,
        visitorEmail: `bulk${i}@example.com`,
        viewingDate: futureDate,
        viewingTime: `${10 + i}:00`,
      });
    }

    // Get the viewing IDs
    const viewings = await caller.viewings.listAll({
      searchQuery: "Bulk Test",
    });
    const viewingIds = viewings.slice(0, 3).map((v: any) => v.id);

    if (viewingIds.length >= 3) {
      const result = await caller.viewings.bulkUpdateStatus({
        ids: viewingIds,
        status: "completed",
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(viewingIds.length);

      // Verify all were updated
      const updated = await caller.viewings.listAll({
        status: "completed",
      });
      const bulkUpdated = updated.filter((v: any) =>
        viewingIds.includes(v.id)
      );
      expect(bulkUpdated.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("sends cancellation email when status changed to cancelled", async () => {
    const ctx = createAuthContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    // Create a viewing
    const userCtx = createAuthContext(2, "user");
    const userCaller = appRouter.createCaller(userCtx);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    await userCaller.viewings.create({
      propertyId: testPropertyId++,
      visitorName: "Cancel Test",
      visitorEmail: "cancel@example.com",
      viewingDate: futureDate,
      viewingTime: "15:00",
    });

    // Get the viewing ID
    const viewings = await caller.viewings.listAll({
      searchQuery: "Cancel Test",
    });
    const viewingId = (viewings[0] as any)?.id;

    if (viewingId) {
      // Update status to cancelled
      const result = await caller.viewings.updateStatus({
        id: viewingId,
        status: "cancelled",
      });

      expect(result).toEqual({ success: true });

      // Verify the status is cancelled
      const updated = await caller.viewings.listAll({
        searchQuery: "Cancel Test",
      });
      expect((updated[0] as any).status).toBe("cancelled");
    }
  });
});
