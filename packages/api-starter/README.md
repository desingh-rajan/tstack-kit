# TonyStack Starter - Your Project Name

> Replace "Your Project Name" with your actual project name (e.g., "Blog API",
> "E-commerce API")

A lightweight, modular REST API starter built with Deno + Hono + Drizzle,
featuring built-in authentication, role-based access control, and a dynamic site
settings system.

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

| Variable                | Required   | Default                   | Notes                                          |
| ----------------------- | ---------- | ------------------------- | ---------------------------------------------- |
| `DATABASE_URL`          | Yes        | —                         | Postgres connection string (must exist)        |
| `PORT`                  | No         | 8000                      | HTTP port                                      |
| `ENVIRONMENT`           | No         | development               | Allowed values: development, test, production  |
| `ALLOWED_ORIGINS`       | No         | <http://localhost:3000>   | Comma separated list                           |
| `JWT_SECRET`            | Yes (prod) | `change-me-in-production` | Replace in production                          |
| `JWT_ISSUER`            | No         | tonystack                 | Token issuer name                              |
| `JWT_EXPIRY`            | No         | 1h                        | e.g. `1h`, `30m`, `7d`                         |
| `AWS_ACCESS_KEY_ID`     | For S3     | —                         | AWS credentials for image uploads              |
| `AWS_SECRET_ACCESS_KEY` | For S3     | —                         | AWS credentials for image uploads              |
| `AWS_REGION`            | For S3     | —                         | e.g. `ap-south-1`, `us-east-1`                 |
| `S3_BUCKET_NAME`        | For S3     | —                         | S3 bucket name for image storage               |
| `S3_PREFIX`             | For S3     | —                         | Path prefix: `{workspace}/{env}` e.g. `sc/dev` |

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

| Task                       | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `deno task dev`            | Run with watch & all permissions                |
| `deno task start`          | Run once (no watch)                             |
| `deno task routes`         | List all available routes                       |
| `deno task setup`          | Run migrations + seed data                      |
| `deno task db:create`      | Create database                                 |
| `deno task db:migrate`     | Apply pending migrations                        |
| `deno task db:generate`    | Create migration from current schema            |
| `deno task db:seed`        | Seed users + site settings                      |
| `deno task seed:ecommerce` | Seed e-commerce data (products, categories)     |
| `deno task db:studio`      | Open Drizzle Studio (schema browser)            |
| `deno task test`           | Run tests (setup + run + cleanup)               |
| `deno task test:watch`     | Watch mode tests                                |
| `deno task check`          | Format check + lint                             |
| `deno task fmt`            | Format source                                   |
| `deno task lint`           | Lint source                                     |

**Aliases:**

- `deno task migrate:run` → `deno task db:migrate`
- `deno task migrate:generate` → `deno task db:generate`

## 7. First Run

```bash
# 1. Create environment file from example
cp .env.example .env.development.local
# Edit .env.development.local with your settings (DATABASE_URL, JWT_SECRET, etc.)

# 2. Start PostgreSQL (using Docker Compose)
docker compose up -d postgres

# 3. Run migrations
deno task db:migrate

# 4. Seed core data (users + site settings)
deno task db:seed

# 5. Seed e-commerce data (products, categories, brands)
deno task seed:ecommerce

# 6. Start development server
deno task dev
```

Visit: `http://localhost:8000`

**Default Credentials (after seeding):**

- Superadmin: `superadmin@tstack.in` / `password123`
- Alpha User: `alpha@tstack.in` / `password123`

## 8. Entities & Conventions

Each entity in the project follows a modular, consistent structure.
Understanding this pattern will help you maintain and extend your API
effectively.

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

**Best Practice**: Add all fields to your model BEFORE generating the first
migration to keep migration history clean.

## 9. Base Abstractions Pattern

### Design Philosophy

**The Problem:** Admin panels need standard CRUD operations (index, show,
create, edit, delete) for every entity. Writing this repetitive code manually is
time-consuming and error-prone.

