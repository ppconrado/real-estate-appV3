# Real Estate App (v3)

## Overview

Real Estate App is a Next.js + TypeScript application for browsing property listings and managing them through an admin dashboard. It includes public pages, authenticated admin tooling, a Postgres database via Prisma, and image storage integration.

## Features

- Public property browsing, search, favorites, comparison, and contact forms.
- Admin dashboard for property CRUD, image management, and bulk import.
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

Install dependencies

```bash
pnpm install
```

Run the app

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
