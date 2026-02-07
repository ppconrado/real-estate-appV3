import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { and, eq, inArray, sql } from "drizzle-orm";
import mysql from "mysql2/promise";
import {
  comparisons,
  favorites,
  inquiries,
  properties,
  propertyImages,
  propertyViewings,
  savedSearches,
  users,
} from "../drizzle/schema";

const shouldForce = process.argv.includes("--force");

const sampleProperties = [
  {
    title: "Modern Loft in Downtown",
    description:
      "Sunlit loft with open plan living, exposed brick, and skyline views.",
    price: "425000.00",
    propertyType: "apartment" as const,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 820,
    address: "101 Market St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
    latitude: "37.78964000",
    longitude: "-122.39443000",
    amenities: ["gym", "rooftop", "concierge"],
    featured: true,
    status: "available" as const,
  },
  {
    title: "Family Home with Garden",
    description:
      "Quiet cul-de-sac, spacious backyard, and updated kitchen with island.",
    price: "895000.00",
    propertyType: "house" as const,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2650,
    address: "14 Oak Ridge Dr",
    city: "Austin",
    state: "TX",
    zipCode: "78748",
    latitude: "30.15614000",
    longitude: "-97.82111000",
    amenities: ["garage", "garden", "smart-home"],
    featured: true,
    status: "available" as const,
  },
  {
    title: "Luxury Condo with City Views",
    description:
      "High-rise condo with floor-to-ceiling windows and concierge service.",
    price: "1250000.00",
    propertyType: "condo" as const,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1450,
    address: "550 Pine Ave",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    latitude: "47.60855000",
    longitude: "-122.33771000",
    amenities: ["doorman", "gym", "pool"],
    featured: false,
    status: "available" as const,
  },
  {
    title: "Suburban Townhouse",
    description: "Three-story townhouse near parks, cafes, and public transit.",
    price: "575000.00",
    propertyType: "townhouse" as const,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1680,
    address: "230 Maple Ct",
    city: "Arlington",
    state: "VA",
    zipCode: "22204",
    latitude: "38.84622000",
    longitude: "-77.09873000",
    amenities: ["balcony", "garage", "laundry"],
    featured: false,
    status: "available" as const,
  },
  {
    title: "Countryside Ranch",
    description: "Single-level ranch on two acres with wraparound porch.",
    price: "650000.00",
    propertyType: "house" as const,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 2100,
    address: "88 Meadow Lane",
    city: "Nashville",
    state: "TN",
    zipCode: "37211",
    latitude: "36.06622000",
    longitude: "-86.71990000",
    amenities: ["fireplace", "garden", "deck"],
    featured: false,
    status: "pending" as const,
  },
  {
    title: "Downtown Studio",
    description:
      "Compact studio near transit with in-unit laundry and bike storage.",
    price: "310000.00",
    propertyType: "apartment" as const,
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 540,
    address: "77 King St",
    city: "Portland",
    state: "OR",
    zipCode: "97204",
    latitude: "45.51688000",
    longitude: "-122.67526000",
    amenities: ["laundry", "bike-room"],
    featured: false,
    status: "available" as const,
  },
  {
    title: "Lakefront Cabin",
    description: "Cozy cabin with private dock, loft bedroom, and fire pit.",
    price: "540000.00",
    propertyType: "house" as const,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 980,
    address: "9 Cedar Shore",
    city: "Minneapolis",
    state: "MN",
    zipCode: "55406",
    latitude: "44.95543000",
    longitude: "-93.24133000",
    amenities: ["waterfront", "deck", "fireplace"],
    featured: true,
    status: "available" as const,
  },
  {
    title: "Retail Space on Main",
    description: "Street-level retail with storage and high foot traffic.",
    price: "2300000.00",
    propertyType: "commercial" as const,
    bedrooms: 0,
    bathrooms: 2,
    squareFeet: 4200,
    address: "420 Main St",
    city: "Chicago",
    state: "IL",
    zipCode: "60611",
    latitude: "41.89258000",
    longitude: "-87.62586000",
    amenities: ["storage", "corner-lot"],
    featured: false,
    status: "available" as const,
  },
];

