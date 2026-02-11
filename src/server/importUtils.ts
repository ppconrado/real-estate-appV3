import { z } from "zod";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export const PropertyImportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  price: z.coerce.number().positive("Price must be positive"),
  propertyType: z.enum([
    "house",
    "apartment",
    "condo",
    "townhouse",
    "land",
    "commercial",
  ]),
  bedrooms: z.coerce
    .number()
    .int()
    .nonnegative("Bedrooms must be non-negative"),
  bathrooms: z.coerce.number().nonnegative("Bathrooms must be non-negative"),
  squareFeet: z.coerce.number().positive("Square feet must be positive"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2).max(2, "State must be 2 letters"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format"),
  latitude: z.coerce.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.coerce.number().min(-180).max(180, "Invalid longitude"),
  description: z.string().optional(),
  amenities: z.string().optional(),
  imageUrls: z.string().optional(),
  status: z.enum(["available", "sold", "pending"]).default("available"),
});

export type PropertyImportData = z.infer<typeof PropertyImportSchema>;

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: Array<{
    rowNumber: number;
    data: Record<string, unknown>;
    errors: string[];
  }>;
}

export function parseCSV(
  fileContent: string
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        resolve(results.data);
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

export function parseExcel(
  fileData: ArrayBuffer | string
): Record<string, unknown>[] {
  try {
    let buffer: ArrayBuffer;
    if (typeof fileData === "string") {
      const binaryString = atob(fileData.split(",")[1] || fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      buffer = bytes.buffer;
    } else {
      buffer = fileData;
    }

    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("No sheets found in Excel file");
    }

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    return data;
  } catch (error) {
    throw new Error(
      `Excel parsing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function validatePropertyData(data: Record<string, unknown>[]): {
  valid: PropertyImportData[];
  errors: Array<{
    rowNumber: number;
    data: Record<string, unknown>;
    errors: string[];
  }>;
} {
  const valid: PropertyImportData[] = [];
  const errors: Array<{
    rowNumber: number;
    data: Record<string, unknown>;
    errors: string[];
  }> = [];

  data.forEach((row, index) => {
    try {
      const normalized = normalizeRow(row);
      const validated = PropertyImportSchema.parse(normalized);
      valid.push(validated);
    } catch (error) {
      const zodError = error instanceof z.ZodError ? error : null;
      const errorMessages = zodError
        ? zodError.issues.map(
            issue => `${issue.path.join(".")}: ${issue.message}`
          )
        : [error instanceof Error ? error.message : "Unknown validation error"];

      errors.push({
        rowNumber: index + 2,
        data: row,
        errors: errorMessages,
      });
    }
  });

  return { valid, errors };
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.toLowerCase().trim();
    let normalizedValue = value;

    if (typeof value === "string") {
      normalizedValue = value.trim();
    }

    const keyMap: Record<string, string> = {
      "property title": "title",
      "property type": "propertyType",
      type: "propertyType",
      beds: "bedrooms",
      baths: "bathrooms",
      sqft: "squareFeet",
      "square feet": "squareFeet",
      "sq ft": "squareFeet",
      zip: "zipCode",
      "zip code": "zipCode",
      lat: "latitude",
      lon: "longitude",
      lng: "longitude",
      "image urls": "imageUrls",
      images: "imageUrls",
      amenities: "amenities",
      description: "description",
      status: "status",
    };

    const mappedKey = keyMap[normalizedKey] || normalizedKey;
    normalized[mappedKey] = normalizedValue;
  }

  return normalized;
}

export function parseAmenities(amenitiesStr: string | undefined): string[] {
  if (!amenitiesStr) return [];
  return amenitiesStr
    .split(",")
    .map(a => a.trim())
    .filter(a => a.length > 0);
}

export function parseImageUrls(imageUrlsStr: string | undefined): string[] {
  if (!imageUrlsStr) return [];
  return imageUrlsStr
    .split(",")
    .map(url => url.trim())
    .filter(url => url.length > 0 && isValidUrl(url));
}

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

export function generateCSVTemplate(): string {
  const headers = [
    "Title",
    "Price",
    "Property Type",
    "Bedrooms",
    "Bathrooms",
    "Square Feet",
    "Address",
    "City",
    "State",
    "Zip Code",
    "Latitude",
    "Longitude",
    "Description",
    "Amenities",
    "Image URLs",
    "Status",
  ];

  const sampleData = [
    [
      "Luxury Modern Home",
      "2500000",
      "house",
      "5",
      "4",
      "5200",
      "123 Oak Street",
      "San Francisco",
      "CA",
      "94102",
      "37.7749",
      "-122.4194",
      "Stunning modern home with panoramic city views",
      "Swimming Pool,Home Theater,Smart Home,Hardwood Floors",
      "https://example.com/image1.jpg,https://example.com/image2.jpg",
      "available",
    ],
    [
      "Cozy Downtown Apartment",
      "850000",
      "apartment",
      "2",
      "2",
      "1200",
      "456 Main Avenue",
      "San Francisco",
      "CA",
      "94103",
      "37.7837",
      "-122.4090",
      "Modern apartment in the heart of downtown",
      "Gym,Concierge,Parking",
      "https://example.com/image3.jpg",
      "available",
    ],
  ];

  const rows = [headers, ...sampleData];
  return rows.map(row => row.join(",")).join("\n");
}
