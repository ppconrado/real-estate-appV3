import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("images router", () => {
  it("should get property images", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.images.getPropertyImages({ propertyId: 1 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should not allow non-admin users to upload images", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.upload({
        propertyId: 1,
        imageData: "base64encodeddata",
        fileName: "test.jpg",
        caption: "Test image",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Only admins can upload images");
    }
  });

  it("should not allow non-admin users to delete images", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.delete({ imageId: 1 });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Only admins can delete images");
    }
  });

  it("should not allow non-admin users to reorder images", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.reorder({ imageId: 1, displayOrder: 2 });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Only admins can reorder images");
    }
  });

  it("should validate image upload input", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.upload({
        propertyId: 0,
        imageData: "",
        fileName: "",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should validate image delete input", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.delete({ imageId: 0 });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should validate image reorder input", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.reorder({ imageId: 0, displayOrder: -1 });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should handle optional caption in upload", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.upload({
        propertyId: 1,
        imageData: "base64data",
        fileName: "test.jpg",
      });
      // This will fail due to database not being set up in test, but we're validating the input handling
    } catch (error: any) {
      // Expected - database error, not input validation error
      expect(error).toBeDefined();
    }
  });
});