**The Solution:** Base abstractions that generate 80% of the code automatically,
leaving you to focus on business logic.

**Two-Tier API Design:**

1. **Admin API (`/ts-admin/entity`)** - Standardized CRUD for admin panels
   - Extends base classes for consistency
   - Provides list/search/filter/sort/bulk operations
   - Powers the reusable admin frontend UI
   - Rails-style convention over configuration

2. **Public API (`/api/entity`)** - Custom business logic
   - Can use base classes when logic aligns (common for simple entities)
   - Override/customize when business needs differ
   - Complete freedom to deviate from CRUD pattern

**When to use base classes:**

- ✅ Always for admin APIs (standardization is the goal)
- ✅ For public APIs with standard CRUD needs
- ❌ For complex business logic (auth, payments, custom workflows)

### Architecture Overview

```
BaseService (Generic CRUD + Lifecycle Hooks)
    ↓ extends
YourService (Custom business logic)
    ↓ used by
BaseController (Generic HTTP handlers + Declarative Auth)
    ↓ extends
YourController (Custom handlers)
    ↓ used by
BaseRouteFactory (Auto-generate CRUD routes)
    ↓ generates
/api/your-entity (REST endpoints)

AdminRouteFactory (Standard Admin CRUD)
    ↓ generates
/ts-admin/your-entity (Admin panel endpoints)
```

### 9.1 BaseService - Data Layer

**Purpose:** Generic CRUD operations with lifecycle hooks for custom logic.

**Location:** `src/shared/services/base.service.ts`

#### Basic Usage

```typescript
import { BaseService } from "../../shared/services/base.service.ts";
import { db } from "../../config/database.ts";
import { products } from "./product.model.ts";
import type {
  CreateProductDTO,
  Product,
  ProductResponseDTO,
  UpdateProductDTO,
} from "./product.dto.ts";

export class ProductService extends BaseService<
  Product, // Database model type
  CreateProductDTO, // Creation input type
  UpdateProductDTO, // Update input type
  ProductResponseDTO // Response type
> {
  constructor() {
    super(db, products); // Pass database connection and table
  }
}

export const productService = new ProductService();
```

**What You Get (Inherited):**

- `getAll(options?)` - List with pagination, filtering, sorting
- `getById(id)` - Fetch single record
- `create(data)` - Insert with lifecycle hooks
- `update(id, data)` - Update with lifecycle hooks
- `delete(id)` - Delete with lifecycle hooks

#### Lifecycle Hooks

Override these methods to add custom logic at specific points:

```typescript
export class ProductService extends BaseService<...> {
  constructor() {
    super(db, products);
  }

  // Called BEFORE creating a record
  protected override async beforeCreate(data: CreateProductDTO): Promise<CreateProductDTO> {
    // Auto-generate slug from name
    return {
      ...data,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      sku: `PRD-${Date.now()}`, // Generate SKU
    };
  }

  // Called AFTER creating a record
  protected override async afterCreate(record: Product): Promise<void> {
    console.log(`Product created: ${record.name} (ID: ${record.id})`);
    // Send notification, update cache, trigger webhook, etc.
  }

  // Called BEFORE updating a record
  protected override async beforeUpdate(
    id: number,
    data: UpdateProductDTO
  ): Promise<UpdateProductDTO> {
    // Update slug if name changed
    if (data.name) {
      return {
        ...data,
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      };
    }
    return data;
  }

  // Called AFTER updating a record
  protected override async afterUpdate(record: Product): Promise<void> {
    console.log(`Product updated: ${record.name}`);
    // Clear cache, sync with external systems
  }

  // Called BEFORE deleting a record
  protected override async beforeDelete(id: number): Promise<void> {
    // Check for dependencies
    const orderCount = await db.select().from(orders).where(eq(orders.productId, id));
    if (orderCount.length > 0) {
      throw new ValidationError("Cannot delete product with existing orders");
    }
  }

  // Called AFTER deleting a record
  protected override async afterDelete(id: number): Promise<void> {
    console.log(`Product deleted: ${id}`);
    // Clean up associated files, clear cache
  }
}
```

