import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  properties,
  propertyImages,
  InsertPropertyImage,
  savedSearches,
  InsertSavedSearch,
  propertyViewings,
  InsertPropertyViewing,
  favorites,
  inquiries,
  comparisons,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

const isTestEnv = () =>
  process.env.NODE_ENV === "test" || process.env.VITEST === "true";

type StoreKey =
  | "properties"
  | "propertyImages"
  | "favorites"
  | "inquiries"
  | "comparisons"
  | "savedSearches"
  | "propertyViewings"
  | "users";

const testStore: Record<StoreKey, any[]> = {
  properties: [],
  propertyImages: [],
  favorites: [],
  inquiries: [],
  comparisons: [],
  savedSearches: [],
  propertyViewings: [],
  users: [],
};

const testIds: Record<StoreKey, number> = {
  properties: 1,
  propertyImages: 1,
  favorites: 1,
  inquiries: 1,
  comparisons: 1,
  savedSearches: 1,
  propertyViewings: 1,
  users: 1,
};

const nextTestId = (key: StoreKey) => testIds[key]++;

export const getTestStore = () => testStore;
export const isTestMode = () => isTestEnv();

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
      values.role = "admin";
      updateSet.role = "admin";
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getProperties(limit = 12, offset = 0) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) return [];
    return testStore.properties.slice(offset, offset + limit);
  }
  return db.select().from(properties).limit(limit).offset(offset);
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) return undefined;
    return testStore.properties.find(prop => prop.id === id);
  }
  const result = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFeaturedProperties(limit = 6) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) return [];
    return testStore.properties.filter(prop => prop.featured).slice(0, limit);
  }
  return db
    .select()
    .from(properties)
    .where(eq(properties.featured, true))
    .limit(limit);
}

export async function getPropertyImages(propertyId: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) return [];
    return testStore.propertyImages
      .filter(image => image.propertyId === propertyId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }
  return db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(propertyImages.displayOrder);
}

export async function addPropertyImage(image: InsertPropertyImage) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    const record = {
      id: nextTestId("propertyImages"),
      createdAt: new Date(),
      ...image,
    };
    testStore.propertyImages.push(record);
    return { insertId: record.id } as const;
  }
  return db.insert(propertyImages).values(image);
}

export async function deletePropertyImage(imageId: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    testStore.propertyImages = testStore.propertyImages.filter(
      image => image.id !== imageId
    );
    return { success: true } as const;
  }
  return db.delete(propertyImages).where(eq(propertyImages.id, imageId));
}

export async function updateImageOrder(imageId: number, displayOrder: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    const image = testStore.propertyImages.find(item => item.id === imageId);
    if (image) image.displayOrder = displayOrder;
    return { success: true } as const;
  }
  return db
    .update(propertyImages)
    .set({ displayOrder })
    .where(eq(propertyImages.id, imageId));
}

const normalizeAmenities = (amenities?: string[] | string) => {
  if (!amenities) return [];
  if (Array.isArray(amenities)) {
    return amenities.map(a => a.trim()).filter(Boolean);
  }
  return amenities
    .split(",")
    .map(a => a.trim())
    .filter(Boolean);
};

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
  amenities?: string[] | string;
  featured?: boolean;
  status?: string;
}) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    const record = {
      id: nextTestId("properties"),
      createdAt: new Date(),
      updatedAt: new Date(),
      title: data.title,
      price: data.price,
      propertyType: data.propertyType,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      squareFeet: data.squareFeet,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
      amenities: normalizeAmenities(data.amenities),
      featured: data.featured ?? false,
      status: data.status ?? "available",
    };
    testStore.properties.push(record);
    return { insertId: record.id } as const;
  }

  const amenitiesList = normalizeAmenities(data.amenities);

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

