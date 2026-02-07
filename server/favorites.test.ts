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

describe("favorites", () => {
  it("should add a property to favorites", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.favorites.add({ propertyId: 1 });

    expect(result).toEqual({ success: true });
  });

  it("should remove a property from favorites", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First add a favorite
    await caller.favorites.add({ propertyId: 1 });

    // Then remove it
    const result = await caller.favorites.remove({ propertyId: 1 });

    expect(result).toEqual({ success: true });
  });

  it("should list user favorites", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Add some favorites
    await caller.favorites.add({ propertyId: 1 });
    await caller.favorites.add({ propertyId: 2 });

    // List favorites
    const result = await caller.favorites.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should not allow unauthenticated users to add favorites", async () => {
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    } as TrpcContext;

    const caller = appRouter.createCaller(ctx);

    try {
      await caller.favorites.add({ propertyId: 1 });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});
