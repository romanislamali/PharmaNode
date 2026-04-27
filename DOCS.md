# PharmaNode SaaS Auth Module Documentation

## Architecture
This module follows a **Clean Architecture** within a **Modular Monolith** structure.

### Layers:
1. **Controller**: Handles HTTP requests, calls services, and returns responses.
2. **Service**: Contains business logic (Password hashing, JWT generation).
3. **Repository**: Directly interacts with the database (Prisma).
4. **Middleware**: Handles authentication, authorization, and validation.
5. **Schema**: Zod schemas for request validation.

## Database Schema (Prisma)
- **TenantTable**: Stores tenant information (Pharmacy names, slugs).
- **UserTable**: Stores user details. Email is unique **per tenant** (`@@unique([email, tenantId])`).
- **RefreshTokenTable**: Stores refresh tokens linked to users and tenants for secure session management.

## Multi-Tenancy
Every database operation is scoped by `tenant_id`. In `AuthRepository`, users are always queried with `email` and `tenantId`.

## Authentication Flow
1. **Register**: Creates a new `Tenant` and an `OWNER` user in a single transaction.
2. **Login**: 
   - Finds tenant by slug.
   - Finds user by email + tenantId.
   - Verifies password.
   - Generates Access Token (15m) and Refresh Token (7d).
   - Stores Refresh Token in the database.
3. **Refresh**: Validates the refresh token and issues a new access token.
4. **Logout**: Deletes the refresh token from the database.

## Environment Variables
Ensure you set the following in `.env`:
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_ACCESS_SECRET`: Secret key for access tokens.
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens.

## How to Run

### Option 1: Local Development with Docker Database
1.  **Start Database**: `docker-compose up -d`
2.  **Install dependencies**: `npm install`
3.  **Run migrations**: `npx prisma migrate dev`
4.  **Generate client**: `npx prisma generate`
5.  **Start dev server**: `npm run dev`

### Option 2: Full Dockerization (Future)
- A commented-out `app` service is provided in `docker-compose.yml`. 
- To use it, you'll need to create a `Dockerfile`.