#### Custom Methods

Add methods for complex queries that don't fit the standard CRUD pattern:

```typescript
export class ProductService extends BaseService<...> {
  constructor() {
    super(db, products);
  }

  // Override getAll to add joins
  override async getAll(): Promise<ProductResponseDTO[]> {
    const results = await this.db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        categoryName: categories.name,  // Join with categories
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));
    
    return results;
  }

  // Custom business logic
  async getFeaturedProducts(): Promise<ProductResponseDTO[]> {
    return await this.db
      .select()
      .from(products)
      .where(eq(products.featured, true))
      .orderBy(desc(products.createdAt))
      .limit(10);
  }

  async applyDiscount(productId: number, percentage: number): Promise<Product> {
    const product = await this.getById(productId);
    const discountedPrice = product.price * (1 - percentage / 100);
    return await this.update(productId, { price: discountedPrice });
  }
}
```

### 9.2 BaseController - HTTP Layer

**Purpose:** Generic HTTP handlers with declarative authorization.

**Location:** `src/shared/controllers/base.controller.ts`

#### Basic Usage

```typescript
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { productService } from "./product.service.ts";
import type { Context } from "@hono/hono";

export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(
      productService, // Service instance
      "Product", // Entity name (for error messages)
      {
        // Declarative authorization config
        create: { requireAuth: true },
        update: {
          requireAuth: true,
          ownershipCheck: (product, userId) => product.ownerId === userId,
        },
        delete: {
          requireAuth: true,
          ownershipCheck: (product, userId) => product.ownerId === userId,
          superadminBypass: true, // Superadmins can delete any product
        },
      },
    );
  }
}

// Export static methods for route registration
export const ProductControllerStatic = ProductController.prototype.toStatic();
```

**What You Get (Inherited):**

- `getAll(c)` - GET handler with pagination
- `getById(c)` - GET /:id handler
- `create(c)` - POST handler with validation
- `update(c)` - PUT /:id handler with auth checks
- `delete(c)` - DELETE /:id handler with auth checks

#### Authorization Configuration

Configure authorization declaratively in the constructor:

```typescript
export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(productService, "Product", {
      // Public routes (no config needed)
      // getAll and getById are public by default

      // Require authentication only
      create: {
        requireAuth: true,
      },

      // Require authentication + ownership check
      update: {
        requireAuth: true,
        ownershipCheck: (product, userId) => product.ownerId === userId,
        ownershipField: "ownerId", // Field to check
      },

      // Require specific role
      delete: {
        requireAuth: true,
        requireRole: "admin", // Only admins can delete
        superadminBypass: true, // Superadmins skip role check
      },

      // Custom authorization logic
      publish: {
        requireAuth: true,
        customCheck: async (c, product, userId) => {
          // Complex authorization logic
          const user = await userService.getById(userId);
          return user.role === "admin" || product.ownerId === userId;
        },
      },
    });
  }
}
```

#### Override Handlers

Customize specific handlers while keeping others inherited:

```typescript
export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(productService, "Product", {/* auth config */});
  }

  // Override create to inject user ID
  override create = async (c: Context) => {
    const body = await c.req.json();
    const userId = c.get("userId"); // From JWT middleware

    // Add ownerId automatically
    const productData = {
      ...body,
      ownerId: userId,
    };

    const product = await this.service.create(productData);
    return c.json({ data: product }, 201);
  };

  // Add custom handler
  async publish(c: Context) {
    const productId = Number(c.req.param("id"));
    const product = await this.service.getById(productId);

    // Check authorization (manual example)
    const userId = c.get("userId");
    if (product.ownerId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Update product
    const updated = await this.service.update(productId, { published: true });
    return c.json({ data: updated });
  }
}
```

### 9.3 Route Factories - Route Registration

