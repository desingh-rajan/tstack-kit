# TonyStack Starter - Your Project Name

> Replace "Your Project Name" with your actual project name (e.g., "Blog API", "E-commerce API")

A lightweight, modular REST API starter built with Deno + Hono + Drizzle, featuring built-in authentication, role-based access control, and a dynamic site settings system.

## 1. Overview

This is a lightweight REST API built on Deno + Hono + Drizzle (PostgreSQL) with:

- Modular, entity‑centric folder structure (`src/entities/<feature>`)
- Built‑in authentication (JWT, user roles)
- Seed scripts for users and site settings
- Typed database access via Drizzle ORM
- Clear environment & migration workflow
- Comprehensive test tasks (setup, migrate, seed, run, coverage)

## 2. Stack

- Runtime: Deno
- Web: Hono
- ORM: Drizzle + PostgreSQL
- Validation: Zod
- Auth: JWT (HS256) + role checks (user, superadmin)

## 3. Requirements

- Deno (latest 2.x)
- PostgreSQL 14+
- Bash / Docker (optional for local DB)

## 4. Environment Variables

Create one of: `.env.development.local` (preferred) or `.env`.

| Variable          | Required  | Default                   | Notes                                         |
| ----------------- | --------- | ------------------------- | --------------------------------------------- |
| `DATABASE_URL`    | ✅        | —                         | Postgres connection string (must exist)       |
| `PORT`            | ❌        | 8000                      | HTTP port                                     |
| `ENVIRONMENT`     | ❌        | development               | Allowed values: development, test, production |
| `ALLOWED_ORIGINS` | ❌        | <http://localhost:3000>   | Comma separated list                          |
| `JWT_SECRET`      | ✅ (prod) | `change-me-in-production` | Replace in production                         |
| `JWT_ISSUER`      | ❌        | tonystack                 | Token issuer name                             |
| `JWT_EXPIRY`      | ❌        | 1h                        | e.g. `1h`, `30m`, `7d`                        |

Load order (highest priority first): system env → `.env.<env>.local` → `.env`.

## 5. Project Structure

```text
src/
  main.ts                # App bootstrap (mount routes, middleware)
  config/                # env + database setup
  auth/                  # auth routes, services, models
  entities/              # feature domains (add your own here)
    articles/            # example content entity
    site_settings/       # dynamic configuration system
  shared/                # errors, jwt, validation, middleware helpers
migrations/              # Drizzle migration files (generated)
scripts/                 # Migration, seed, utility scripts
tests/                   # (If present) higher‑level or docs for tests
deno.json                # Tasks & dependency mapping
```

## 6. Core Tasks (deno.json)

| Task                           | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `deno task dev`                | Run with watch & all permissions         |
| `deno task start`              | Run once (no watch)                      |
| `deno task env:validate`       | Check required env vars                  |
| `deno task migrate:generate`   | Create migration from current schema     |
| `deno task migrate:run`        | Apply pending migrations                 |
| `deno task db:studio`          | Open Drizzle Studio (schema browser)     |
| `deno task db:seed`            | Seed all default data (users + settings) |
| `deno task db:seed:superadmin` | Seed only superadmin user                |
| `deno task db:seed:alpha`      | Seed demo regular user                   |
| `deno task db:seed:user`       | Seed generic regular user                |
| `deno task db:seed:site`       | Seed system site settings                |
| `deno task setup`              | Validate env → migrate → seed            |
| `deno task test:full`          | Full test DB setup then run tests        |
| `deno task test`               | Run tests + cleanup test DB              |
| `deno task test:setup`         | Create test DB + apply migrations        |
| `deno task test:migrate`       | Migrate test DB only                     |
| `deno task test:seed`          | Seed test data                           |
| `deno task test:reset`         | Recreate + migrate + seed test DB        |
| `deno task test:watch`         | Watch mode tests                         |
| `deno task test:coverage`      | Coverage report to `coverage/`           |
| `deno task test:check`         | Health check (DB + basic readiness)      |
| `deno task cleanup:test-db`    | Remove test database artifacts           |
| `deno task fmt`                | Format source                            |
| `deno task lint`               | Lint source                              |

## 7. First Run

