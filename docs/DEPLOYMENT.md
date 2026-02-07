# Deployment

## Prerequisites

- Node.js and pnpm installed.
- A MySQL-compatible database reachable by the app.

## Environment Variables

Set these in your hosting environment (examples only):

Server:

- DATABASE_URL=your-mysql-connection-string
- JWT_SECRET=your-cookie-secret
- OAUTH_SERVER_URL=https://your-oauth-server
- OWNER_OPEN_ID=your-admin-openid
- VITE_APP_ID=your-oauth-app-id
- BUILT_IN_FORGE_API_URL=https://forge.butterfly-effect.dev
- BUILT_IN_FORGE_API_KEY=your-forge-key

Client:

- VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev
- VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key

## Build

- Install dependencies: `pnpm install`
- Run migrations: `pnpm db:push`
- Build: `pnpm build`

## Run (Production)

- Start: `pnpm start`

## Notes

- The admin user is assigned by `OWNER_OPEN_ID`.
- Ensure the database is reachable before starting the server.