**Purpose:** Auto-generate REST routes from controllers.

**Location:** `src/shared/routes/base-route.factory.ts`

#### Basic Usage (Public CRUD API)

```typescript
import { BaseRouteFactory } from "../../shared/routes/base-route.factory.ts";
import { ProductControllerStatic } from "./product.controller.ts";
import { CreateProductSchema, UpdateProductSchema } from "./product.dto.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

const productRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/products",
  controller: ProductControllerStatic,
  schemas: {
    create: CreateProductSchema,
    update: UpdateProductSchema,
  },
  publicRoutes: ["getAll", "getById"], // No auth required
  middleware: {
    auth: requireAuth, // JWT validation middleware
  },
});

export default productRoutes;
```

**Generated Routes:**

- `GET /products` - List all (public)
- `GET /products/:id` - Get one (public)
- `POST /products` - Create (requires auth + validation)
- `PUT /products/:id` - Update (requires auth + validation)
- `DELETE /products/:id` - Delete (requires auth)

#### Advanced Configuration

```typescript
const productRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/products",
  controller: ProductControllerStatic,
  schemas: {
    create: CreateProductSchema,
    update: UpdateProductSchema,
    query: ProductQuerySchema, // For GET params validation
  },
  publicRoutes: ["getAll", "getById"],
  disabledRoutes: ["delete"], // Don't expose delete endpoint
  middleware: {
    auth: requireAuth,
    role: requireRole("admin"), // All protected routes require admin
  },
});

// Add custom routes
productRoutes.post("/:id/publish", async (c) => {
  const controller = new ProductController();
  return await controller.publish(c);
});

export default productRoutes;
```

#### Admin Routes (Admin Panel Backend)

**Purpose:** Standardized CRUD endpoints that power the reusable admin UI
frontend.

Admin routes provide consistent operations for every entity:

- List with pagination/search/filter/sort
- View single record
- Create/edit forms with metadata
- Update/delete operations
- Bulk actions

**Why standardize?** The admin frontend UI can be completely generic - it
expects the same endpoint structure for Products, Articles, Categories, etc.
This is the Rails way: convention over configuration.

```typescript
import { AdminRouteFactory } from "../../shared/routes/admin-route.factory.ts";
import { DrizzleAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { products } from "./product.model.ts";

const productAdminRoutes = AdminRouteFactory.createAdminRoutes({
  basePath: "/ts-admin/products",
  tableName: "products",
  adapter: new DrizzleAdapter(db, products),
  requireRole: ["admin", "superadmin"],
});

export default productAdminRoutes;
```

**Generated Admin Routes:**

- `GET /ts-admin/products` - List with search/filter/sort
- `GET /ts-admin/products/new` - Form metadata
- `POST /ts-admin/products` - Create
- `GET /ts-admin/products/:id` - Get one
- `GET /ts-admin/products/:id/edit` - Edit form metadata
- `PUT /ts-admin/products/:id` - Update
- `DELETE /ts-admin/products/:id` - Delete
- `POST /ts-admin/products/bulk-delete` - Bulk delete

**Result:** Admin UI works with any entity without custom code. Just add
`product.admin.route.ts` and the admin panel automatically supports managing
products.

### 9.4 Complete Entity Example

Here's how all pieces work together:

**1. Model** (`product.model.ts`):

```typescript
export const products = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  ownerId: integer("owner_id").references(() => users.id),
  published: boolean().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**2. Service** (`product.service.ts`):

```typescript
export class ProductService extends BaseService<...> {
  constructor() { super(db, products); }
  
