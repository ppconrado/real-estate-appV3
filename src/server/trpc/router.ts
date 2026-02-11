import { z } from "zod";
import type { Prisma, Property } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyOwner } from "@/server/notification";
import { storagePutImage } from "@/server/storage";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./trpc";
import { importRouter } from "./importRouter";
import { nanoid } from "nanoid";
import {
  sendViewingCancellationEmail,
  sendViewingConfirmationEmail,
} from "@/server/emailService";

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const mapProperty = (property: Property) => ({
  ...property,
  price: toNumber(property.price),
  latitude: toNumber(property.latitude),
  longitude: toNumber(property.longitude),
});

const mapPropertyWithImages = (
  property: Prisma.PropertyGetPayload<{ include: { images: true } }>
) => ({
  ...mapProperty(property),
  images: property.images,
});

const toIdArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((id): id is number => typeof id === "number")
    : [];

export const appRouter = router({
  system: router({
    health: publicProcedure
      .input(z.object({ timestamp: z.number().min(0) }))
      .query(() => ({ ok: true })),
    notifyOwner: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          content: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const delivered = await notifyOwner(input);
        return { success: delivered } as const;
      }),
  }),

  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      console.log("[auth.me] Returning user:", ctx.user);
      return ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.clearSessionCookie();
      return { success: true } as const;
    }),
  }),

  properties: router({
    getFeatured: publicProcedure.query(async () => {
      const results = await prisma.property.findMany({
        where: { featured: true },
        take: 6,
        include: { images: { orderBy: { displayOrder: "asc" }, take: 1 } },
      });
      console.log(
        "[properties.getFeatured] Returning",
        results.length,
        "properties"
      );
      return results.map(mapPropertyWithImages);
    }),
    getAll: publicProcedure.query(async () => {
      const results = await prisma.property.findMany({
        take: 12,
        include: { images: { orderBy: { displayOrder: "asc" }, take: 1 } },
      });
      return results.map(mapPropertyWithImages);
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }).optional())
      .query(async ({ input }) => {
        if (!input?.id) return null;
        console.log("[properties.getById] Requested id:", input.id);
        const property = await prisma.property.findUnique({
          where: { id: input.id },
        });
        if (!property) {
          console.warn("[properties.getById] Not found for id:", input.id);
        }
        return property ? mapProperty(property) : null;
      }),
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
        await prisma.property.create({
          data: {
            title: input.title,
            price: input.price,
            propertyType: input.propertyType,
            bedrooms: input.bedrooms,
            bathrooms: input.bathrooms,
            squareFeet: input.squareFeet,
            address: input.address,
            city: input.city,
            state: input.state,
            zipCode: input.zipCode,
            latitude: input.latitude,
            longitude: input.longitude,
            description: input.description ?? null,
            amenities: input.amenities ?? [],
            featured: input.featured ?? false,
            status: input.status ?? "available",
          },
        });
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
        await prisma.property.update({
          where: { id },
          data: {
            ...updates,
            description: updates.description ?? undefined,
            amenities: updates.amenities ?? undefined,
          },
        });
        return { success: true } as const;
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await prisma.property.delete({ where: { id: input.id } });
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
      .query(async ({ input }) => {
        const allProperties = await prisma.property.findMany();
        let filtered = allProperties;

        if (input.minPrice !== undefined) {
          filtered = filtered.filter(
            prop => Number(prop.price) >= input.minPrice!
          );
        }

        if (input.maxPrice !== undefined) {
          filtered = filtered.filter(
            prop => Number(prop.price) <= input.maxPrice!
          );
        }

        if (input.bedrooms !== undefined) {
          filtered = filtered.filter(prop => prop.bedrooms === input.bedrooms);
        }

        if (input.bathrooms !== undefined) {
          filtered = filtered.filter(
            prop => prop.bathrooms === input.bathrooms
          );
        }

        if (input.propertyType) {
          filtered = filtered.filter(
            prop => prop.propertyType === input.propertyType
          );
        }

        if (input.amenities && input.amenities.length > 0) {
          filtered = filtered.filter(prop => {
            const propAmenities = Array.isArray(prop.amenities)
              ? prop.amenities
              : Object.values(
                  (prop.amenities || {}) as Record<string, unknown>
                );
            return input.amenities!.every(amenity =>
              propAmenities.some(
                a =>
                  typeof a === "string" &&
                  a.toLowerCase().includes(amenity.toLowerCase())
              )
            );
          });
        }

        const limit = input.limit ?? 12;
        const offset = input.offset ?? 0;
        return filtered.slice(offset, offset + limit).map(mapProperty);
      }),
  }),

  favorites: router({
    add: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await prisma.favorite.create({
          data: { userId: ctx.user.id, propertyId: input.propertyId },
        });
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await prisma.favorite.deleteMany({
          where: { userId: ctx.user.id, propertyId: input.propertyId },
        });
        return { success: true } as const;
      }),
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return prisma.favorite.findMany({
        where: { userId: ctx.user.id },
      });
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
        await prisma.inquiry.create({
          data: {
            propertyId: input.propertyId,
            name: input.name,
            email: input.email,
            phone: input.phone,
            message: input.message,
          },
        });

        await notifyOwner({
          title: "New Property Inquiry",
          content: `New inquiry from ${input.name} (${input.email}) for property ID ${input.propertyId}. Message: ${input.message}`,
        });

        return { success: true } as const;
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
        const where: Prisma.InquiryWhereInput = {};
        if (input.status) {
          where.status = input.status;
        }
        if (input.search) {
          const query = input.search;
          where.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ];
        }

        const inquiries = await prisma.inquiry.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit ?? undefined,
          skip: input.offset ?? undefined,
          include: { property: { select: { title: true } } },
        });

        return inquiries.map(inquiry => ({
          ...inquiry,
          propertyTitle:
            inquiry.property?.title ?? `Property #${inquiry.propertyId}`,
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
        await prisma.inquiry.update({
          where: { id: input.id },
          data: { status: input.status },
        });
        return { success: true } as const;
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await prisma.inquiry.delete({ where: { id: input.id } });
        return { success: true } as const;
      }),
  }),

  comparisons: router({
    add: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await prisma.comparison.findFirst({
          where: { userId: ctx.user.id },
        });

        if (existing) {
          const propertyIds = [...toIdArray(existing.propertyIds)];
          if (
            !propertyIds.includes(input.propertyId) &&
            propertyIds.length < 5
          ) {
            propertyIds.push(input.propertyId);
            await prisma.comparison.update({
              where: { id: existing.id },
              data: { propertyIds, updatedAt: new Date() },
            });
          }
        } else {
          await prisma.comparison.create({
            data: { userId: ctx.user.id, propertyIds: [input.propertyId] },
          });
        }

        return { success: true } as const;
      }),

    remove: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await prisma.comparison.findFirst({
          where: { userId: ctx.user.id },
        });
        if (!existing) return { success: true } as const;

        const propertyIds = toIdArray(existing.propertyIds).filter(
          id => id !== input.propertyId
        );

        if (propertyIds.length === 0) {
          await prisma.comparison.delete({ where: { id: existing.id } });
        } else {
          await prisma.comparison.update({
            where: { id: existing.id },
            data: { propertyIds, updatedAt: new Date() },
          });
        }

        return { success: true } as const;
      }),

    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      const existing = await prisma.comparison.findFirst({
        where: { userId: ctx.user.id },
      });
      if (!existing) return [];
      const propertyIds = toIdArray(existing.propertyIds);
      if (propertyIds.length === 0) return [];

      const properties = await prisma.property.findMany({
        where: { id: { in: propertyIds } },
      });
      return properties.map(mapProperty);
    }),

    getAll: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      const existing = await prisma.comparison.findFirst({
        where: { userId: ctx.user.id },
      });
      if (!existing) return [];
      const propertyIds = toIdArray(existing.propertyIds);
      if (propertyIds.length === 0) return [];

      const properties = await prisma.property.findMany({
        where: { id: { in: propertyIds } },
      });
      return properties.map(mapProperty);
    }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await prisma.comparison.deleteMany({ where: { userId: ctx.user.id } });
      return { success: true } as const;
    }),
  }),

  images: router({
    getPropertyImages: publicProcedure
      .input(z.object({ propertyId: z.number() }).optional())
      .query(async ({ input }) => {
        if (!input?.propertyId) return [];
        return prisma.propertyImage.findMany({
          where: { propertyId: input.propertyId },
          orderBy: { displayOrder: "asc" },
        });
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
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can upload images");
        }

        const buffer = Buffer.from(input.imageData, "base64");
        const fileKey = `properties/${input.propertyId}/images/${nanoid()}-${input.fileName}`;
        const { url } = await storagePutImage(fileKey, buffer, "image/jpeg");

        const images = await prisma.propertyImage.findMany({
          where: { propertyId: input.propertyId },
        });
        const maxOrder =
          images.length > 0
            ? Math.max(...images.map(img => img.displayOrder || 0))
            : 0;

        await prisma.propertyImage.create({
          data: {
            propertyId: input.propertyId,
            imageUrl: url,
            caption: input.caption,
            displayOrder: maxOrder + 1,
          },
        });

        return { success: true, url } as const;
      }),

    delete: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete images");
        }

        await prisma.propertyImage.delete({ where: { id: input.imageId } });
        return { success: true } as const;
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

        await prisma.propertyImage.update({
          where: { id: input.imageId },
          data: { displayOrder: input.displayOrder },
        });
        return { success: true } as const;
      }),
  }),

  import: importRouter,

  savedSearches: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          propertyType: z.string().optional(),
          amenities: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await prisma.savedSearch.create({
          data: {
            userId: ctx.user.id,
            name: input.name,
            minPrice: input.minPrice ?? null,
            maxPrice: input.maxPrice ?? null,
            bedrooms: input.bedrooms ?? null,
            bathrooms: input.bathrooms ?? null,
            propertyType: input.propertyType ?? null,
            amenities: input.amenities ?? [],
          },
        });
        return { success: true } as const;
      }),

    getAll: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return prisma.savedSearch.findMany({ where: { userId: ctx.user.id } });
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return prisma.savedSearch.findFirst({
          where: { id: input.id, userId: ctx.user.id },
        });
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
        const { id, ...updates } = input;
        await prisma.savedSearch.updateMany({
          where: { id, userId: ctx.user.id },
          data: {
            ...updates,
            amenities: updates.amenities ?? undefined,
          },
        });
        return { success: true } as const;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await prisma.savedSearch.deleteMany({
          where: { id: input.id, userId: ctx.user.id },
        });
        return { success: true } as const;
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
        const dateStr = input.viewingDate.toISOString().split("T")[0];
        const existing = await prisma.propertyViewing.findMany({
          where: { propertyId: input.propertyId },
        });
        const conflict = existing.some(viewing => {
          const existingDateStr = new Date(viewing.viewingDate)
            .toISOString()
            .split("T")[0];
          return (
            existingDateStr === dateStr &&
            viewing.status !== "cancelled" &&
            viewing.viewingTime === input.viewingTime
          );
        });

        if (conflict) {
          throw new Error("Time slot already booked");
        }

        await prisma.propertyViewing.create({
          data: {
            propertyId: input.propertyId,
            userId: ctx.user.id,
            visitorName: input.visitorName,
            visitorEmail: input.visitorEmail,
            visitorPhone: input.visitorPhone,
            viewingDate: input.viewingDate,
            viewingTime: input.viewingTime,
            duration: input.duration,
            notes: input.notes,
          },
        });

        try {
          await sendViewingConfirmationEmail({
            visitorName: input.visitorName,
            visitorEmail: input.visitorEmail,
            propertyTitle: "Luxury Modern Home in Prime Location",
            propertyAddress: "123 Oak Street, San Francisco, CA 94102",
            viewingDate: new Date(input.viewingDate),
            viewingTime: input.viewingTime,
            duration: input.duration,
            agentName: "John Smith",
            agentPhone: "(555) 123-4567",
            agentEmail: "john@realestate.com",
            notes: input.notes,
          });
        } catch (error) {
          console.error("Failed to send confirmation email:", error);
        }

        return { success: true } as const;
      }),

    listByProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return prisma.propertyViewing.findMany({
          where: { propertyId: input.propertyId },
        });
      }),

    listByUser: protectedProcedure.query(async ({ ctx }) => {
      return prisma.propertyViewing.findMany({
        where: { userId: ctx.user.id },
      });
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return prisma.propertyViewing.findUnique({ where: { id: input.id } });
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
        const viewing = await prisma.propertyViewing.findUnique({
          where: { id: input.id },
        });
        if (!viewing || viewing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        await prisma.propertyViewing.update({
          where: { id: input.id },
          data: {
            status: input.status ?? undefined,
            notes: input.notes ?? undefined,
          },
        });

        return { success: true } as const;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const viewing = await prisma.propertyViewing.findUnique({
          where: { id: input.id },
        });
        if (!viewing || viewing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        await prisma.propertyViewing.delete({ where: { id: input.id } });
        return { success: true } as const;
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
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        const where: Prisma.PropertyViewingWhereInput = {};
        if (input.status) where.status = input.status;
        if (input.propertyId) where.propertyId = input.propertyId;
        if (input.startDate || input.endDate) {
          where.viewingDate = {};
          if (input.startDate) where.viewingDate.gte = input.startDate;
          if (input.endDate) where.viewingDate.lte = input.endDate;
        }
        if (input.searchQuery) {
          where.OR = [
            {
              visitorName: { contains: input.searchQuery, mode: "insensitive" },
            },
            {
              visitorEmail: {
                contains: input.searchQuery,
                mode: "insensitive",
              },
            },
            {
              visitorPhone: {
                contains: input.searchQuery,
                mode: "insensitive",
              },
            },
          ];
        }

        return prisma.propertyViewing.findMany({
          where,
          orderBy: { viewingDate: "asc" },
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
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        const viewing = await prisma.propertyViewing.findUnique({
          where: { id: input.id },
        });
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
          } catch (error) {
            console.error("Failed to send cancellation email:", error);
          }
        }

        await prisma.propertyViewing.update({
          where: { id: input.id },
          data: { status: input.status },
        });

        return { success: true } as const;
      }),

    bulkUpdateStatus: protectedProcedure
      .input(
        z.object({
          ids: z.array(z.number()),
          status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        for (const id of input.ids) {
          const viewing = await prisma.propertyViewing.findUnique({
            where: { id },
          });
          if (!viewing) continue;

          if (input.status === "cancelled" && viewing.status !== "cancelled") {
            try {
              await sendViewingCancellationEmail(
                viewing.visitorEmail,
                viewing.visitorName,
                "Property Viewing",
                viewing.viewingDate
              );
            } catch (error) {
              console.error("Failed to send cancellation email:", error);
            }
          }

          await prisma.propertyViewing.update({
            where: { id },
            data: { status: input.status },
          });
        }

        return { success: true, count: input.ids.length } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
