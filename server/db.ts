import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, properties, propertyImages, InsertPropertyImage, savedSearches, InsertSavedSearch, propertyViewings, InsertPropertyViewing } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getProperties(limit = 12, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(properties).limit(limit).offset(offset);
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFeaturedProperties(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(properties).where(eq(properties.featured, true)).limit(limit);
}

export async function getPropertyImages(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyImages).where(eq(propertyImages.propertyId, propertyId)).orderBy(propertyImages.displayOrder);
}

export async function addPropertyImage(image: InsertPropertyImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(propertyImages).values(image);
}

export async function deletePropertyImage(imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(propertyImages).where(eq(propertyImages.id, imageId));
}

export async function updateImageOrder(imageId: number, displayOrder: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(propertyImages).set({ displayOrder }).where(eq(propertyImages.id, imageId));
}


export async function createProperty(data: {
  title: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  description?: string;
  amenities?: string;
  featured?: boolean;
  status?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const amenitiesList = data.amenities 
    ? data.amenities.split(",").map(a => a.trim())
    : [];
  
  const result = await db.insert(properties).values({
    title: data.title,
    price: data.price.toString(),
    propertyType: data.propertyType as any,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    squareFeet: data.squareFeet,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    latitude: data.latitude.toString(),
    longitude: data.longitude.toString(),
    description: data.description,
    amenities: amenitiesList.length > 0 ? amenitiesList : undefined,
    featured: data.featured ?? false,
    status: (data.status as any) ?? "available",
  });
  
  return result;
}

export async function bulkCreateProperties(
  propertiesData: Array<{
    title: string;
    price: number;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    description?: string;
    amenities?: string;
    featured?: boolean;
    status?: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = [];
  for (const data of propertiesData) {
    try {
      const result = await createProperty(data);
      results.push({ success: true, data, result });
    } catch (error) {
      results.push({ success: false, data, error });
    }
  }
  
  return results;
}


export async function getPropertiesByAmenities(
  amenities: string[],
  limit = 12,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];

  if (amenities.length === 0) {
    return db.select().from(properties).limit(limit).offset(offset);
  }

  // Get all properties and filter by amenities in memory
  // This is because MySQL JSON_CONTAINS with arrays is complex
  const allProperties = await db.select().from(properties);

  const filtered = allProperties.filter((prop) => {
    if (!prop.amenities || typeof prop.amenities !== "object") return false;
    const propAmenities = Array.isArray(prop.amenities)
      ? prop.amenities
      : Object.values(prop.amenities);
    return amenities.every((amenity) =>
      propAmenities.some(
        (a) =>
          typeof a === "string" &&
          a.toLowerCase().includes(amenity.toLowerCase())
      )
    );
  });

  return filtered.slice(offset, offset + limit);
}

export async function getPropertiesByFilters(filters: {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  amenities?: string[];
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  // Get all properties and apply filters in memory
  const allProperties = await db.select().from(properties);

  let filtered = allProperties;

  // Apply price and other filters
  if (filters.minPrice !== undefined) {
    filtered = filtered.filter(
      (prop: any) => parseFloat(prop.price) >= filters.minPrice!
    );
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter(
      (prop: any) => parseFloat(prop.price) <= filters.maxPrice!
    );
  }

  if (filters.bedrooms !== undefined) {
    filtered = filtered.filter((prop: any) => prop.bedrooms === filters.bedrooms);
  }

  if (filters.bathrooms !== undefined) {
    filtered = filtered.filter((prop: any) => prop.bathrooms === filters.bathrooms);
  }

  if (filters.propertyType) {
    filtered = filtered.filter(
      (prop: any) => prop.propertyType === filters.propertyType
    );
  }

  // Apply amenity filter
  if (filters.amenities && filters.amenities.length > 0) {
    filtered = filtered.filter((prop: any) => {
      if (!prop.amenities || typeof prop.amenities !== "object") return false;
      const propAmenities = Array.isArray(prop.amenities)
        ? prop.amenities
        : Object.values(prop.amenities);
      return filters.amenities!.every((amenity) =>
        propAmenities.some(
          (a: any) =>
            typeof a === "string" &&
            a.toLowerCase().includes(amenity.toLowerCase())
        )
      );
    });
  }

  const limit = filters.limit || 12;
  const offset = filters.offset || 0;

  return filtered.slice(offset, offset + limit);
}


// Saved Searches queries
export async function createSavedSearch(
  userId: number,
  name: string,
  filters: {
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    amenities?: string[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(savedSearches).values({
    userId,
    name,
    minPrice: filters.minPrice ? String(filters.minPrice) : null,
    maxPrice: filters.maxPrice ? String(filters.maxPrice) : null,
    bedrooms: filters.bedrooms || null,
    bathrooms: filters.bathrooms || null,
    propertyType: filters.propertyType || null,
    amenities: filters.amenities || [],
  });

  return result;
}

export async function getSavedSearches(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(savedSearches).where(eq(savedSearches.userId, userId));
}

export async function getSavedSearchById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(savedSearches)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateSavedSearch(
  id: number,
  userId: number,
  updates: {
    name?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    amenities?: string[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.minPrice !== undefined) updateData.minPrice = String(updates.minPrice);
  if (updates.maxPrice !== undefined) updateData.maxPrice = String(updates.maxPrice);
  if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms;
  if (updates.propertyType !== undefined) updateData.propertyType = updates.propertyType;
  if (updates.amenities !== undefined) updateData.amenities = updates.amenities;

  return db
    .update(savedSearches)
    .set(updateData)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));
}

export async function deleteSavedSearch(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));
}


// Property Viewings Management

export async function createPropertyViewing(viewing: InsertPropertyViewing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(propertyViewings).values(viewing);
  return result;
}

export async function getPropertyViewings(propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.propertyId, propertyId));
}