```bash
# 1. Create environment file from example
cp .env.example .env.development.local
# Edit .env.development.local with your settings (DATABASE_URL, JWT_SECRET, etc.)

# 2. Start PostgreSQL (using Docker Compose)
docker compose up -d postgres

# 3. Validate environment configuration
deno task env:validate

# 4. Run migrations (pre-existing migrations included)
# Note: Only generate new migrations if you've modified entity models
deno task migrate:run

# 5. Seed core data (creates superadmin user & default site settings)
deno task db:seed

# 6. Start development server
deno task dev
```

Visit: `http://localhost:8000`

**Default Credentials (after seeding):**
- Superadmin: `superadmin@tstack.in` / `password123`
- Alpha User: `alpha@tstack.in` / `password123`

## 8. Entities & Conventions

Each entity in the project follows a modular, consistent structure. Understanding this pattern will help you maintain and extend your API effectively.

### Standard Entity Files

```
src/entities/
  <entity-plural>/              # e.g., articles, products, categories
    <entity>.model.ts          # Drizzle table definition (plural table name)
    <entity>.dto.ts            # Zod schemas (validation for create/update/query)
    <entity>.service.ts        # Business logic and data access layer
    <entity>.controller.ts     # HTTP handlers (thin layer)
    <entity>.route.ts          # Public API routes (e.g., /articles)
    <entity>.test.ts           # Tests for public routes
```

### Admin Panel Files (Optional)

For entities requiring admin-only operations:

```
    <entity>.admin.route.ts    # Admin routes (e.g., /ts-admin/articles)
    <entity>.admin.test.ts     # Tests for admin routes
```

### File Organization Example

```text
src/entities/
  articles/
    article.model.ts          # Database schema: articles table
    article.dto.ts            # Zod: CreateArticleDTO, UpdateArticleDTO
    article.service.ts        # Business logic: CRUD + authorization
    article.controller.ts     # HTTP handlers: createArticle, getArticles, etc.
    article.route.ts          # Public routes: GET /articles, POST /articles
    article.admin.route.ts    # Admin routes: GET /ts-admin/articles (with filters)
    article.test.ts           # Tests: Public API endpoints
    article.admin.test.ts     # Tests: Admin operations
    article.interface.ts      # Optional: TypeScript interfaces/types
```

### Naming Conventions

- **Directory**: Plural (e.g., `articles/`, `products/`)
- **Table**: Plural (e.g., `articles`, `products`)
- **Files**: Singular entity name (e.g., `article.model.ts`, `product.dto.ts`)
- **Routes**: 
  - Public: `/articles`, `/products`
  - Admin: `/ts-admin/articles`, `/ts-admin/products`

### Adding New Entities

When creating a new entity, follow this workflow:

1. **Scaffold** (if using tstack-kit CLI): `tstack scaffold products`
2. **Customize model**: Edit `product.model.ts` to add fields
3. **Update DTOs**: Modify `product.dto.ts` for validation
4. **Implement service logic**: Add business rules in `product.service.ts`
5. **Register routes**: Import and mount in `src/main.ts`
6. **Generate migration**: `deno task migrate:generate`
7. **Apply migration**: `deno task migrate:run`

**Best Practice**: Add all fields to your model BEFORE generating the first migration to keep migration history clean.

## 9. Database & Migrations

- Edit models in `src/entities/**/<name>.model.ts`.
- Generate migration AFTER changes: `deno task migrate:generate`.
- Apply: `deno task migrate:run`.
- Inspect: `deno task db:studio`.

Never hand‑edit generated SQL unless absolutely necessary; prefer evolving the
model then regenerating a new migration.

## 10. Seeding

Full seed (users + settings): `deno task db:seed`.

Users created:

- Superadmin: `superadmin@tstack.in` (full privileges)
- Alpha user: `alpha@tstack.in` (regular)
- Regular user (script) for additional testing.

System site settings auto‑seed & self‑heal on access (see settings section).

## 11. Authentication

### Overview

The starter includes JWT-based authentication with role-based access control (RBAC).

- **Login/Register**: Available under `auth/` routes
- **Token Format**: `Authorization: Bearer <token>`
- **JWT Payload**: Includes `userId`, `email`, and `role`
- **Supported Roles**: `user`, `superadmin`

### Authentication Examples

#### Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@tstack.in",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "superadmin@tstack.in",
    "role": "superadmin"
  }
}
```

#### Register New User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "email": "newuser@example.com",
    "role": "user"
  }
}
```

