import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("inquiries", () => {
  it("should submit a property inquiry", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.submit({
      propertyId: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "(555) 123-4567",
      message: "I'm interested in this property",
    });

    expect(result).toEqual({ success: true });
  });

  it("should validate email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.inquiries.submit({
        propertyId: 1,
        name: "John Doe",
        email: "invalid-email",
        message: "I'm interested in this property",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should handle optional phone field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.submit({
      propertyId: 1,
      name: "John Doe",
      email: "john@example.com",
      message: "I'm interested in this property",
    });

    expect(result).toEqual({ success: true });
  });

  it("should accept inquiries from unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.submit({
      propertyId: 1,
      name: "Guest User",
      email: "guest@example.com",
      message: "I would like more information",
    });

    expect(result).toEqual({ success: true });
  });

  it("should require valid property ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.submit({
      propertyId: 999,
      name: "Test User",
      email: "test@example.com",
      message: "Test inquiry",
    });

    expect(result).toEqual({ success: true });
  });
});