export async function updateProperty(
  id: number,
  data: {
    title?: string;
    price?: number;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    amenities?: string[] | string;
    featured?: boolean;
    status?: string;
  }
) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    const record = testStore.properties.find(prop => prop.id === id);
    if (!record)
      return { success: false, message: "Property not found" } as const;

    if (data.title !== undefined) record.title = data.title;
    if (data.price !== undefined) record.price = data.price;
    if (data.propertyType !== undefined)
      record.propertyType = data.propertyType;
    if (data.bedrooms !== undefined) record.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) record.bathrooms = data.bathrooms;
    if (data.squareFeet !== undefined) record.squareFeet = data.squareFeet;
    if (data.address !== undefined) record.address = data.address;
    if (data.city !== undefined) record.city = data.city;
    if (data.state !== undefined) record.state = data.state;
    if (data.zipCode !== undefined) record.zipCode = data.zipCode;
    if (data.latitude !== undefined) record.latitude = data.latitude;
    if (data.longitude !== undefined) record.longitude = data.longitude;
    if (data.description !== undefined) record.description = data.description;
    if (data.amenities !== undefined)
      record.amenities = normalizeAmenities(data.amenities);
    if (data.featured !== undefined) record.featured = data.featured;
    if (data.status !== undefined) record.status = data.status;
    record.updatedAt = new Date();
    return { success: true } as const;
  }

  const updateSet: Record<string, unknown> = {};

  if (data.title !== undefined) updateSet.title = data.title;
  if (data.price !== undefined) updateSet.price = data.price.toString();
  if (data.propertyType !== undefined)
    updateSet.propertyType = data.propertyType as any;
  if (data.bedrooms !== undefined) updateSet.bedrooms = data.bedrooms;
  if (data.bathrooms !== undefined) updateSet.bathrooms = data.bathrooms;
  if (data.squareFeet !== undefined) updateSet.squareFeet = data.squareFeet;
  if (data.address !== undefined) updateSet.address = data.address;
  if (data.city !== undefined) updateSet.city = data.city;
  if (data.state !== undefined) updateSet.state = data.state;
  if (data.zipCode !== undefined) updateSet.zipCode = data.zipCode;
  if (data.latitude !== undefined)
    updateSet.latitude = data.latitude.toString();
  if (data.longitude !== undefined)
    updateSet.longitude = data.longitude.toString();
  if (data.description !== undefined) updateSet.description = data.description;
  if (data.amenities !== undefined) {
    const amenitiesList = normalizeAmenities(data.amenities);
    updateSet.amenities = amenitiesList.length > 0 ? amenitiesList : [];
  }
  if (data.featured !== undefined) updateSet.featured = data.featured;
  if (data.status !== undefined) updateSet.status = data.status as any;

  if (Object.keys(updateSet).length === 0) {
    return { success: false, message: "No updates provided" } as const;
  }

  await db.update(properties).set(updateSet).where(eq(properties.id, id));
  return { success: true } as const;
}

export async function deleteProperty(id: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    testStore.propertyImages = testStore.propertyImages.filter(
      image => image.propertyId !== id
    );
    testStore.favorites = testStore.favorites.filter(
      favorite => favorite.propertyId !== id
    );
    testStore.inquiries = testStore.inquiries.filter(
      inquiry => inquiry.propertyId !== id
    );
    testStore.propertyViewings = testStore.propertyViewings.filter(
      viewing => viewing.propertyId !== id
    );
    testStore.properties = testStore.properties.filter(prop => prop.id !== id);
    return { success: true } as const;
  }

  await db.delete(propertyImages).where(eq(propertyImages.propertyId, id));
  await db.delete(favorites).where(eq(favorites.propertyId, id));
  await db.delete(inquiries).where(eq(inquiries.propertyId, id));
  await db.delete(propertyViewings).where(eq(propertyViewings.propertyId, id));
  return db.delete(properties).where(eq(properties.id, id));
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

  const filtered = allProperties.filter(prop => {
    if (!prop.amenities || typeof prop.amenities !== "object") return false;
    const propAmenities = Array.isArray(prop.amenities)
      ? prop.amenities
      : Object.values(prop.amenities);
    return amenities.every(amenity =>
      propAmenities.some(
        a =>
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
    filtered = filtered.filter(
      (prop: any) => prop.bedrooms === filters.bedrooms
    );
  }

  if (filters.bathrooms !== undefined) {
    filtered = filtered.filter(
      (prop: any) => prop.bathrooms === filters.bathrooms
    );
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
      return filters.amenities!.every(amenity =>
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
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    const record = {
      id: nextTestId("savedSearches"),
      userId,
      name,
      minPrice: filters.minPrice ? String(filters.minPrice) : null,
      maxPrice: filters.maxPrice ? String(filters.maxPrice) : null,
      bedrooms: filters.bedrooms ?? null,
      bathrooms: filters.bathrooms ?? null,
      propertyType: filters.propertyType ?? null,
      amenities: filters.amenities ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    testStore.savedSearches.push(record);
    return { insertId: record.id } as const;
  }

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
  if (!db) {
    if (!isTestEnv()) return [];
    return testStore.savedSearches.filter(search => search.userId === userId);
  }

  return db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId));
}

export async function getSavedSearchById(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) return undefined;
    return testStore.savedSearches.find(
      search => search.id === id && search.userId === userId
    );
  }

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
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    const record = testStore.savedSearches.find(
      search => search.id === id && search.userId === userId
    );
    if (!record) return { success: false } as const;
    if (updates.name !== undefined) record.name = updates.name;
    if (updates.minPrice !== undefined)
      record.minPrice = String(updates.minPrice);
    if (updates.maxPrice !== undefined)
      record.maxPrice = String(updates.maxPrice);
    if (updates.bedrooms !== undefined) record.bedrooms = updates.bedrooms;
    if (updates.bathrooms !== undefined) record.bathrooms = updates.bathrooms;
    if (updates.propertyType !== undefined)
      record.propertyType = updates.propertyType;
    if (updates.amenities !== undefined) record.amenities = updates.amenities;
    record.updatedAt = new Date();
    return { success: true } as const;
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.minPrice !== undefined)
    updateData.minPrice = String(updates.minPrice);
  if (updates.maxPrice !== undefined)
    updateData.maxPrice = String(updates.maxPrice);
  if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms;
  if (updates.propertyType !== undefined)
    updateData.propertyType = updates.propertyType;
  if (updates.amenities !== undefined) updateData.amenities = updates.amenities;

  return db
    .update(savedSearches)
    .set(updateData)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));
}

