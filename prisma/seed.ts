import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.favorite.deleteMany();
  await prisma.comparison.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.propertyViewing.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log("👤 Creating users...");
  const admin = await prisma.user.create({
    data: {
      openId: "seed-admin",
      name: "Admin User",
      email: "admin@example.com",
      loginMethod: "seed",
      role: "admin",
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      openId: "seed-user",
      name: "John Doe",
      email: "john@example.com",
      loginMethod: "seed",
      role: "user",
    },
  });

  // Create properties with images
  console.log("🏠 Creating properties...");

  const property1 = await prisma.property.create({
    data: {
      title: "Luxurious Beachfront Villa",
      description:
        "Stunning 4-bedroom beachfront villa with panoramic ocean views, infinity pool, and direct beach access. Perfect for families seeking coastal living.",
      price: new Prisma.Decimal("2500000.00"),
      propertyType: "house",
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 3200,
      address: "123 Ocean Drive",
      city: "Miami Beach",
      state: "FL",
      zipCode: "33139",
      latitude: 25.7907,
      longitude: -80.13,
      amenities: ["pool", "beach access", "garage", "ocean view", "smart home"],
      featured: true,
      status: "available",
      images: {
        create: [
          {
            imageUrl:
              "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
            caption: "Ocean view from living room",
            displayOrder: 1,
          },
          {
            imageUrl:
              "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
            caption: "Modern kitchen with island",
            displayOrder: 2,
          },
          {
            imageUrl:
              "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            caption: "Master bedroom suite",
            displayOrder: 3,
          },
        ],
      },
    },
  });

  const property2 = await prisma.property.create({
    data: {
      title: "Downtown Modern Apartment",
      description:
        "Sleek 2-bedroom apartment in the heart of downtown with stunning city views, modern finishes, and walkable to restaurants and entertainment.",
      price: new Prisma.Decimal("450000.00"),
      propertyType: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1100,
      address: "456 Main Street, Unit 805",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      latitude: 40.7484,
      longitude: -73.9857,
      amenities: ["gym", "doorman", "city view", "parking"],
      featured: true,
      status: "available",
      images: {
        create: [
          {
            imageUrl:
              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            caption: "City skyline view",
            displayOrder: 1,
          },
          {
            imageUrl:
              "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
            caption: "Modern living space",
            displayOrder: 2,
          },
        ],
      },
    },
  });

  const property3 = await prisma.property.create({
    data: {
      title: "Charming Suburban Family Home",
      description:
        "Beautiful 3-bedroom home in a quiet neighborhood with large backyard, updated kitchen, and excellent schools nearby. Perfect for growing families.",
      price: new Prisma.Decimal("385000.00"),
      propertyType: "house",
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      address: "789 Maple Avenue",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      latitude: 30.2672,
      longitude: -97.7431,
      amenities: ["backyard", "garage", "updated kitchen", "near schools"],
      featured: true,
      status: "available",
      images: {
        create: [
          {
            imageUrl:
              "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
            caption: "Front exterior",
            displayOrder: 1,
          },
          {
            imageUrl:
              "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
            caption: "Spacious backyard",
            displayOrder: 2,
          },
        ],
      },
    },
  });

  const property4 = await prisma.property.create({
    data: {
      title: "Mountain View Condo",
      description:
        "Cozy 1-bedroom condo with breathtaking mountain views. Ideal for outdoor enthusiasts with ski slopes and hiking trails minutes away.",
      price: new Prisma.Decimal("295000.00"),
      propertyType: "condo",
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 750,
      address: "321 Mountain Road, Unit 12",
      city: "Denver",
      state: "CO",
      zipCode: "80202",
      latitude: 39.7392,
      longitude: -104.9903,
      amenities: ["mountain view", "balcony", "fireplace"],
      featured: false,
      status: "available",
      images: {
        create: [
          {
            imageUrl:
              "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            caption: "Mountain view from balcony",
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const property5 = await prisma.property.create({
    data: {
      title: "Historic Townhouse",
      description:
        "Beautifully restored Victorian townhouse with original details, 3 floors of living space, and a private garden. A rare find!",
      price: new Prisma.Decimal("875000.00"),
      propertyType: "townhouse",
      bedrooms: 3,
      bathrooms: 3,
      squareFeet: 2400,
      address: "555 Heritage Lane",
      city: "Boston",
      state: "MA",
      zipCode: "02108",
      latitude: 42.3601,
      longitude: -71.0589,
      amenities: ["historic", "garden", "original details", "3 floors"],
      featured: false,
      status: "available",
      images: {
        create: [
          {
            imageUrl:
              "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800",
            caption: "Historic facade",
            displayOrder: 1,
          },
          {
            imageUrl:
              "https://images.unsplash.com/photo-1494526585095-c41746248156?w=800",
            caption: "Private garden",
            displayOrder: 2,
          },
        ],
      },
    },
  });

  const property6 = await prisma.property.create({
    data: {
      title: "Commercial Office Space",
      description:
        "Premium office space in a modern building with high-speed internet, meeting rooms, and ample parking. Perfect for startups and growing businesses.",
      price: new Prisma.Decimal("1200000.00"),
      propertyType: "commercial",
      bedrooms: 0,
      bathrooms: 2,
      squareFeet: 5000,
      address: "999 Business Boulevard",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      latitude: 37.7749,
      longitude: -122.4194,
      amenities: ["high-speed internet", "meeting rooms", "parking", "modern"],
      featured: false,
      status: "pending",
      images: {
        create: [
          {
            imageUrl:
              "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
            caption: "Open office layout",
            displayOrder: 1,
          },
        ],
      },
    },
  });

  // Create inquiries
  console.log("✉️  Creating inquiries...");
  await prisma.inquiry.create({
    data: {
      propertyId: property1.id,
      userId: regularUser.id,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1-555-0100",
      message: "I'm interested in scheduling a viewing this weekend.",
      status: "new",
    },
  });

  // Create viewings
  console.log("📅 Creating viewings...");
  await prisma.propertyViewing.create({
    data: {
      propertyId: property2.id,
      userId: regularUser.id,
      visitorName: "John Doe",
      visitorEmail: "john@example.com",
      visitorPhone: "+1-555-0200",
      viewingDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      viewingTime: "14:00",
      duration: 60,
      notes: "First-time buyer, bring floor plans",
      status: "scheduled",
      reminderSent: false,
    },
  });

  // Create favorites
  console.log("❤️  Creating favorites...");
  await prisma.favorite.createMany({
    data: [
      { userId: regularUser.id, propertyId: property1.id },
      { userId: regularUser.id, propertyId: property3.id },
      { userId: admin.id, propertyId: property2.id },
    ],
  });

  // Create comparisons
  console.log("⚖️  Creating comparisons...");
  await prisma.comparison.create({
    data: {
      userId: regularUser.id,
      propertyIds: [property1.id, property2.id, property3.id],
    },
  });

  // Create saved searches
  console.log("🔍 Creating saved searches...");
  await prisma.savedSearch.createMany({
    data: [
      {
        userId: regularUser.id,
        name: "Affordable Apartments",
        minPrice: new Prisma.Decimal("300000.00"),
        maxPrice: new Prisma.Decimal("500000.00"),
        bedrooms: 2,
        bathrooms: 1,
        propertyType: "apartment",
        amenities: ["parking"],
      },
      {
        userId: admin.id,
        name: "Luxury Homes",
        minPrice: new Prisma.Decimal("1000000.00"),
        maxPrice: new Prisma.Decimal("5000000.00"),
        bedrooms: 4,
        bathrooms: 3,
        propertyType: "house",
        amenities: ["pool", "ocean view"],
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log(`   - ${6} properties created`);
  console.log(`   - ${2} users created`);
  console.log(`   - ${1} inquiry created`);
  console.log(`   - ${1} viewing scheduled`);
  console.log(`   - ${3} favorites created`);
  console.log(`   - ${1} comparison created`);
  console.log(`   - ${2} saved searches created`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
