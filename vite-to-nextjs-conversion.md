---

````markdown
---

````markdown
# Vite to Next.js Conversion Guide and Status

## Current Status (This Repo)

- Next.js app is at the repo root
- Prisma + Postgres schema is in prisma/schema.prisma
- Core pages and admin dashboards have been ported
- Admin auth guard uses admin_token cookie and ADMIN_ACCESS_TOKEN
- Cloudinary uploads and image reordering are wired

---

## 1. Project Setup

```bash
npx create-next-app@latest my-app
```
````

- Use **App Router** (Next.js 13+).
- Configure **TypeScript** if already used in Vite.

---

## 2. Project Structure

```
.
├── src/app/
│   ├── layout.tsx              # Global layout (header, footer, metadata)
│   ├── page.tsx                # Homepage (featured listings)
│   ├── properties/[id]/page.tsx# Dynamic property details
│   ├── about/page.tsx          # Static About page
│   ├── contact/page.tsx        # Static Contact page
│   ├── admin/*                 # Admin dashboards and CRUD
│   └── api/*                   # Route handlers
│
├── src/components/             # Reusable UI components
├── src/lib/                    # Prisma + helpers
├── prisma/                     # Prisma schema + seed
├── public/                     # Static assets
├── .env                        # Environment variables
├── package.json
└── tsconfig.json
```

---

## 3. Routing

- **React Router (Vite)** → replaced by **file-based routing (Next.js)**.
- Examples:
  - `/` → `app/page.tsx`
  - `/property/[id]` → `app/property/[id]/page.tsx`
  - `/about` → `app/about/page.tsx`

---

## 4. Data Fetching

Use **Server Components** or **Route Handlers** (`app/api/`).

Example API route:

```ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const properties = await prisma.property.findMany({
    include: { images: true, owner: true },
  });
  return NextResponse.json(properties);
}
```

---

## 5. Database Integration (Prisma + PostgreSQL)

`prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Property {
  id          Int       @id @default(autoincrement())
  title       String
  description String
  price       Int
  location    String
  bedrooms    Int
  bathrooms   Int
  sqft        Int
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  images      Image[]
  owner       User?     @relation(fields: [ownerId], references: [id])
  ownerId     Int?
}

model Image {
  id         Int      @id @default(autoincrement())
  url        String
  property   Property @relation(fields: [propertyId], references: [id])
  propertyId Int
}

model User {
  id        Int        @id @default(autoincrement())
  name      String
  email     String     @unique
  password  String
  createdAt DateTime   @default(now())

  properties Property[]
}
```

---

## 6. Deployment

- Deploy on **Vercel**:
  - Automatic builds & previews.
  - Edge caching for property pages.
  - Environment variable management.

---

## 7. Authentication (Optional)

- Use **NextAuth.js** or **Auth.js**.
- Supports JWT or session-based auth.

---

## 8. SEO & Performance

- Add metadata in `app/layout.tsx`:

```ts
export const metadata = {
  title: "Modern Real Estate App",
  description: "Browse and discover properties worldwide",
};
```

- Use `next/image` for optimized property photos.
- Generate sitemaps & structured data.

---

## Migration Checklist

- [x] Create Next.js project with App Router.
- [x] Move components into /components.
- [x] Implement file-based routing.
- [x] Set up Prisma + PostgreSQL.
- [x] Add API routes for property data.
- [ ] Configure deployment.
- [x] Add SEO metadata & image optimization.
- [x] Implement basic admin authentication.

---

## 🤖 Copilot Prompt Templates

Use these prompts in your editor to guide Copilot:

- **Routing Conversion**

  > "Convert my React Router routes into Next.js App Router pages."

- **Prisma Integration**

  > "Generate a Prisma query to fetch all properties with images and owners."

- **API Routes**

  > "Create a Next.js API route in `app/api/properties/route.ts` that returns property listings."

- **Dynamic Pages**

  > "Generate a Next.js dynamic route for `/property/[id]` that fetches property details from Prisma."

- **SEO Metadata**

  > "Add metadata to `app/layout.tsx` for SEO optimization."

- **Deployment**
  > "Prepare environment variables for Vercel deployment with PostgreSQL connection."

---

## 📚 References

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vercel Deployment](https://vercel.com/docs)

```

---

### 📥 How to Download
1. Copy the entire block above.
2. Open your editor (VS Code, etc.).
3. Create a new file named:
```

vite-to-nextjs-conversion.md

```
4. Paste the content.
5. Save it in your repo (e.g., `/docs/vite-to-nextjs-conversion.md`).
6. Commit & push to GitHub.

---

Now you have **one unified `.md` document** with everything included—no more separate files.

Would you like me to also compress this into a **one-page Quick Start Cheat Sheet** version so you can keep a lightweight reference alongside this full guide?
```