#### Using Token in Requests

Once you have a token, include it in the `Authorization` header:

```bash
# Example: Create a new article (requires authentication)
curl -X POST http://localhost:8000/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "My First Article",
    "content": "This is the article content",
    "published": true
  }'
```

### JWT Configuration

Configure JWT behavior via environment variables:

- `JWT_SECRET`: Secret key for signing tokens (⚠️ **MUST** change in production)
- `JWT_ISSUER`: Token issuer identifier (default: `tonystack`)
- `JWT_EXPIRY`: Token lifetime (default: `1h`, examples: `30m`, `7d`)

### Token Security

- **Development**: Uses default secret for convenience
- **Production**: Set a strong `JWT_SECRET` (32+ characters, random)
- **Rotation**: Update `JWT_SECRET` and force re-login (clear `auth_tokens` table)

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| `superadmin` | Full access to all resources; Admin panel access (`/ts-admin/*`); Can create, read, update, delete any content; Manage site settings |
| `user` | Create own articles; Read public content; Update/delete only own articles; No admin panel access |
| (unauthenticated) | Read-only access to public content; Access public site settings; No write operations |

## 12. Site Settings System

The site settings system provides dynamic, validated configuration storage with automatic seeding and type safety.

### Key Features

- **Auto-seed on first read**: Settings are created automatically when accessed
- **Zod validation**: All settings are validated against their schemas
- **Public/Private separation**: Control what settings are exposed to frontend
- **Reset endpoints**: Built-in endpoints to reset individual or all settings
- **Type-safe**: Full TypeScript support with schema definitions

### Fetching Settings

#### Get All Public Settings

```bash
curl http://localhost:8000/site-settings
```

**Response:**
```json
{
  "site_info": {
    "siteName": "TonyStack Starter",
    "tagline": "Built with Deno, Hono, and Drizzle",
    "logo": "/assets/logo.png"
  },
  "theme_config": {
    "primaryColor": "#3b82f6",
    "secondaryColor": "#8b5cf6",
    "fontFamily": "Inter"
  },
  "feature_flags": {
    "enableComments": true,
    "enableNewsletter": false,
    "maintenanceMode": false
  },
  "contact_info": {
    "email": "contact@example.com",
    "phone": "+1-234-567-8900",
    "address": "123 Main St, City, Country"
  }
}
```

#### Get Specific Setting

```bash
# By key
curl http://localhost:8000/site-settings/theme_config

# By ID
curl http://localhost:8000/site-settings/2
```

### Adding New System Settings

To add a new system setting (e.g., payment configuration):

**Step 1**: Create schema file in `src/entities/site_settings/schemas/`

```typescript
// src/entities/site_settings/schemas/payment.schemas.ts
import { z } from "zod";

export const paymentConfigSchema = z.object({
  stripePublicKey: z.string().min(1, "Stripe public key required"),
  stripeSecretKey: z.string().optional(),
  enablePayments: z.boolean().default(true),
  currency: z.string().default("USD"),
});

export const defaultPaymentConfig = {
  stripePublicKey: "pk_test_...",
  stripeSecretKey: "",
  enablePayments: false,
  currency: "USD",
};
```

**Step 2**: Register in `src/entities/site_settings/schemas/index.ts`

```typescript
import { 
  paymentConfigSchema, 
  defaultPaymentConfig 
} from "./payment.schemas.ts";

export const systemSettings = {
  // ... existing settings ...
  payment_config: {
    schema: paymentConfigSchema,
    defaultValue: defaultPaymentConfig,
    isPublic: false, // Private - not exposed to frontend
  },
};
```

**Step 3**: Restart server - setting will auto-seed on first access

The new setting will be automatically created when first accessed. No manual database operations needed!

### Public vs Private Settings

Control setting visibility via the `isPublic` flag:

```typescript
// Public - Frontend can access
site_info: { isPublic: true, ... }

// Private - Backend only
email_settings: { isPublic: false, ... }
```

**Default Settings Included:**

| Setting | Public | Use Case |
|---------|--------|----------|
| `site_info` | ✅ | Site name, tagline, logo - display in UI |
| `contact_info` | ✅ | Email, phone, social links - contact page |
| `theme_config` | ✅ | Colors, fonts - apply to frontend theme |
| `feature_flags` | ✅ | Toggle features - enable/disable features |
| `email_settings` | ❌ | SMTP config - backend email sending |
| `api_config` | ❌ | Rate limits, CORS - API configuration |

