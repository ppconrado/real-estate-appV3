# Real Estate App (v3)

---

## Project Snapshot: February 2026

This section provides a technical snapshot of the project at the start of migration to a modern-e-commerce-inspired architecture. Use this as a reference for understanding the current structure, stack, and key features before beginning the conversion.

### Overview

- **Project Name:** Real Estate App V3
- **Purpose:** Real estate listing and management platform
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, PostCSS
- **ORM:** Prisma
- **Database:** (Configured via Prisma, details in .env)
- **Authentication:** Custom (with Google OAuth), NextAuth planned
- **State Management:** React Context, some custom hooks
- **Deployment:** Vercel (with .env and dashboard variables)

### Directory Structure (Key Folders & Files)

```
components.json
middleware.ts
next.config.ts
package.json
prisma/
	schema.prisma
	seed.ts
public/
src/
	_core/
		hooks/
	app/
		globals.css
		layout.tsx
		not-found.tsx
		page.tsx
		providers.tsx
		[[...slug]]/
		about/
		admin/
		api/
		comparison/
		components/
		contact/
		favorites/
		logout/
		profile/
		properties/
		property/
	components/
		(UI and admin components)
	contexts/
	hooks/
	lib/
		cloudinary.ts
		format.ts
		prisma.ts
		trpc.ts
		utils.ts
	screens/
		(Page-level components)
	server/
		(Email, env, storage, etc.)
	shared/
		amenities.ts
		const.ts
	types/
		global.d.ts
```

### Key Features (Current State)

- Property listing, detail, and comparison pages
- Admin dashboard (basic CRUD, import, viewings, contacts)
- Google OAuth login (working locally and on Vercel)
- Prisma ORM for DB access
- Some server-side logic in API routes
- Custom hooks and context for state management
- No advanced caching or Suspense/streaming SSR yet
- No TanStack Query or in-memory/Redis cache

### Known Issues / Migration Motivations

- Pages with DB content load slower than desired
- No unified caching strategy
- Client-heavy data fetching in some areas
- Lacks React Suspense and streaming SSR
- Code structure differs from modern-e-commerce best practices

### Migration Goals

- Adopt Next.js Server Components for DB-backed pages
- Implement in-memory/Redis caching for expensive queries
- Use TanStack Query for client-side data fetching/caching
- Enable React Suspense and streaming SSR
- Refactor code structure to match modern-e-commerce patterns

---

## Overview

Real Estate App is a Next.js + TypeScript application for browsing property listings and managing them through an admin dashboard. It includes public pages, authenticated admin tooling, a Postgres database via Prisma, and image storage integration.

## Documentation

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment notes
- [docs/CHECKPOINT.md](docs/CHECKPOINT.md) - Project checkpoint notes
- [vite-to-nextjs-conversion.md](vite-to-nextjs-conversion.md) - Migration notes

## Environments

Development (Local)

- Frontend: http://localhost:3000
- Database: Postgres (set via `DATABASE_URL`)
- Storage: Cloudinary or storage proxy

Production (Vercel)

- Frontend: your Vercel domain
- Database: managed Postgres (Neon or equivalent)
- Storage: Cloudinary or storage proxy

## Features

Public features

- Public property browsing, search, favorites, comparison, and contact forms.
- Property detail pages with image galleries.
- Saved searches and inquiry submission.

Admin features

- Admin dashboard for property CRUD, image management, and bulk import.
- Inquiries, contacts, and viewing scheduling workflows.

Infrastructure features

- Viewing scheduling and inquiry management backed by Postgres.
- Map rendering for property locations via Mapbox.
- tRPC API with React Query for typed data access.

## Tech Stack

- Framework: Next.js (App Router) + React 19
- Language: TypeScript
- Styling: Tailwind CSS 4, Radix UI, class-variance-authority
- Data: tRPC + React Query
- Database: Postgres
- ORM: Prisma (with `@prisma/adapter-pg`)
- Auth: Google OAuth + JWT session cookie
- Maps: Mapbox GL
- Package manager: pnpm

## Architecture

UI Layer

- `src/app/` - Next.js routes and layouts
- `src/screens/` - Feature screens (Home, Properties, AdminDashboard)
- `src/components/` - Reusable UI components

Data Layer

- `src/server/` - tRPC routers, server helpers, and storage
- `src/lib/` - Prisma client and shared utilities
- `src/app/api/` - API routes (`/api/trpc`, `/api/properties`, OAuth callback)

Styling

- Global styles in `src/app/globals.css`
- Component styling via Tailwind classes

## Key Routes

- `/` - Home
- `/properties` and `/properties/[id]` - Property list and detail
- `/comparison`, `/favorites`, `/contact`, `/profile`, `/about`
- `/admin/*` - Admin dashboard sections (properties, inquiries, contacts, viewings, import)

## API Endpoints

- `/api/trpc` - tRPC endpoint
- `/api/properties` - Public properties list (REST)
- `/api/oauth/callback` - OAuth callback
- `/api/auth/debug` - Session debug info (dev only)

## Environment Variables

Create a `.env` file in the project root.

Core

- `DATABASE_URL` - Postgres connection string
- `JWT_SECRET` - Session signing secret
- `GOOGLE_CLIENT_ID` - OAuth client id
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `NEXT_PUBLIC_APP_ID` - Public app id used in OAuth flows
- `OWNER_OPEN_ID` - Grants admin role to a specific OpenID

Maps

- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Mapbox token for maps

Storage (choose one)

- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` (optional)
- Storage proxy: `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`

Optional

- `OAUTH_SERVER_URL` - OAuth base URL (default not required)

## Getting Started

Prerequisites

- Node.js (LTS)
- pnpm
- Postgres database

1. Install dependencies

```bash
pnpm install
```

2. Configure environment variables

Create a `.env` file in the project root and set the values listed below.

3. Prepare the database

```bash
pnpm db:push
pnpm db:migrate
pnpm db:seed
```

4. Run the app

```bash
pnpm dev
```

## Database

Prisma uses a Postgres database. Make sure `DATABASE_URL` is set before running migrations.

```bash
pnpm db:push
pnpm db:migrate
pnpm db:seed
```

## Scripts

- `pnpm dev` - Start Next.js dev server
- `pnpm build` - Production build
- `pnpm start` - Run production server
- `pnpm lint` - Lint
- `pnpm db:push` - Sync schema to database
- `pnpm db:migrate` - Create and apply migrations
- `pnpm db:seed` - Seed the database

## Admin Access

Admin access is assigned by matching the OAuth user `openId` to `OWNER_OPEN_ID`. Use `/api/auth/debug` to confirm the current session and resolved role after logging in.

## Project Structure

```
src/
	app/            # Next.js routes, layouts, API routes
	components/     # Shared UI components
	screens/        # Feature screens (Admin, Properties, etc.)
	server/         # tRPC routers, auth, storage, notifications
	lib/            # Prisma client and shared utilities
	shared/         # Shared constants and types
prisma/
	schema.prisma   # Database schema
	seed.ts         # Seed script
```
