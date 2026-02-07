import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  router,
  protectedProcedure,
  adminProcedure,
} from "./_core/trpc";
import { importRouter } from "./routers/importRouter";
import {
  getFeaturedProperties,
  getProperties,
  getPropertyImages,
  addPropertyImage,
  deletePropertyImage,
  updateImageOrder,
  getPropertiesByFilters,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from "./db";
import { z } from "zod";
import { getDb, getTestStore, isTestMode } from "./db";
import {
  favorites,
  inquiries,
  InsertInquiry,
  comparisons,
  InsertComparison,
  properties,
  propertyImages,
  InsertPropertyImage,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  properties: router({
    getFeatured: publicProcedure.query(() => getFeaturedProperties(6)),
    getAll: publicProcedure.query(() => getProperties(12, 0)),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPropertyById(input.id)),
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          price: z.number().nonnegative(),
          propertyType: z.enum([
            "house",
            "apartment",
            "condo",
            "townhouse",
            "land",
            "commercial",
          ]),
          bedrooms: z.number().int().nonnegative(),
          bathrooms: z.number().int().nonnegative(),
          squareFeet: z.number().int().nonnegative(),
          address: z.string().min(1),
          city: z.string().min(1),
          state: z.string().min(1),
          zipCode: z.string().min(1),
          latitude: z.number(),
          longitude: z.number(),
          description: z.string().optional(),
          amenities: z.array(z.string()).optional(),
          featured: z.boolean().optional(),
          status: z.enum(["available", "pending", "sold"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createProperty(input);
        return { success: true } as const;
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          price: z.number().nonnegative().optional(),
          propertyType: z
            .enum([
              "house",
              "apartment",
              "condo",
              "townhouse",
              "land",
              "commercial",
            ])
            .optional(),
          bedrooms: z.number().int().nonnegative().optional(),
          bathrooms: z.number().int().nonnegative().optional(),
          squareFeet: z.number().int().nonnegative().optional(),
          address: z.string().min(1).optional(),
          city: z.string().min(1).optional(),
          state: z.string().min(1).optional(),
          zipCode: z.string().min(1).optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          description: z.string().optional(),
          amenities: z.array(z.string()).optional(),
          featured: z.boolean().optional(),
          status: z.enum(["available", "pending", "sold"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return updateProperty(id, updates);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProperty(input.id);
        return { success: true } as const;
      }),
    search: publicProcedure
      .input(
        z.object({
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          propertyType: z.string().optional(),
          amenities: z.array(z.string()).optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(({ input }) =>
        getPropertiesByFilters({
          minPrice: input.minPrice,
          maxPrice: input.maxPrice,
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          propertyType: input.propertyType,
          amenities: input.amenities,
          limit: input.limit,
          offset: input.offset,
        })
      ),
  }),

  favorites: router({
    add: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            const store = getTestStore();
            store.favorites.push({
              id: store.favorites.length + 1,
              userId: ctx.user.id,
              propertyId: input.propertyId,
              createdAt: new Date(),
            });
            return { success: true };
          }
          throw new Error("Database not available");
        }
        await db
          .insert(favorites)
          .values({ userId: ctx.user.id, propertyId: input.propertyId });
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            const store = getTestStore();
            store.favorites = store.favorites.filter(
              favorite =>
                !(
                  favorite.userId === ctx.user.id &&
                  favorite.propertyId === input.propertyId
                )
            );
            return { success: true };
          }
          throw new Error("Database not available");
        }
        await db
          .delete(favorites)
          .where(
            and(
              eq(favorites.userId, ctx.user.id),
              eq(favorites.propertyId, input.propertyId)
            )
          );
        return { success: true };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        if (isTestMode()) {
          const store = getTestStore();
          return store.favorites.filter(
            favorite => favorite.userId === ctx.user.id
          );
        }
        return [];
      }
      return db
        .select()
        .from(favorites)
        .where(eq(favorites.userId, ctx.user.id));
    }),
  }),

  inquiries: router({
    submit: publicProcedure
      .input(
        z.object({
          propertyId: z.number(),
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          message: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            const store = getTestStore();
            store.inquiries.push({
              id: store.inquiries.length + 1,
              propertyId: input.propertyId,
              userId: null,
              name: input.name,
              email: input.email,
              phone: input.phone,
              message: input.message,
              status: "new",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            return { success: true };
          }
          throw new Error("Database not available");
        }

        const inquiry: InsertInquiry = {
          propertyId: input.propertyId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          message: input.message,
        };

        await db.insert(inquiries).values(inquiry);

        // Notify owner
        await notifyOwner({
          title: "New Property Inquiry",
          content: `New inquiry from ${input.name} (${input.email}) for property ID ${input.propertyId}. Message: ${input.message}`,
        });

        return { success: true };
      }),
    list: adminProcedure
      .input(
        z.object({
          status: z.enum(["new", "contacted", "closed"]).optional(),
          search: z.string().optional(),
          limit: z.number().int().positive().optional(),
          offset: z.number().int().nonnegative().optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          if (!isTestMode()) return [];
          const store = getTestStore();
          let results = [...store.inquiries];
          if (input.status) {
            results = results.filter(
              inquiry => inquiry.status === input.status
            );
          }
          if (input.search) {
            const query = input.search.toLowerCase();
            results = results.filter(
              inquiry =>
                inquiry.name.toLowerCase().includes(query) ||
                inquiry.email.toLowerCase().includes(query) ||
                (inquiry.phone
                  ? inquiry.phone.toLowerCase().includes(query)
                  : false)
            );
          }
          const offset = input.offset ?? 0;
          const limit = input.limit ?? results.length;
          return results.slice(offset, offset + limit).map(inquiry => ({
            ...inquiry,
            propertyTitle: `Property #${inquiry.propertyId}`,
          }));
        }

        const allInquiries = await db
          .select()
          .from(inquiries)
          .orderBy(desc(inquiries.createdAt));

        let results = allInquiries;
        if (input.status) {
          results = results.filter(inquiry => inquiry.status === input.status);
        }

        if (input.search) {
          const query = input.search.toLowerCase();
          results = results.filter(inquiry => {
            return (
              inquiry.name.toLowerCase().includes(query) ||
              inquiry.email.toLowerCase().includes(query) ||
              (inquiry.phone
                ? inquiry.phone.toLowerCase().includes(query)
                : false)
            );
          });
        }

        const offset = input.offset ?? 0;
        const limit = input.limit ?? results.length;
        const paged = results.slice(offset, offset + limit);

        const props = await db.select().from(properties);
        const propertyMap = new Map(props.map(p => [p.id, p]));

        return paged.map(inquiry => ({
          ...inquiry,
          propertyTitle:
            propertyMap.get(inquiry.propertyId)?.title ??
            `Property #${inquiry.propertyId}`,
        }));
      }),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "closed"]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            const store = getTestStore();
            const inquiry = store.inquiries.find(item => item.id === input.id);
            if (inquiry) {
              inquiry.status = input.status;
              inquiry.updatedAt = new Date();
            }
            return { success: true } as const;
          }
          throw new Error("Database not available");
        }
        await db
          .update(inquiries)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(inquiries.id, input.id));
        return { success: true } as const;
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            const store = getTestStore();
            store.inquiries = store.inquiries.filter(
              item => item.id !== input.id
            );
            return { success: true } as const;
          }
          throw new Error("Database not available");
        }
        await db.delete(inquiries).where(eq(inquiries.id, input.id));
        return { success: true } as const;
      }),
  }),

  comparisons: router({
    add: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            const store = getTestStore();
            const existing = store.comparisons.find(
              item => item.userId === ctx.user.id
            );
            if (existing) {
              if (
                !existing.propertyIds.includes(input.propertyId) &&
                existing.propertyIds.length < 5
              ) {
                existing.propertyIds.push(input.propertyId);
                existing.updatedAt = new Date();
              }
            } else {
              store.comparisons.push({
                id: store.comparisons.length + 1,
                userId: ctx.user.id,
                propertyIds: [input.propertyId],
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
            return { success: true };
          }
          throw new Error("Database not available");
        }

        const existing = await db
          .select()
          .from(comparisons)
          .where(eq(comparisons.userId, ctx.user.id))
          .limit(1);

        if (existing.length > 0) {
          const comparison = existing[0];
          const propertyIds = comparison.propertyIds || [];
          if (
            !propertyIds.includes(input.propertyId) &&
            propertyIds.length < 5
          ) {
            propertyIds.push(input.propertyId);
            await db
              .update(comparisons)
              .set({ propertyIds, updatedAt: new Date() })
              .where(eq(comparisons.id, comparison.id));
          }
        } else {
          const newComparison: InsertComparison = {
            userId: ctx.user.id,
            propertyIds: [input.propertyId],
          };
          await db.insert(comparisons).values(newComparison);
        }

        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            const store = getTestStore();
            const existing = store.comparisons.find(
              item => item.userId === ctx.user.id
            );
            if (existing) {
              existing.propertyIds = existing.propertyIds.filter(
                (id: number) => id !== input.propertyId
              );
              existing.updatedAt = new Date();
              if (existing.propertyIds.length === 0) {
                store.comparisons = store.comparisons.filter(
                  item => item.userId !== ctx.user.id
                );
              }
            }
            return { success: true };
          }
          throw new Error("Database not available");
        }

        const existing = await db
          .select()
          .from(comparisons)
          .where(eq(comparisons.userId, ctx.user.id))
          .limit(1);

        if (existing.length > 0) {
          const comparison = existing[0];
          const propertyIds = (comparison.propertyIds || []).filter(
            (id: number) => id !== input.propertyId
          );

          if (propertyIds.length === 0) {
            await db
              .delete(comparisons)
              .where(eq(comparisons.id, comparison.id));
          } else {
            await db
              .update(comparisons)
              .set({ propertyIds, updatedAt: new Date() })
              .where(eq(comparisons.id, comparison.id));
          }
        }

        return { success: true };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        if (!isTestMode()) return [];
        const store = getTestStore();
        const comparison = store.comparisons.find(
          item => item.userId === ctx.user.id
        );
        if (!comparison || comparison.propertyIds.length === 0) return [];
        return store.properties.filter(prop =>
          comparison.propertyIds.includes(prop.id)
        );
      }

      const comparison = await db
        .select()
        .from(comparisons)
        .where(eq(comparisons.userId, ctx.user.id))
        .limit(1);

      if (comparison.length === 0) return [];

      const propertyIds = comparison[0].propertyIds || [];
      if (propertyIds.length === 0) return [];

      const props = await db.select().from(properties);
      return props.filter(p => propertyIds.includes(p.id));
    }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        if (!isTestMode()) return [];
        const store = getTestStore();
        const comparison = store.comparisons.find(
          item => item.userId === ctx.user.id
        );
        if (!comparison || comparison.propertyIds.length === 0) return [];
        return store.properties.filter(prop =>
          comparison.propertyIds.includes(prop.id)
        );
      }

      const comparison = await db
        .select()
        .from(comparisons)
        .where(eq(comparisons.userId, ctx.user.id))
        .limit(1);

      if (comparison.length === 0) return [];

      const propertyIds = comparison[0].propertyIds || [];
      if (propertyIds.length === 0) return [];

      const props = await db.select().from(properties);
      return props.filter(p => propertyIds.includes(p.id));
    }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        if (isTestMode()) {
          const store = getTestStore();
          store.comparisons = store.comparisons.filter(
            item => item.userId !== ctx.user.id
          );
          return { success: true };
        }
        throw new Error("Database not available");
      }

      await db.delete(comparisons).where(eq(comparisons.userId, ctx.user.id));
      return { success: true };
    }),
  }),

  images: router({
    getPropertyImages: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return getPropertyImages(input.propertyId);
      }),

    upload: protectedProcedure
      .input(
        z.object({
          propertyId: z.number(),
          imageData: z.string(),
          fileName: z.string(),
          caption: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can upload images");
        }

        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            return { success: true, url: "" };
          }
          throw new Error("Database not available");
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(input.imageData, "base64");
        const fileKey = `properties/${input.propertyId}/images/${nanoid()}-${input.fileName}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, "image/jpeg");

        // Get max display order
        const images = await getPropertyImages(input.propertyId);
        const maxOrder =
          images.length > 0
            ? Math.max(...images.map(img => img.displayOrder || 0))
            : 0;

        // Save to database
        const imageData: InsertPropertyImage = {
          propertyId: input.propertyId,
          imageUrl: url,
          caption: input.caption,
          displayOrder: maxOrder + 1,
        };

        await addPropertyImage(imageData);

        return { success: true, url };
      }),

    delete: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete images");
        }

        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            const store = getTestStore();
            store.propertyImages = store.propertyImages.filter(
              image => image.id !== input.imageId
            );
            return { success: true };
          }
          throw new Error("Database not available");
        }

        await deletePropertyImage(input.imageId);
        return { success: true };
      }),

    reorder: protectedProcedure
      .input(
        z.object({
          imageId: z.number(),
          displayOrder: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can reorder images");
        }

        const db = await getDb();
        if (!db) {
          if (isTestMode()) {
            const store = getTestStore();
            const image = store.propertyImages.find(
              item => item.id === input.imageId
            );
            if (image) image.displayOrder = input.displayOrder;
            return { success: true };
          }
          throw new Error("Database not available");
        }

        await updateImageOrder(input.imageId, input.displayOrder);
        return { success: true };
      }),
  }),

  import: importRouter,

  savedSearches: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "Search name is required").max(255),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          propertyType: z.string().optional(),
          amenities: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createSavedSearch } = await import("./db");
        await createSavedSearch(ctx.user.id, input.name, input);
        return { success: true };
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      const { getSavedSearches } = await import("./db");
      return getSavedSearches(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getSavedSearchById } = await import("./db");
        return getSavedSearchById(input.id, ctx.user.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          propertyType: z.string().optional(),
          amenities: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateSavedSearch } = await import("./db");
        const { id, ...updates } = input;
        await updateSavedSearch(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteSavedSearch } = await import("./db");
        await deleteSavedSearch(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  viewings: router({
    create: protectedProcedure
      .input(
        z.object({
          propertyId: z.number(),
          visitorName: z.string(),
          visitorEmail: z.string().email(),
          visitorPhone: z.string().optional(),
          viewingDate: z.date(),
          viewingTime: z.string(),
          duration: z.number().default(30),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createPropertyViewing, checkViewingConflict } = await import(
          "./db"
        );
        const { sendViewingConfirmationEmail } = await import("./emailService");

        // Check for conflicts
        const hasConflict = await checkViewingConflict(
          input.propertyId,
          input.viewingDate,
          input.viewingTime,
          input.duration
        );
        if (hasConflict) {
          throw new Error("Time slot already booked");
        }

        await createPropertyViewing({
          propertyId: input.propertyId,
          userId: ctx.user.id,
          visitorName: input.visitorName,
          visitorEmail: input.visitorEmail,
          visitorPhone: input.visitorPhone,
          viewingDate: input.viewingDate,
          viewingTime: input.viewingTime,
          duration: input.duration,
          notes: input.notes,
        });

        // Send confirmation email
        try {
          const viewingDate = new Date(input.viewingDate);
          await sendViewingConfirmationEmail({
            visitorName: input.visitorName,
            visitorEmail: input.visitorEmail,
            propertyTitle: "Luxury Modern Home in Prime Location",
            propertyAddress: "123 Oak Street, San Francisco, CA 94102",
            viewingDate: viewingDate,
            viewingTime: input.viewingTime,
            duration: input.duration,
            agentName: "John Smith",
            agentPhone: "(555) 123-4567",
            agentEmail: "john@realestate.com",
            notes: input.notes,
          });
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }

        return { success: true };
      }),

    listByProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        const { getPropertyViewings } = await import("./db");
        return getPropertyViewings(input.propertyId);
      }),

    listByUser: protectedProcedure.query(async ({ ctx }) => {
      const { getUserViewings } = await import("./db");
      return getUserViewings(ctx.user.id);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getViewingById } = await import("./db");
        return getViewingById(input.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z
            .enum(["scheduled", "confirmed", "completed", "cancelled"])
            .optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateViewing, getViewingById } = await import("./db");

        // Verify ownership
        const viewing = await getViewingById(input.id);
        if (!viewing || viewing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        await updateViewing(input.id, {
          status: input.status,
          notes: input.notes,
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteViewing, getViewingById } = await import("./db");

        // Verify ownership
        const viewing = await getViewingById(input.id);
        if (!viewing || viewing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        await deleteViewing(input.id);
        return { success: true };
      }),

    listAll: protectedProcedure
      .input(
        z.object({
          status: z
            .enum(["scheduled", "confirmed", "completed", "cancelled"])
            .optional(),
          propertyId: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          searchQuery: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        const { getAllViewings } = await import("./db");
        return getAllViewings({
          status: input.status,
          propertyId: input.propertyId,
          startDate: input.startDate,
          endDate: input.endDate,
          searchQuery: input.searchQuery,
        });
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        const { updateViewing, getViewingById } = await import("./db");
        const { sendViewingCancellationEmail } = await import("./emailService");
        const viewing = await getViewingById(input.id);
        if (!viewing) {
          throw new Error("Viewing not found");
        }
        if (input.status === "cancelled" && viewing.status !== "cancelled") {
          try {
            await sendViewingCancellationEmail(
              viewing.visitorEmail,
              viewing.visitorName,
              "Property Viewing",
              viewing.viewingDate
            );
          } catch (emailError) {
            console.error("Failed to send cancellation email:", emailError);
          }
        }
        await updateViewing(input.id, { status: input.status });
        return { success: true };
      }),

    bulkUpdateStatus: protectedProcedure
      .input(
        z.object({
          ids: z.array(z.number()),
          status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        const { updateViewing, getViewingById } = await import("./db");
        const { sendViewingCancellationEmail } = await import("./emailService");
        for (const id of input.ids) {
          const viewing = await getViewingById(id);
          if (!viewing) continue;
          if (input.status === "cancelled" && viewing.status !== "cancelled") {
            try {
              await sendViewingCancellationEmail(
                viewing.visitorEmail,
                viewing.visitorName,
                "Property Viewing",
                viewing.viewingDate
              );
            } catch (emailError) {
              console.error("Failed to send cancellation email:", emailError);
            }
          }
          await updateViewing(id, { status: input.status });
        }
        return { success: true, count: input.ids.length };
      }),
  }),
});
export type AppRouter = typeof appRouter;
