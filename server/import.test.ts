import { describe, expect, it } from "vitest";
import {
  parseCSV,
  parseExcel,
  validatePropertyData,
  parseAmenities,
  parseImageUrls,
  generateCSVTemplate,
  PropertyImportSchema,
} from "./importUtils";

describe("importUtils", () => {
  describe("parseCSV", () => {
    it("should parse valid CSV content", async () => {
      const csv = `Title,Price,Property Type,Bedrooms,Bathrooms,Square Feet,Address,City,State,Zip Code,Latitude,Longitude
"Test Property",500000,house,3,2,2000,"123 Main St",Boston,MA,02101,42.3601,-71.0589`;

      const result = await parseCSV(csv);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty("Title");
    });

    it("should handle empty CSV", async () => {
      const csv = "Title,Price,Property Type\n";
      const result = await parseCSV(csv);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("validatePropertyData", () => {
    it("should validate correct property data", () => {
      const data = [
        {
          Title: "Test Property",
          Price: "500000",
          "Property Type": "house",
          Bedrooms: "3",
          Bathrooms: "2",
          "Square Feet": "2000",
          Address: "123 Main St",
          City: "Boston",
          State: "MA",
          "Zip Code": "02101",
          Latitude: "42.3601",
          Longitude: "-71.0589",
        },
      ];

      const result = validatePropertyData(data);
      expect(result.valid.length).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it("should reject invalid property data", () => {
      const data = [
        {
          Title: "",
          Price: "invalid",
          "Property Type": "invalid",
          Bedrooms: "-1",
          Bathrooms: "2",
          "Square Feet": "2000",
          Address: "123 Main St",
          City: "Boston",
          State: "MA",
          "Zip Code": "02101",
          Latitude: "42.3601",
          Longitude: "-71.0589",
        },
      ];

      const result = validatePropertyData(data);
      expect(result.valid.length).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]?.errors.length).toBeGreaterThan(0);
    });

    it("should validate zip code format", () => {
      const validZips = ["02101", "02101-1234"];
      const invalidZips = ["021", "02101-12345"];

      validZips.forEach((zip) => {
        const result = PropertyImportSchema.safeParse({
          title: "Test",
          price: 500000,
          propertyType: "house",
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 2000,
          address: "123 Main St",
          city: "Boston",
          state: "MA",
          zipCode: zip,
          latitude: 42.3601,
          longitude: -71.0589,
        });
        expect(result.success).toBe(true);
      });

      invalidZips.forEach((zip) => {
        const result = PropertyImportSchema.safeParse({
          title: "Test",
          price: 500000,
          propertyType: "house",
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 2000,
          address: "123 Main St",
          city: "Boston",
          state: "MA",
          zipCode: zip,
          latitude: 42.3601,
          longitude: -71.0589,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("parseAmenities", () => {
    it("should parse comma-separated amenities", () => {
      const result = parseAmenities("Pool,Gym,Parking");
      expect(result).toEqual(["Pool", "Gym", "Parking"]);
    });

    it("should trim whitespace", () => {
      const result = parseAmenities(" Pool , Gym , Parking ");
      expect(result).toEqual(["Pool", "Gym", "Parking"]);
    });

    it("should handle empty string", () => {
      const result = parseAmenities("");
      expect(result).toEqual([]);
    });

    it("should handle undefined", () => {
      const result = parseAmenities(undefined);
      expect(result).toEqual([]);
    });
  });

  describe("parseImageUrls", () => {
    it("should parse comma-separated URLs", () => {
      const result = parseImageUrls("https://example.com/1.jpg,https://example.com/2.jpg");
      expect(result.length).toBe(2);
      expect(result[0]).toBe("https://example.com/1.jpg");
    });

    it("should filter invalid URLs", () => {
      const result = parseImageUrls("https://example.com/1.jpg,invalid-url,https://example.com/2.jpg");
      expect(result.length).toBe(2);
    });

    it("should handle empty string", () => {
      const result = parseImageUrls("");
      expect(result).toEqual([]);
    });

    it("should handle undefined", () => {
      const result = parseImageUrls(undefined);
      expect(result).toEqual([]);
    });
  });

  describe("generateCSVTemplate", () => {
    it("should generate valid CSV template", () => {
      const csv = generateCSVTemplate();
      expect(typeof csv).toBe("string");
      expect(csv).toContain("Title");
      expect(csv).toContain("Price");
      expect(csv).toContain("Property Type");
      expect(csv).toContain("Luxury Modern Home");
    });

    it("should include sample data", () => {
      const csv = generateCSVTemplate();
      expect(csv).toContain("Luxury Modern Home");
      expect(csv).toContain("Cozy Downtown Apartment");
    });
  });

  describe("PropertyImportSchema", () => {
    it("should validate all required fields", () => {
      const valid = {
        title: "Test Property",
        price: 500000,
        propertyType: "house",
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        address: "123 Main St",
        city: "Boston",
        state: "MA",
        zipCode: "02101",
        latitude: 42.3601,
        longitude: -71.0589,
      };

      const result = PropertyImportSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept optional fields", () => {
      const valid = {
        title: "Test Property",
        price: 500000,
        propertyType: "house",
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        address: "123 Main St",
        city: "Boston",
        state: "MA",
        zipCode: "02101",
        latitude: 42.3601,
        longitude: -71.0589,
        description: "A nice property",
        amenities: "Pool,Gym",
        imageUrls: "https://example.com/1.jpg",
        status: "available",
      };

      const result = PropertyImportSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate property type enum", () => {
      const valid = {
        title: "Test",
        price: 500000,
        propertyType: "house",
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        address: "123 Main St",
        city: "Boston",
        state: "MA",
        zipCode: "02101",
        latitude: 42.3601,
        longitude: -71.0589,
      };

      const result = PropertyImportSchema.safeParse(valid);
      expect(result.success).toBe(true);

      const invalid = { ...valid, propertyType: "invalid" };
      const invalidResult = PropertyImportSchema.safeParse(invalid);
      expect(invalidResult.success).toBe(false);
    });

    it("should validate latitude and longitude ranges", () => {
      const validCoords = {
        title: "Test",
        price: 500000,
        propertyType: "house",
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        address: "123 Main St",
        city: "Boston",
        state: "MA",
        zipCode: "02101",
        latitude: 0,
        longitude: 0,
      };

      const result = PropertyImportSchema.safeParse(validCoords);
      expect(result.success).toBe(true);

      const invalidLat = { ...validCoords, latitude: 91 };
      const latResult = PropertyImportSchema.safeParse(invalidLat);
      expect(latResult.success).toBe(false);

      const invalidLon = { ...validCoords, longitude: 181 };
      const lonResult = PropertyImportSchema.safeParse(invalidLon);
      expect(lonResult.success).toBe(false);
    });
  });
});