const sampleImages = [
  "https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=1200&q=80",
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(properties);

    if (count > 0 && !shouldForce) {
      console.log(
        "Seed skipped: properties already exist. Use --force to seed anyway."
      );
      return;
    }

    if (shouldForce) {
      await db.delete(propertyImages);
      await db.delete(propertyViewings);
      await db.delete(inquiries);
      await db.delete(favorites);
      await db.delete(comparisons);
      await db.delete(savedSearches);
      await db.delete(properties);
      await db.delete(users);
    }

    const userRows = await db.insert(users).values([
      {
        openId: "seed-admin",
        name: "Alex Morgan",
        email: "alex.morgan@example.com",
        loginMethod: "seed",
        role: "admin",
      },
      {
        openId: "seed-agent",
        name: "Riley Chen",
        email: "riley.chen@example.com",
        loginMethod: "seed",
        role: "user",
      },
      {
        openId: "seed-buyer",
        name: "Jordan Lee",
        email: "jordan.lee@example.com",
        loginMethod: "seed",
        role: "user",
      },
    ]);

    const userList = await db
      .select()
      .from(users)
      .where(inArray(users.openId, ["seed-admin", "seed-agent", "seed-buyer"]));

    const adminUser = userList.find(user => user.openId === "seed-admin");
    const buyerUser = userList.find(user => user.openId === "seed-buyer");

    await db.insert(properties).values(sampleProperties);

    const propertyList = await db
      .select()
      .from(properties)
      .where(
        inArray(
          properties.title,
          sampleProperties.map(property => property.title)
        )
      );

    const propertyIdByTitle = new Map(
      propertyList.map(property => [property.title, property.id])
    );

    const imageRows = sampleProperties.flatMap((property, index) => {
      const propertyId = propertyIdByTitle.get(property.title);
      if (!propertyId) return [];
      const primary = sampleImages[index % sampleImages.length];
      const secondary = sampleImages[(index + 2) % sampleImages.length];
      return [
        {
          propertyId,
          imageUrl: primary,
          caption: "Exterior view",
          displayOrder: 0,
        },
        {
          propertyId,
          imageUrl: secondary,
          caption: "Interior highlight",
          displayOrder: 1,
        },
      ];
    });

    if (imageRows.length > 0) {
      await db.insert(propertyImages).values(imageRows);
    }

    if (buyerUser) {
      const favoritePropertyId = propertyIdByTitle.get(
        sampleProperties[1].title
      );
      if (favoritePropertyId) {
        await db.insert(favorites).values({
          userId: buyerUser.id,
          propertyId: favoritePropertyId,
        });
      }

      const comparisonIds = sampleProperties
        .slice(0, 3)
        .map(property => propertyIdByTitle.get(property.title))
        .filter((id): id is number => typeof id === "number");

      if (comparisonIds.length > 0) {
        await db.insert(comparisons).values({
          userId: buyerUser.id,
          propertyIds: comparisonIds,
        });
      }

      await db.insert(savedSearches).values({
        userId: buyerUser.id,
        name: "Starter homes under $600k",
        minPrice: "250000.00",
        maxPrice: "600000.00",
        bedrooms: 2,
        bathrooms: 1,
        propertyType: "house",
        amenities: ["garage", "garden"],
      });

      const viewingPropertyId = propertyIdByTitle.get(
        sampleProperties[0].title
      );
      if (viewingPropertyId) {
        await db.insert(propertyViewings).values({
          propertyId: viewingPropertyId,
          userId: buyerUser.id,
          visitorName: buyerUser.name ?? "Jordan Lee",
          visitorEmail: buyerUser.email ?? "jordan.lee@example.com",
          visitorPhone: "555-0199",
          viewingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
          viewingTime: "10:30",
          duration: 45,
          notes: "Interested in neighborhood walkability.",
          status: "scheduled",
        });
      }
    }

    const inquiryPropertyId = propertyIdByTitle.get(sampleProperties[2].title);
    if (inquiryPropertyId) {
      await db.insert(inquiries).values({
        propertyId: inquiryPropertyId,
        userId: buyerUser?.id ?? null,
        name: buyerUser?.name ?? "Guest Buyer",
        email: buyerUser?.email ?? "guest@example.com",
        phone: "555-0188",
        message: "Can you share the HOA details and recent renovations?",
        status: "new",
      });
    }

    console.log("Seed complete.");
  } finally {
    await connection.end();
  }
}

seed().catch(error => {
  console.error("Seed failed:", error);
  process.exit(1);
});