export async function deleteSavedSearch(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    testStore.savedSearches = testStore.savedSearches.filter(
      search => !(search.id === id && search.userId === userId)
    );
    return { success: true } as const;
  }

  return db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));
}

// Property Viewings Management

export async function createPropertyViewing(viewing: InsertPropertyViewing) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    const record = {
      id: nextTestId("propertyViewings"),
      createdAt: new Date(),
      updatedAt: new Date(),
      reminderSent: false,
      status: viewing.status ?? "scheduled",
      duration: viewing.duration ?? 30,
      ...viewing,
    };
    testStore.propertyViewings.push(record);
    return { insertId: record.id } as const;
  }

  const result = await db.insert(propertyViewings).values(viewing);
  return result;
}

export async function getPropertyViewings(propertyId: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    return testStore.propertyViewings.filter(
      viewing => viewing.propertyId === propertyId
    );
  }

  return db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.propertyId, propertyId));
}

export async function getUserViewings(userId: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    return testStore.propertyViewings.filter(
      viewing => viewing.userId === userId
    );
  }

  return db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.userId, userId));
}

export async function getViewingById(viewingId: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    return testStore.propertyViewings.find(viewing => viewing.id === viewingId);
  }

  const result = await db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.id, viewingId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateViewing(
  viewingId: number,
  updates: Partial<InsertPropertyViewing>
) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    const record = testStore.propertyViewings.find(
      viewing => viewing.id === viewingId
    );
    if (!record) return { success: false } as const;
    Object.assign(record, updates, { updatedAt: new Date() });
    return { success: true } as const;
  }

  return db
    .update(propertyViewings)
    .set(updates)
    .where(eq(propertyViewings.id, viewingId));
}

export async function deleteViewing(viewingId: number) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    testStore.propertyViewings = testStore.propertyViewings.filter(
      viewing => viewing.id !== viewingId
    );
    return { success: true } as const;
  }

  return db.delete(propertyViewings).where(eq(propertyViewings.id, viewingId));
}

export async function checkViewingConflict(
  propertyId: number,
  viewingDate: Date,
  viewingTime: string,
  duration: number = 30
) {
  const db = await getDb();
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    const viewings = testStore.propertyViewings.filter(
      viewing => viewing.propertyId === propertyId
    );
    const dateStr = viewingDate.toISOString().split("T")[0];

    for (const viewing of viewings) {
      const existingDateStr = new Date(viewing.viewingDate)
        .toISOString()
        .split("T")[0];

      if (existingDateStr === dateStr && viewing.status !== "cancelled") {
        const existingTime = viewing.viewingTime;
        if (existingTime === viewingTime) {
          return true;
        }
      }
    }

    return false;
  }

  // Get all viewings for this property on the same date
  const viewings = await db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.propertyId, propertyId));

  // Filter for same date and check for time conflicts
  const dateStr = viewingDate.toISOString().split("T")[0];

  for (const viewing of viewings) {
    const existingDateStr = new Date(viewing.viewingDate)
      .toISOString()
      .split("T")[0];

    if (existingDateStr === dateStr && viewing.status !== "cancelled") {
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
  if (!db) {
    if (!isTestEnv()) throw new Error("Database not available");
    let results = [...testStore.propertyViewings];

    if (filters?.status) {
      results = results.filter(viewing => viewing.status === filters.status);
    }

    if (filters?.propertyId) {
      results = results.filter(
        viewing => viewing.propertyId === filters.propertyId
      );
    }

    if (filters?.startDate) {
      results = results.filter(
        viewing => new Date(viewing.viewingDate) >= filters.startDate!
      );
    }

    if (filters?.endDate) {
      results = results.filter(
        viewing => new Date(viewing.viewingDate) <= filters.endDate!
      );
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      results = results.filter(viewing => {
        return (
          viewing.visitorName.toLowerCase().includes(query) ||
          viewing.visitorEmail.toLowerCase().includes(query) ||
          (viewing.visitorPhone
            ? viewing.visitorPhone.toLowerCase().includes(query)
            : false)
        );
      });
    }

    return results;
  }

  const {
    eq: eqOp,
    and: andOp,
    gte: gteOp,
    lte: lteOp,
    or: orOp,
    like: likeOp,
  } = await import("drizzle-orm");

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
