import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  parseCSV,
  parseExcel,
  validatePropertyData,
  parseAmenities,
  parseImageUrls,
  generateCSVTemplate,
} from "../importUtils";
import { bulkCreateProperties, addPropertyImage } from "../db";
import { storagePut } from "../storage";

export const importRouter = router({
  /**
   * Get CSV template for bulk import
   */
  getCSVTemplate: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can download CSV templates",
      });
    }

    const csv = generateCSVTemplate();
    return {
      filename: "property_import_template.csv",
      content: csv,
      mimeType: "text/csv",
    };
  }),

  /**
   * Parse and validate CSV/Excel file
   */
  parseFile: protectedProcedure
    .input(
      z.object({
        fileContent: z.string(),
        fileType: z.enum(["csv", "excel"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can import properties",
        });
      }

      try {
        let data;

        if (input.fileType === "csv") {
          data = await parseCSV(input.fileContent);
        } else {
          data = parseExcel(input.fileContent);
        }

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
          message: `File parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Import properties with optional image URLs
   */
  importProperties: protectedProcedure
    .input(
      z.object({
        properties: z.array(
          z.object({
            title: z.string(),
            price: z.number(),
            propertyType: z.string(),
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
            status: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can import properties",
        });
      }

      const importResults = [];
      let successCount = 0;
      let failureCount = 0;

      for (const propertyData of input.properties) {
        try {
          // Create property
          const result = await bulkCreateProperties([propertyData]);

          if (result[0]?.success) {
            successCount++;

            // Handle image URLs if provided
            if (propertyData.imageUrls) {
              const imageUrls = parseImageUrls(propertyData.imageUrls);
              const propertyId = (result[0].result as any)?.insertId;

              if (propertyId && imageUrls.length > 0) {
                for (let i = 0; i < imageUrls.length; i++) {
                  try {
                    const imageUrl = imageUrls[i];

                    // Add image record to database
                    await addPropertyImage({
                      propertyId,
                      imageUrl,
                      displayOrder: i,
                    });
                  } catch (imageError) {
                    console.error(`Failed to add image for property ${propertyId}:`, imageError);
                  }
                }
              }
            }

            importResults.push({
              success: true,
              property: propertyData.title,
              message: "Property imported successfully",
            });
          } else {
            failureCount++;
            importResults.push({
              success: false,
              property: propertyData.title,
              error: result[0]?.error instanceof Error ? result[0].error.message : "Unknown error",
            });
          }
        } catch (error) {
          failureCount++;
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

  /**
   * Download sample CSV template
   */
  downloadTemplate: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can download templates",
      });
    }

    const csv = generateCSVTemplate();
    return {
      filename: "property_import_template.csv",
      content: csv,
    };
  }),
});
