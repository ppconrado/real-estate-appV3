import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { PropertyStatus, PropertyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminProcedure, router } from "./trpc";
import {
  generateCSVTemplate,
  parseCSV,
  parseExcel,
  parseAmenities,
  parseImageUrls,
  validatePropertyData,
} from "@/server/importUtils";

export const importRouter = router({
  getCSVTemplate: adminProcedure.query(async () => {
    const csv = generateCSVTemplate();
    return {
      filename: "property_import_template.csv",
      content: csv,
      mimeType: "text/csv",
    };
  }),

  parseFile: adminProcedure
    .input(
      z.object({
        fileContent: z.string(),
        fileType: z.enum(["csv", "excel"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const data =
          input.fileType === "csv"
            ? await parseCSV(input.fileContent)
            : parseExcel(input.fileContent);

        const { valid, errors } = validatePropertyData(data);

        return {
          success: true,
          totalRows: data.length,
          validRows: valid.length,
          invalidRows: errors.length,
          validData: valid,
          errors,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File parsing failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),

  importProperties: adminProcedure
    .input(
      z.object({
        properties: z.array(
          z.object({
            title: z.string(),
            price: z.number(),
            propertyType: z.enum([
              "house",
              "apartment",
              "condo",
              "townhouse",
              "land",
              "commercial",
            ]),
            bedrooms: z.number(),
            bathrooms: z.number(),
            squareFeet: z.number(),
            address: z.string(),
            city: z.string(),
            state: z.string(),
            zipCode: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            description: z.string().optional(),
            amenities: z.string().optional(),
            imageUrls: z.string().optional(),
            status: z.enum(["available", "pending", "sold"]).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const importResults: Array<{
        success: boolean;
        property: string;
        message?: string;
        error?: string;
      }> = [];
      let successCount = 0;
      let failureCount = 0;

      for (const propertyData of input.properties) {
        try {
          const property = await prisma.property.create({
            data: {
              title: propertyData.title,
              price: propertyData.price,
              propertyType: propertyData.propertyType as PropertyType,
              bedrooms: propertyData.bedrooms,
              bathrooms: propertyData.bathrooms,
              squareFeet: propertyData.squareFeet,
              address: propertyData.address,
              city: propertyData.city,
              state: propertyData.state,
              zipCode: propertyData.zipCode,
              latitude: propertyData.latitude,
              longitude: propertyData.longitude,
              description: propertyData.description || null,
              amenities: parseAmenities(propertyData.amenities),
              status: (propertyData.status as PropertyStatus) || "available",
            },
          });

          if (propertyData.imageUrls) {
            const imageUrls = parseImageUrls(propertyData.imageUrls);
            for (let i = 0; i < imageUrls.length; i += 1) {
              await prisma.propertyImage.create({
                data: {
                  propertyId: property.id,
                  imageUrl: imageUrls[i],
                  displayOrder: i,
                },
              });
            }
          }

          successCount += 1;
          importResults.push({
            success: true,
            property: propertyData.title,
            message: "Property imported successfully",
          });
        } catch (error) {
          failureCount += 1;
          importResults.push({
            success: false,
            property: propertyData.title,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        totalImported: input.properties.length,
        successCount,
        failureCount,
        results: importResults,
      };
    }),

  downloadTemplate: adminProcedure.query(async () => {
    const csv = generateCSVTemplate();
    return {
      filename: "property_import_template.csv",
      content: csv,
    };
  }),
});
