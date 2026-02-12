# Deployment

## Prerequisites

- Node.js and pnpm installed.
- A Postgres database (Neon recommended for production).

## Target Platform

- App hosting: Vercel
- Database: Neon Postgres

## Environment Variables

Set these in your hosting environment (examples only). Use Vercel project settings for production.

Server

- DATABASE_URL=your-postgres-connection-string
- JWT_SECRET=your-cookie-secret
- GOOGLE_CLIENT_ID=your-google-client-id
- GOOGLE_CLIENT_SECRET=your-google-client-secret
- NEXT_PUBLIC_APP_ID=your-oauth-app-id
- OWNER_OPEN_ID=your-admin-openid
- OAUTH_SERVER_URL=https://your-oauth-server (optional)
- NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token

Storage (choose one)

- Cloudinary: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER (optional)
- Storage proxy: BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY

## Neon Setup

1. Create a Neon Postgres project and database.
2. Copy the connection string into `DATABASE_URL` on Vercel.
3. Use the pooled connection string if available.

## Vercel Deployment

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Set all environment variables listed above.
4. Deploy.

If you need to run migrations and seed, use Vercel preview or a CI step (see below).

## Build

- Install dependencies: `pnpm install`
- Run migrations: `pnpm db:migrate`
- Optional seed: `pnpm db:seed`
- Build: `pnpm build`

## Run (Production)

- Start: `pnpm start`

## Notes

- The admin user is assigned by `OWNER_OPEN_ID`.
- Ensure the database is reachable before starting the server.
- For Vercel, prefer running migrations in CI or locally before deployment.