### Updating Settings

Settings can be updated via API (requires superadmin authentication):

```bash
curl -X PUT http://localhost:8000/site-settings/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "siteName": "My Awesome Site",
      "tagline": "Building the future"
    }
  }'
```

### Reset Settings

```bash
# Reset individual setting to default
curl -X POST http://localhost:8000/site-settings/theme_config/reset \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Reset all settings to defaults
curl -X POST http://localhost:8000/site-settings/reset-all \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```


## 13. Articles Example Entity

The Articles entity demonstrates key patterns including:
- Protected write operations (authentication required)
- Public read access (no authentication needed)
- Ownership checks (users can only modify their own articles)
- Role-based access (superadmins can manage all articles)
- Admin panel integration with advanced filtering

### Public Operations (No Authentication)

#### List All Articles

```bash
curl http://localhost:8000/articles
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Getting Started with TonyStack",
      "content": "This is a comprehensive guide...",
      "published": true,
      "authorId": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1
  }
}
```

#### Get Single Article

```bash
curl http://localhost:8000/articles/1
```

### Authenticated Operations (User Role)

First, login to get a token:

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alpha@tstack.in", "password": "password123"}' \
  | jq -r '.token')
```

#### Create Article

```bash
curl -X POST http://localhost:8000/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My New Article",
    "content": "This is the article content...",
    "published": true
  }'
```

#### Update Own Article

```bash
curl -X PUT http://localhost:8000/articles/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Updated Article Title",
    "content": "Updated content...",
    "published": true
  }'
```

**Note**: Users can only update articles they created. Attempting to update another user's article will return a `403 Forbidden` error.

#### Delete Own Article

```bash
curl -X DELETE http://localhost:8000/articles/2 \
  -H "Authorization: Bearer $TOKEN"
```

### Admin Operations (Superadmin Role)

Admin operations are available at `/ts-admin/articles` and provide additional capabilities:

```bash
# Login as superadmin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@tstack.in", "password": "password123"}' \
  | jq -r '.token')
```

#### List All Articles with Filters

```bash
# Get all articles (including unpublished)
curl "http://localhost:8000/ts-admin/articles" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by author
curl "http://localhost:8000/ts-admin/articles?authorId=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by published status
curl "http://localhost:8000/ts-admin/articles?published=false" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Bulk Delete Articles

```bash
curl -X POST http://localhost:8000/ts-admin/articles/bulk-delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "ids": [1, 2, 3]
  }'
```

#### Admin Can Update Any Article

```bash
curl -X PUT http://localhost:8000/ts-admin/articles/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Admin Updated Title",
    "published": false
  }'
```

### Use as Pattern

The Articles entity serves as a reference implementation for:

1. **Public vs Protected Routes**: Public reads, authenticated writes
2. **Ownership Validation**: Users can only modify their own resources
3. **Role Escalation**: Superadmins bypass ownership checks
4. **Admin Panel Integration**: Separate admin routes with enhanced capabilities
5. **Request Validation**: DTOs enforce data structure and types

Apply these patterns to your own entities for consistent authorization behavior.


## 14. API Quick Reference

A comprehensive list of all available endpoints in the starter project. Use this as a quick reference when building your frontend or testing the API.

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | ❌ | Register new user account |
| POST | `/auth/login` | ❌ | Login with email/password, receive JWT token |
| POST | `/auth/logout` | ✅ | Logout (invalidate token) |
| GET | `/auth/me` | ✅ | Get current user profile |

### Article Endpoints (Public API)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/articles` | ❌ | List all published articles (paginated) |
| GET | `/articles/:id` | ❌ | Get single article by ID |
| POST | `/articles` | ✅ user | Create new article (requires authentication) |
| PUT | `/articles/:id` | ✅ user | Update own article |
| DELETE | `/articles/:id` | ✅ user | Delete own article |

**Notes:**
- Public endpoints (GET) are accessible without authentication
- Write operations (POST, PUT, DELETE) require user role
- Users can only modify articles they created (ownership check)

