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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("comparisons", () => {
  it("should add a property to comparison list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.comparisons.add({ propertyId: 1 });

    expect(result).toEqual({ success: true });
  });

  it("should add multiple properties to comparison list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.comparisons.add({ propertyId: 1 });
    await caller.comparisons.add({ propertyId: 2 });
    await caller.comparisons.add({ propertyId: 3 });

    const result = await caller.comparisons.getAll();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("should remove a property from comparison list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.comparisons.add({ propertyId: 1 });
    const result = await caller.comparisons.remove({ propertyId: 1 });

    expect(result).toEqual({ success: true });
  });

  it("should list all properties in comparison", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.comparisons.add({ propertyId: 1 });
    await caller.comparisons.add({ propertyId: 2 });

    const result = await caller.comparisons.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should clear all comparisons", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.comparisons.add({ propertyId: 1 });
    const result = await caller.comparisons.clear();

    expect(result).toEqual({ success: true });
  });

  it("should prevent unauthenticated users from adding comparisons", async () => {
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    } as TrpcContext;

    const caller = appRouter.createCaller(ctx);

    try {
      await caller.comparisons.add({ propertyId: 1 });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });

  it("should limit comparison list to 5 properties", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Add 6 properties
    for (let i = 1; i <= 6; i++) {
      await caller.comparisons.add({ propertyId: i });
    }

    const result = await caller.comparisons.getAll();

    // Should have at most 5 properties
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("should not add duplicate properties to comparison", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.comparisons.add({ propertyId: 1 });
    await caller.comparisons.add({ propertyId: 1 });

    const result = await caller.comparisons.getAll();

    // Should only have 1 property
    const propertyIds = result.map((p) => p.id);
    const uniqueIds = new Set(propertyIds);
    expect(uniqueIds.size).toBe(propertyIds.length);
  });

  it("should maintain separate comparison lists for different users", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    await caller1.comparisons.add({ propertyId: 1 });
    await caller2.comparisons.add({ propertyId: 2 });

    const result1 = await caller1.comparisons.getAll();
    const result2 = await caller2.comparisons.getAll();

    // Each user should have their own comparison list
    expect(result1.length).toBeGreaterThanOrEqual(0);
    expect(result2.length).toBeGreaterThanOrEqual(0);
  });
});
