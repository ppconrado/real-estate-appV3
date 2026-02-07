import { describe, expect, it } from "vitest";
import { getPropertiesByFilters } from "./db";

describe("Amenity Filter", () => {
  it("should filter properties by single amenity", async () => {
    const result = await getPropertiesByFilters({
      amenities: ["pool"],
      limit: 100,
    });

    // Should return properties that have "pool" in amenities
    result.forEach((prop: any) => {
      if (prop.amenities && typeof prop.amenities === "object") {
        const amenities = Array.isArray(prop.amenities)
          ? prop.amenities
          : Object.values(prop.amenities);
        const hasPool = amenities.some(
          (a: any) =>
            typeof a === "string" && a.toLowerCase().includes("pool")
        );
        expect(hasPool).toBe(true);
      }
    });
  });

  it("should filter properties by multiple amenities", async () => {
    const result = await getPropertiesByFilters({
      amenities: ["pool", "gym"],
      limit: 100,
    });

    // Should return properties that have both "pool" and "gym" in amenities
    result.forEach((prop: any) => {
      if (prop.amenities && typeof prop.amenities === "object") {
        const amenities = Array.isArray(prop.amenities)
          ? prop.amenities
          : Object.values(prop.amenities);
        const hasPool = amenities.some(
          (a: any) =>
            typeof a === "string" && a.toLowerCase().includes("pool")
        );
        const hasGym = amenities.some(
          (a: any) =>
            typeof a === "string" && a.toLowerCase().includes("gym")
        );
        expect(hasPool && hasGym).toBe(true);
      }
    });
  });

  it("should return all properties when no amenities filter is applied", async () => {
    const resultWithoutFilter = await getPropertiesByFilters({
      limit: 100,
    });

    const resultWithEmptyAmenities = await getPropertiesByFilters({
      amenities: [],
      limit: 100,
    });

    expect(resultWithoutFilter.length).toBe(resultWithEmptyAmenities.length);
  });

  it("should combine amenity filter with other filters", async () => {
    const result = await getPropertiesByFilters({
      amenities: ["pool"],
      bedrooms: 3,
      minPrice: 100000,
      maxPrice: 1000000,
      limit: 100,
    });

    result.forEach((prop: any) => {
      // Check amenity filter
      if (prop.amenities && typeof prop.amenities === "object") {
        const amenities = Array.isArray(prop.amenities)
          ? prop.amenities
          : Object.values(prop.amenities);
        const hasPool = amenities.some(
          (a: any) =>
            typeof a === "string" && a.toLowerCase().includes("pool")
        );
        expect(hasPool).toBe(true);
      }

      // Check other filters
      expect(prop.bedrooms).toBeGreaterThanOrEqual(3);
      const price = parseFloat(prop.price);
      expect(price).toBeGreaterThanOrEqual(100000);
      expect(price).toBeLessThanOrEqual(1000000);
    });
  });

  it("should be case-insensitive when filtering amenities", async () => {
    const resultLower = await getPropertiesByFilters({
      amenities: ["pool"],
      limit: 100,
    });

    const resultUpper = await getPropertiesByFilters({
      amenities: ["POOL"],
      limit: 100,
    });

    const resultMixed = await getPropertiesByFilters({
      amenities: ["Pool"],
      limit: 100,
    });

    // All should return the same number of results
    expect(resultLower.length).toBe(resultUpper.length);
    expect(resultLower.length).toBe(resultMixed.length);
  });

  it("should handle pagination with amenity filter", async () => {
    const page1 = await getPropertiesByFilters({
      amenities: ["pool"],
      limit: 5,
      offset: 0,
    });

    const page2 = await getPropertiesByFilters({
      amenities: ["pool"],
      limit: 5,
      offset: 5,
    });

    // Pages should not have overlapping properties
    const page1Ids = page1.map((p: any) => p.id);
    const page2Ids = page2.map((p: any) => p.id);

    const overlap = page1Ids.filter((id: any) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });

  it("should handle properties without amenities", async () => {
    const result = await getPropertiesByFilters({
      amenities: ["pool"],
      limit: 100,
    });

    // Should not include properties with no amenities
    result.forEach((prop: any) => {
      expect(prop.amenities).toBeDefined();
      expect(typeof prop.amenities).toBe("object");
    });
  });

  it("should support partial amenity name matching", async () => {
    const result = await getPropertiesByFilters({
      amenities: ["park"],
      limit: 100,
    });

    // Should match "Parking" and similar amenities
    result.forEach((prop: any) => {
      if (prop.amenities && typeof prop.amenities === "object") {
        const amenities = Array.isArray(prop.amenities)
          ? prop.amenities
          : Object.values(prop.amenities);
        const hasParking = amenities.some(
          (a: any) =>
            typeof a === "string" && a.toLowerCase().includes("park")
        );
        expect(hasParking).toBe(true);
      }
    });
  });
});