export async function getUserViewings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.userId, userId));
}

export async function getViewingById(viewingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.id, viewingId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateViewing(viewingId: number, updates: Partial<InsertPropertyViewing>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(propertyViewings)
    .set(updates)
    .where(eq(propertyViewings.id, viewingId));
}

export async function deleteViewing(viewingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(propertyViewings)
    .where(eq(propertyViewings.id, viewingId));
}

export async function checkViewingConflict(propertyId: number, viewingDate: Date, viewingTime: string, duration: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all viewings for this property on the same date
  const viewings = await db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.propertyId, propertyId));

  // Filter for same date and check for time conflicts
  const dateStr = viewingDate.toISOString().split('T')[0];
  
  for (const viewing of viewings) {
    const existingDateStr = new Date(viewing.viewingDate).toISOString().split('T')[0];
    
    if (existingDateStr === dateStr && viewing.status !== 'cancelled') {
      // Simple time conflict check
      const existingTime = viewing.viewingTime;
      if (existingTime === viewingTime) {
        return true; // Conflict found
      }
    }
  }

  return false; // No conflict
}


export async function getAllViewings(filters?: {
  status?: string;
  propertyId?: number;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { eq: eqOp, and: andOp, gte: gteOp, lte: lteOp, or: orOp, like: likeOp } = await import("drizzle-orm");
  
  const conditions: any[] = [];

  if (filters?.status) {
    conditions.push(eqOp(propertyViewings.status, filters.status as any));
  }

  if (filters?.propertyId) {
    conditions.push(eqOp(propertyViewings.propertyId, filters.propertyId));
  }

  if (filters?.startDate) {
    conditions.push(gteOp(propertyViewings.viewingDate, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lteOp(propertyViewings.viewingDate, filters.endDate));
  }

  if (filters?.searchQuery) {
    const query = `%${filters.searchQuery}%`;
    conditions.push(
      orOp(
        likeOp(propertyViewings.visitorName, query),
        likeOp(propertyViewings.visitorEmail, query),
        likeOp(propertyViewings.visitorPhone, query)
      )
    );
  }

  const whereClause = conditions.length > 0 ? andOp(...conditions) : undefined;

  return db
    .select()
    .from(propertyViewings)
    .where(whereClause)
    .orderBy(propertyViewings.viewingDate);
}