  protected override async beforeCreate(data: CreateProductDTO) {
    return { ...data, slug: slugify(data.name) };
  }
}
```

**3. Controller** (`product.controller.ts`):

```typescript
export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(productService, "Product", {
      update: {
        requireAuth: true,
        ownershipCheck: (p, uid) => p.ownerId === uid,
      },
      delete: {
        requireAuth: true,
        ownershipCheck: (p, uid) => p.ownerId === uid,
      },
    });
  }

  override create = async (c) => {
    const body = await c.req.json();
    const product = await this.service.create({
      ...body,
      ownerId: c.get("userId"),
    });
    return c.json({ data: product }, 201);
  };
}
```

**4. Routes** (`product.route.ts`):

```typescript
const productRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/products",
  controller: ProductControllerStatic,
  schemas: { create: CreateProductSchema, update: UpdateProductSchema },
  publicRoutes: ["getAll", "getById"],
  middleware: { auth: requireAuth },
});
export default productRoutes;
```

**5. Register** (`main.ts`):

```typescript
import productRoutes from "./entities/products/product.route.ts";
app.route("/api", productRoutes);
```

**Result:** Full CRUD API with only ~200 lines of code (vs. 500+ lines without
base classes).

### 9.5 When to Use vs. Custom Implementation

**Admin APIs (`/ts-admin/*`)**: Always use base classes + AdminRouteFactory

- Goal: Standardized interface for admin frontend
- Example: Articles, Products, Categories, Users
- Pattern: Consistent list/search/filter/bulk operations

**Public APIs (`/api/*`)**: Use base classes when appropriate

✅ **Use base classes when:**

- Entity has standard CRUD operations (products, articles, categories)
- Authorization is simple (ownership checks, role-based)
- Business logic fits lifecycle hooks (slug generation, timestamps)

❌ **Use custom implementation when:**

- Complex workflows (multi-step checkout, payment processing)
- Non-CRUD operations (login, register, password reset)
- Multiple entities per request (reports, aggregations)
- Special authentication (OAuth, magic links)

**Examples in this starter:**

**Using Base Classes:**

```typescript
// Articles - Standard CRUD with ownership
export class ArticleService extends BaseService<...> {
  protected override async beforeCreate(data) {
    return { ...data, slug: slugify(data.title) };
  }
}
```

**Custom Implementation:**

```typescript
// Auth - Special logic, not CRUD
export class AuthController {
  static async login(c: Context) {
    const { email, password } = await c.req.json();
    // Custom validation, JWT generation
    const token = await AuthService.login(email, password);
    return c.json({ token });
  }
}

// Site Settings - Complex business rules
export class SiteSettingService {
  static async resetToDefault(key: string) {
    // Custom logic: schema validation, system protection
    const setting = systemSettings[key];
    if (!setting) throw new NotFoundError();
    await db.update(siteSettings).set({ value: setting.defaultValue });
  }
}
```

**Key Principle:** Admin APIs prioritize consistency (always use base classes).
Public APIs prioritize flexibility (use base classes when they fit, custom when
they don't).

## 10. Database & Migrations

- Edit models in `src/entities/**/<name>.model.ts`.
- Generate migration AFTER changes: `deno task migrate:generate`.
- Apply: `deno task migrate:run`.
- Inspect: `deno task db:studio`.

Never hand‑edit generated SQL unless absolutely necessary; prefer evolving the
model then regenerating a new migration.

## 11. Seeding

Full seed (users + settings): `deno task db:seed`.

Users created:

- Superadmin: `superadmin@tstack.in` (full privileges)
- Alpha user: `alpha@tstack.in` (regular)
- Regular user (script) for additional testing.

System site settings auto‑seed & self‑heal on access (see settings section).

## 11. Authentication

### Overview

The starter includes JWT-based authentication with role-based access control
(RBAC).

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
- **Rotation**: Update `JWT_SECRET` and force re-login (clear `auth_tokens`
  table)

### Role-Based Access Control (RBAC)

| Role              | Permissions                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `superadmin`      | Full access to all resources; Admin panel access (`/ts-admin/*`); Can create, read, update, delete any content; Manage site settings |
| `user`            | Create own articles; Read public content; Update/delete only own articles; No admin panel access                                     |
| (unauthenticated) | Read-only access to public content; Access public site settings; No write operations                                                 |

## 12. Site Settings System

The site settings system provides dynamic, validated configuration storage with
automatic seeding and type safety.

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
  defaultPaymentConfig,
  paymentConfigSchema,
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

The new setting will be automatically created when first accessed. No manual
database operations needed!

### Public vs Private Settings

Control setting visibility via the `isPublic` flag:

```typescript
// Public - Frontend can access
site_info: { isPublic: true, ... }

// Private - Backend only
email_settings: { isPublic: false, ... }
```

**Default Settings Included:**

| Setting          | Public | Use Case                                  |
| ---------------- | ------ | ----------------------------------------- |
| `site_info`      | ✅     | Site name, tagline, logo - display in UI  |
| `contact_info`   | ✅     | Email, phone, social links - contact page |
| `theme_config`   | ✅     | Colors, fonts - apply to frontend theme   |
| `feature_flags`  | ✅     | Toggle features - enable/disable features |
| `email_settings` | ❌     | SMTP config - backend email sending       |
| `api_config`     | ❌     | Rate limits, CORS - API configuration     |

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

**Note**: Users can only update articles they created. Attempting to update
another user's article will return a `403 Forbidden` error.

#### Delete Own Article

```bash
curl -X DELETE http://localhost:8000/articles/2 \
  -H "Authorization: Bearer $TOKEN"
```

### Admin Operations (Superadmin Role)

Admin operations are available at `/ts-admin/articles` and provide additional
capabilities:

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

A comprehensive list of all available endpoints in the starter project. Use this
as a quick reference when building your frontend or testing the API.

### Authentication Endpoints

| Method | Endpoint         | Auth Required | Description                                  |
| ------ | ---------------- | ------------- | -------------------------------------------- |
| POST   | `/auth/register` | ❌            | Register new user account                    |
| POST   | `/auth/login`    | ❌            | Login with email/password, receive JWT token |
| POST   | `/auth/logout`   | ✅            | Logout (invalidate token)                    |
| GET    | `/auth/me`       | ✅            | Get current user profile                     |

### Article Endpoints (Public API)

| Method | Endpoint        | Auth Required | Description                                  |
| ------ | --------------- | ------------- | -------------------------------------------- |
| GET    | `/articles`     | ❌            | List all published articles (paginated)      |
| GET    | `/articles/:id` | ❌            | Get single article by ID                     |
| POST   | `/articles`     | ✅ user       | Create new article (requires authentication) |
| PUT    | `/articles/:id` | ✅ user       | Update own article                           |
| DELETE | `/articles/:id` | ✅ user       | Delete own article                           |

**Notes:**

- Public endpoints (GET) are accessible without authentication
- Write operations (POST, PUT, DELETE) require user role
- Users can only modify articles they created (ownership check)

### Article Endpoints (Admin API)

| Method | Endpoint                         | Auth Required | Description                                             |
| ------ | -------------------------------- | ------------- | ------------------------------------------------------- |
| GET    | `/ts-admin/articles`             | ✅ superadmin | List all articles with filters (published, unpublished) |
| GET    | `/ts-admin/articles/:id`         | ✅ superadmin | Get any article by ID                                   |
| PUT    | `/ts-admin/articles/:id`         | ✅ superadmin | Update any article (bypass ownership)                   |
| DELETE | `/ts-admin/articles/:id`         | ✅ superadmin | Delete any article                                      |
| POST   | `/ts-admin/articles/bulk-delete` | ✅ superadmin | Delete multiple articles by IDs                         |

**Notes:**

- All admin endpoints require superadmin role
- Admin routes bypass ownership checks
- Access filters and operations unavailable in public API

### Site Settings Endpoints

| Method | Endpoint                    | Auth Required | Description                                          |
| ------ | --------------------------- | ------------- | ---------------------------------------------------- |
| GET    | `/site-settings`            | ❌            | Get all public settings (theme, features, site info) |
| GET    | `/site-settings/:idOrKey`   | ❌            | Get specific setting by ID or key                    |
| POST   | `/site-settings`            | ✅ superadmin | Create new setting                                   |
| PUT    | `/site-settings/:id`        | ✅ superadmin | Update existing setting                              |
| DELETE | `/site-settings/:id`        | ✅ superadmin | Delete setting                                       |
| POST   | `/site-settings/:key/reset` | ✅ superadmin | Reset specific setting to default value              |
| POST   | `/site-settings/reset-all`  | ✅ superadmin | Reset all settings to default values                 |

**Notes:**

- Public GET endpoints only return settings marked as `isPublic: true`
- Private settings (email config, API keys) are hidden from public access
- Settings auto-seed on first access if not present

### Core Endpoints

| Method | Endpoint  | Auth Required | Description                       |
| ------ | --------- | ------------- | --------------------------------- |
| GET    | `/`       | ❌            | API information and health status |
| GET    | `/health` | ❌            | Health check endpoint             |

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

The project includes comprehensive testing infrastructure with a dedicated test
database to ensure isolation from development data.

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
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
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

#### Full Test Cycle

```bash
deno task test        # Setup test DB + run tests + cleanup
```

This command:

1. Creates/recreates test database
2. Applies all migrations
3. Seeds test data
4. Runs all tests
5. Cleans up test database

#### Watch Mode (Development)

```bash
deno task test:watch  # Re-run tests on file changes
```

### Best Practices

1. **Group Related Tests**: Use nested `describe` blocks to organize tests
   logically

   ```typescript
   describe("Article API", () => {
     describe("Create Operations", () => { ... });
     describe("Update Operations", () => { ... });
     describe("Delete Operations", () => { ... });
   });
   ```

2. **Descriptive Test Names**: Start with "should..." and clearly state expected
   behavior

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

4. **Clean Up Test Data**: Use `afterAll` or `afterEach` hooks to remove test
   artifacts

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

## 18. S3 Image Uploads

The API includes built-in S3 image upload support for entity images (products,
categories, etc.).

### Setup

1. **Configure AWS credentials** in your `.env.development.local`:

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket-name
S3_PREFIX=my-project/dev
```

1. **S3 Bucket Configuration**:
   - Go to S3 bucket > Permissions > Block public access
   - Uncheck "Block all public access" (or just ACL-related blocks)
   - Images are uploaded with `public-read` ACL

### Storage Structure

Images are stored with this path pattern:

```
{bucket}/{prefix}/{entityType}/{entityId}/{imageId}.{ext}
```

Example: `my-bucket/sc/dev/products/abc-123/img-456.jpg`

### API Endpoints

For entities with image support (e.g., products):

| Endpoint                                   | Method | Description                         |
| ------------------------------------------ | ------ | ----------------------------------- |
| `/ts-admin/products/:id/images`            | GET    | List images for entity              |
| `/ts-admin/products/:id/images`            | POST   | Upload image (multipart/form-data)  |
| `/ts-admin/product-images/:id`             | DELETE | Delete image (also removes from S3) |
| `/ts-admin/product-images/:id/set-primary` | POST   | Set as primary image                |

### Upload Example

```bash
curl -X POST http://localhost:8000/ts-admin/products/{productId}/images \
  -H "Authorization: Bearer {token}" \
  -F "file=@image.jpg" \
  -F "altText=Product image" \
  -F "isPrimary=true"
```

### S3 Uploader Utility

Located at `src/lib/s3-uploader.ts`:

```typescript
import { S3Uploader } from "../lib/s3-uploader.ts";

const uploader = new S3Uploader();

// Upload
const result = await uploader.uploadImage(
  fileBuffer,
  "products", // entityType
  "product-123", // entityId
  "image/jpeg", // contentType
);
// Returns: { url, key, bucket }

// Delete by URL (extracts S3 key automatically)
await uploader.deleteByUrl(imageUrl);
```

## 19. Deployment (Docker Compose)

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
