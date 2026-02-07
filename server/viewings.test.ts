import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
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

describe("viewings", () => {
  let testPropertyId = 3000;
  let testDateOffset = 7;

  it("creates a property viewing", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + testDateOffset++);

    const result = await caller.viewings.create({
      propertyId: testPropertyId++,
      visitorName: "John Doe",
      visitorEmail: "john@example.com",
      visitorPhone: "+1 (555) 123-4567",
      viewingDate: futureDate,
      viewingTime: "10:00",
      duration: 30,
      notes: "Interested in the property",
    });

    expect(result).toEqual({ success: true });
  });

  it("validates required fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + testDateOffset++);

    try {
      await caller.viewings.create({
        propertyId: testPropertyId++,
        visitorName: "",
        visitorEmail: "john@example.com",
        viewingDate: futureDate,
        viewingTime: "10:00",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toBeTruthy();
    }
  });

  it("lists viewings by property", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + testDateOffset++);

    const propId = testPropertyId++;
    await caller.viewings.create({
      propertyId: propId,
      visitorName: "John Doe",
      visitorEmail: "john@example.com",
      viewingDate: futureDate,
      viewingTime: "10:00",
    });

    const viewings = await caller.viewings.listByProperty({ propertyId: propId });
    expect(Array.isArray(viewings)).toBe(true);
  });

  it("lists user viewings", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + testDateOffset++);

    await caller.viewings.create({
      propertyId: testPropertyId++,
      visitorName: "John Doe",
      visitorEmail: "john@example.com",
      viewingDate: futureDate,
      viewingTime: "10:00",
    });

    const viewings = await caller.viewings.listByUser();
    expect(Array.isArray(viewings)).toBe(true);
  });

  it("allows optional phone and notes", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + testDateOffset++);

    const result = await caller.viewings.create({
      propertyId: testPropertyId++,
      visitorName: "John Doe",
      visitorEmail: "john@example.com",
      viewingDate: futureDate,
      viewingTime: "10:00",
    });

    expect(result).toEqual({ success: true });
  });

  it("allows different duration options", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const durations = [30, 45, 60, 90, 120];

    for (let i = 0; i < durations.length; i++) {
      const duration = durations[i];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + testDateOffset++);

      const result = await caller.viewings.create({
        propertyId: testPropertyId++,
        visitorName: "John Doe",
        visitorEmail: `john-${duration}@example.com`,
        viewingDate: futureDate,
        viewingTime: "10:00",
        duration,
      });

      expect(result).toEqual({ success: true });
    }
  });

  it("detects time slot conflicts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + testDateOffset++);

    const conflictPropertyId = testPropertyId++;
    await caller.viewings.create({
      propertyId: conflictPropertyId,
      visitorName: "John Doe",
      visitorEmail: "john@example.com",
      viewingDate: futureDate,
      viewingTime: "10:00",
    });

    try {
      await caller.viewings.create({
        propertyId: conflictPropertyId,
        visitorName: "Jane Smith",
        visitorEmail: "jane@example.com",
        viewingDate: futureDate,
        viewingTime: "10:00",
      });
      expect.fail("Should have thrown conflict error");
    } catch (error: any) {
      expect(error.message).toContain("Time slot already booked");
    }
  });
});