### Article Endpoints (Admin API)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/ts-admin/articles` | ✅ superadmin | List all articles with filters (published, unpublished) |
| GET | `/ts-admin/articles/:id` | ✅ superadmin | Get any article by ID |
| PUT | `/ts-admin/articles/:id` | ✅ superadmin | Update any article (bypass ownership) |
| DELETE | `/ts-admin/articles/:id` | ✅ superadmin | Delete any article |
| POST | `/ts-admin/articles/bulk-delete` | ✅ superadmin | Delete multiple articles by IDs |

**Notes:**
- All admin endpoints require superadmin role
- Admin routes bypass ownership checks
- Access filters and operations unavailable in public API

### Site Settings Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/site-settings` | ❌ | Get all public settings (theme, features, site info) |
| GET | `/site-settings/:idOrKey` | ❌ | Get specific setting by ID or key |
| POST | `/site-settings` | ✅ superadmin | Create new setting |
| PUT | `/site-settings/:id` | ✅ superadmin | Update existing setting |
| DELETE | `/site-settings/:id` | ✅ superadmin | Delete setting |
| POST | `/site-settings/:key/reset` | ✅ superadmin | Reset specific setting to default value |
| POST | `/site-settings/reset-all` | ✅ superadmin | Reset all settings to default values |

**Notes:**
- Public GET endpoints only return settings marked as `isPublic: true`
- Private settings (email config, API keys) are hidden from public access
- Settings auto-seed on first access if not present

### Core Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | ❌ | API information and health status |
| GET | `/health` | ❌ | Health check endpoint |

### Response Format

All API responses follow a consistent structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### Common HTTP Status Codes

- **200 OK**: Successful GET, PUT request
- **201 Created**: Successful POST (resource created)
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid input data, validation error
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for operation
- **404 Not Found**: Resource does not exist
- **500 Internal Server Error**: Server-side error

### Authentication Header Format

For protected endpoints, include the JWT token:

```
Authorization: Bearer <your-jwt-token>
```

Example:
```bash
curl -H "Authorization: Bearer eyJhbGc..." http://localhost:8000/articles
```


## 15. Testing Workflow

The project includes comprehensive testing infrastructure with a dedicated test database to ensure isolation from development data.

### What Gets Tested

- **Authentication**: Login, registration, token validation
- **CRUD Operations**: Create, read, update, delete for all entities
- **Authorization**: Role-based access control, ownership checks
- **Validation**: Request validation, error handling
- **Edge Cases**: Invalid inputs, unauthorized access, missing resources

### Testing Conventions

#### File Structure
Tests are colocated with the code they test:

```text
src/entities/articles/
  article.model.ts
  article.service.ts
  article.controller.ts
  article.route.ts
  article.test.ts           # Tests for public routes
  article.admin.route.ts
  article.admin.test.ts     # Tests for admin routes
```

#### File Naming
- **Public Routes**: `<entity>.test.ts` (e.g., `article.test.ts`)
- **Admin Routes**: `<entity>.admin.test.ts` (e.g., `article.admin.test.ts`)

#### Test Pattern
Tests follow BDD-style with describe/it blocks:

```typescript
import { describe, it, beforeAll, afterAll } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";

describe("Article API", () => {
  let authToken: string;
  let testArticleId: number;
  
  beforeAll(async () => {
    // Setup: Login and get auth token
    const response = await fetch("http://localhost:8001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alpha@tstack.in",
        password: "password123",
      }),
    });
    const data = await response.json();
    authToken = data.token;
  });

  describe("Public Operations", () => {
    it("should list all articles without authentication", async () => {
      const response = await fetch("http://localhost:8001/articles");
      assertEquals(response.status, 200);
      
      const data = await response.json();
      assertExists(data.data);
    });
  });

  describe("Create Operations", () => {
    it("should create article with valid data", async () => {
      const response = await fetch("http://localhost:8001/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: "Test Article",
          content: "Test content",
          published: true,
        }),
      });
      
      assertEquals(response.status, 201);
      const data = await response.json();
      testArticleId = data.id;
      assertEquals(data.title, "Test Article");
    });

    it("should reject creation without authentication", async () => {
      const response = await fetch("http://localhost:8001/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Unauthorized Article",
          content: "Should fail",
        }),
      });
      
      assertEquals(response.status, 401);
    });
  });
  
  afterAll(async () => {
    // Cleanup: Delete test article
    if (testArticleId) {
      await fetch(`http://localhost:8001/articles/${testArticleId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${authToken}` },
      });
    }
  });
});
```

#### Test Environment
- **Test Database**: Automatically created as `{project_name}_test_db`
- **Test Port**: Usually port 8001 (different from dev server on 8000)
- **Isolation**: Tests run in isolated database, safe to reset/cleanup
- **Environment**: Uses `.env.test.local` configuration

### Running Tests

#### Full Test Cycle (Recommended for CI)

```bash
deno task test:full        # Setup test DB + migrate + seed + run tests
```

This command:
1. Creates/recreates test database
2. Applies all migrations
3. Seeds test data (superadmin, alpha user, etc.)
4. Runs all tests
5. Reports results

#### Fast Development Loop

```bash
# Watch mode - re-run tests on file changes
deno task test:watch

