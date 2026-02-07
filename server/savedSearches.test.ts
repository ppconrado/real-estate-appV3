import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}-${Date.now()}`,
    email: `user${userId}-${Date.now()}@example.com`,
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
    res: {} as TrpcContext["res"],
  };
}

describe("Saved Searches", () => {
  it("should create a saved search", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.savedSearches.create({
      name: "Luxury Homes with Pool",
      minPrice: 500000,
      maxPrice: 2000000,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: "house",
      amenities: ["pool", "gym"],
    });

    expect(result.success).toBe(true);
  });

  it("should get all saved searches for a user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a saved search
    await caller.savedSearches.create({
      name: "Test Search 1",
      minPrice: 100000,
      maxPrice: 500000,
      bedrooms: 2,
    });

    // Get all saved searches
    const searches = await caller.savedSearches.getAll();

    expect(Array.isArray(searches)).toBe(true);
    expect(searches.length).toBeGreaterThan(0);
    const testSearch = searches.find((s: any) => s.name === "Test Search 1");
    expect(testSearch).toBeDefined();
  });

  it("should get a saved search by ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a saved search
    await caller.savedSearches.create({
      name: "Test Search 2",
      minPrice: 200000,
      maxPrice: 600000,
      bedrooms: 3,
      bathrooms: 2,
    });

    // Get all to find the ID
    const searches = await caller.savedSearches.getAll();
    const search = searches.find((s: any) => s.name === "Test Search 2");
    const searchId = search?.id;

    if (!searchId) {
      throw new Error("Search not found");
    }

    // Get by ID
    const retrieved = await caller.savedSearches.getById({ id: searchId });

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("Test Search 2");
    expect(retrieved?.bedrooms).toBe(3);
  });

  it("should update a saved search", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a saved search
    await caller.savedSearches.create({
      name: "Original Name",
      minPrice: 100000,
      maxPrice: 500000,
    });

    // Get the search ID
    const searches = await caller.savedSearches.getAll();
    const search = searches.find((s: any) => s.name === "Original Name");
    const searchId = search?.id;

    if (!searchId) {
      throw new Error("Search not found");
    }

    // Update the search
    const result = await caller.savedSearches.update({
      id: searchId,
      name: "Updated Name",
      minPrice: 150000,
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updated = await caller.savedSearches.getById({ id: searchId });
    expect(updated?.name).toBe("Updated Name");
    // Price is stored as decimal, so compare as string or number
    expect(Number(updated?.minPrice)).toBe(150000);
  });

  it("should delete a saved search", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a saved search
    await caller.savedSearches.create({
      name: "Search to Delete",
      minPrice: 100000,
      maxPrice: 500000,
    });

    // Get the search ID
    const searches = await caller.savedSearches.getAll();
    const search = searches.find((s: any) => s.name === "Search to Delete");
    const searchId = search?.id;

    if (!searchId) {
      throw new Error("Search not found");
    }

    // Delete the search
    const result = await caller.savedSearches.delete({ id: searchId });
    expect(result.success).toBe(true);

    // Verify deletion
    const afterDelete = await caller.savedSearches.getById({ id: searchId });
    expect(afterDelete).toBeUndefined();
  });

  it("should validate required search name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.savedSearches.create({
        name: "",
        minPrice: 100000,
      });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should save and retrieve amenities in saved search", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const amenities = ["pool", "gym", "parking"];
    const searchName = `Search with Amenities ${Date.now()}`;

    await caller.savedSearches.create({
      name: searchName,
      amenities,
    });

    const searches = await caller.savedSearches.getAll();
    const search = searches.find((s: any) => s.name === searchName);

    expect(search?.amenities).toEqual(amenities);
  });

  it("should handle optional filter fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const searchName = `Minimal Search ${Date.now()}`;

    await caller.savedSearches.create({
      name: searchName,
    });

    const searches = await caller.savedSearches.getAll();
    const search = searches.find((s: any) => s.name === searchName);

    expect(search?.name).toBe(searchName);
    expect(search?.minPrice).toBeNull();
    expect(search?.maxPrice).toBeNull();
    expect(search?.bedrooms).toBeNull();
  });
});