# Run tests only (assumes DB is already set up)
deno task test
```

#### Test Database Management

```bash
# Setup test database from scratch
deno task test:setup        # Create DB + apply migrations

# Reset test database
deno task test:reset        # Drop, recreate, migrate, seed

# Apply migrations to test DB
deno task test:migrate

# Seed test data
deno task test:seed

# Cleanup test database
deno task cleanup:test-db
```

#### Coverage Report

```bash
deno task test:coverage     # Generate coverage report to coverage/
```

### Best Practices

1. **Group Related Tests**: Use nested `describe` blocks to organize tests logically
   ```typescript
   describe("Article API", () => {
     describe("Create Operations", () => { ... });
     describe("Update Operations", () => { ... });
     describe("Delete Operations", () => { ... });
   });
   ```

2. **Descriptive Test Names**: Start with "should..." and clearly state expected behavior
   ```typescript
   it("should create article with valid data", ...);
   it("should reject creation without authentication", ...);
   it("should prevent user from updating another user's article", ...);
   ```

3. **Test Both Success and Error Cases**: Validate happy paths AND edge cases
   - Valid data succeeds
   - Invalid data fails with correct error
   - Missing authentication fails with 401
   - Insufficient permissions fail with 403

4. **Clean Up Test Data**: Use `afterAll` or `afterEach` hooks to remove test artifacts
   ```typescript
   afterAll(async () => {
     // Delete created test records
   });
   ```

5. **Use Meaningful Assertions**: Check multiple properties when relevant
   ```typescript
   assertEquals(response.status, 201);
   assertExists(data.id);
   assertEquals(data.title, expectedTitle);
   ```

6. **Test Permissions**: Verify role-based access control works correctly
   ```typescript
   it("should allow superadmin to delete any article", ...);
   it("should prevent regular user from accessing admin routes", ...);
   ```

### Health Check

Quick database and server connectivity test:

```bash
deno task test:check        # Verify DB connection and basic readiness
```

Use this before running full tests to catch configuration issues early.


## 16. Error Handling

Central error utilities live under `shared/utils/errors.ts`. Throw typed errors
(`BadRequestError`, `UnauthorizedError`, etc.) from services/controllers – the
global handler converts them to structured JSON responses.

## 17. Formatting & Linting

```bash
deno task fmt
deno task lint
```

Run before commits to maintain consistency and catch drift early.

## 18. Deployment (Docker Compose)

```bash
export ENVIRONMENT=production
cp .env .env.production.local  # or create fresh
# Edit secrets (JWT_SECRET, DATABASE_URL)
docker compose up --build -d
docker compose exec app deno task migrate:run
docker compose exec app deno task db:seed
```

External database build:

```bash
docker build -t my-api .
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="replace-with-strong-secret" \
  --name my-api \
  my-api
```

## 19. Maintenance Tips

- Always modify models BEFORE first migration generation.
- Keep seed scripts idempotent (current scripts are safe to re‑run).
- Avoid leaking secrets: never mark sensitive settings `isPublic`.
- Rotate JWT secret → revoke existing tokens (truncate `auth_tokens`).

## 20. Customizing Further

- Add new middleware under `shared/`.
- Introduce caching layer (e.g., Redis) behind services.
- Generate additional entities via CLI (from the toolkit) or manually following
  the pattern.

## 21. License

MIT – see root `LICENSE`.

## 22. Support

Toolkit issues / discussions: upstream repository. For this project, manage via
your own issue tracker.

---

Happy building! Replace placeholder names above and start shipping.
