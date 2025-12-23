# TStack API Starter - Complete Reference

> **For AI Agents, LLMs, and Developers**: This is the exhaustive reference for
> the API Starter template. Every route, service, controller, middleware, and
> pattern is documented here.

**Source Code**: [packages/api-starter/](packages/api-starter/)

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Available Tasks](#available-tasks)
- [Database Setup](#database-setup)
- [Authentication System](#authentication-system)
- [RBAC (Role-Based Access Control)](#rbac-role-based-access-control)
- [Base Abstractions](#base-abstractions)
  - [BaseService](#baseservice)
  - [BaseController](#basecontroller)
  - [BaseRouteFactory](#baseroutefactory)
- [Entity Structure](#entity-structure)
- [API Endpoints Reference](#api-endpoints-reference)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Overview

The API Starter is a production-ready backend template using:

| Component     | Technology    | Version |
| ------------- | ------------- | ------- |
| Runtime       | Deno          | 2.6+    |
| Web Framework | Hono          | 4.6+    |
| ORM           | Drizzle ORM   | 0.36+   |
| Database      | PostgreSQL    | 16+     |
| Validation    | Zod           | 3.23+   |
| Auth          | JWT (JOSE)    | 5.9+    |
| Admin Library | @tstack/admin | 2.1+    |

---

## Project Structure

```
api-starter/
├── deno.json                    # Deno configuration and tasks
├── drizzle.config.ts            # Drizzle ORM configuration
├── docker-compose.yml           # PostgreSQL container
├── docker-compose.dev.yml       # Development overrides
├── Dockerfile                   # Production container
├── .env.example                 # Environment template
├── migrations/                  # Drizzle migrations
│   └── README.md
├── scripts/
│   ├── create-db.ts             # Database creation
│   ├── seed.ts                  # Data seeding
│   ├── seed-superadmin.ts       # Superadmin seeding only
│   └── cleanup-test-db.ts       # Test database cleanup
└── src/
    ├── main.ts                  # App entry point
    ├── config/
    │   ├── database.ts          # DB connection
    │   └── env.ts               # Environment config
    ├── auth/
    │   ├── auth.controller.ts   # Auth handlers
    │   ├── auth.service.ts      # Auth business logic
    │   ├── auth.route.ts        # Auth routes
    │   ├── auth.dto.ts          # Auth DTOs
    │   ├── user.model.ts        # User schema
    │   ├── token.model.ts       # Token schema
    │   ├── user.admin.route.ts  # User admin routes
    │   └── auth.test.ts         # Auth tests
    ├── entities/
    │   ├── articles/            # Example entity
    │   │   ├── article.model.ts
    │   │   ├── article.dto.ts
    │   │   ├── article.service.ts
    │   │   ├── article.controller.ts
    │   │   ├── article.route.ts
    │   │   ├── article.admin.route.ts
    │   │   └── article.test.ts
    │   ├── site_settings/       # System settings entity
    │   └── ... (other entities)
    └── shared/
        ├── base/
        │   ├── base-service.ts
        │   ├── base-controller.ts
        │   └── base-route-factory.ts
        ├── middleware/
        │   ├── requireAuth.ts
        │   ├── requireRole.ts
        │   ├── requestLogger.ts
        │   └── securityHeaders.ts
        ├── utils/
        │   ├── jwt.ts
        │   ├── validation.ts
        │   └── password.ts
        ├── errors/
        │   └── http-errors.ts
        └── common-columns.ts
```

---

## Environment Configuration

**Source**:
[packages/api-starter/src/config/env.ts](packages/api-starter/src/config/env.ts)

### Environment Files

| File                     | Purpose                 | Git Ignored |
| ------------------------ | ----------------------- | ----------- |
| `.env`                   | Current environment     | Yes         |
| `.env.example`           | Template for developers | No          |
| `.env.development.local` | Development overrides   | Yes         |
| `.env.test.local`        | Test environment        | Yes         |
| `.env.production.local`  | Production overrides    | Yes         |

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT (required in production)
JWT_SECRET=your-secret-key-min-32-chars
```

### Optional Variables

```bash
# Server
PORT=8000                              # Default: 8000
ENVIRONMENT=development                # development | test | production
ALLOWED_ORIGINS=http://localhost:3000  # Comma-separated CORS origins

# JWT Configuration
JWT_ISSUER=tonystack                   # Token issuer claim
JWT_EXPIRY=1h                          # Token expiration (1h, 7d, etc.)

# Superadmin (for seeding)
SUPERADMIN_EMAIL=superadmin@tstack.in
SUPERADMIN_PASSWORD=your-secure-password

# Logging
LOG_LEVEL=info                         # debug | info | warn | error
```

### Config Interface

```typescript
// Source: packages/api-starter/src/config/env.ts
export interface Config {
  environment: string;
  port: number;
  databaseUrl: string;
  allowedOrigins: string[];
  jwt: {
    secret: string;
    issuer: string;
    expiry: string;
  };
}

export const config: Config = loadConfig();

// Environment helpers
export const isDevelopment = config.environment === "development";
export const isProduction = config.environment === "production";
export const isTest = config.environment === "test";
```

---

## Available Tasks

Defined in [packages/api-starter/deno.json](packages/api-starter/deno.json):

### Development

```bash
# Start development server with watch mode
deno task dev

# Start server without watch mode
deno task start

# Validate environment variables
deno task env:validate
```

### Database

```bash
# Generate migration from schema changes
deno task migrate:generate

# Run pending migrations
deno task migrate:run

# Open Drizzle Studio (GUI)
deno task db:studio

# Seed all data (superadmin + demo data)
deno task db:seed

# Seed only superadmin user
deno task db:seed:superadmin

# Full setup (validate + migrate + seed)
deno task setup
```

### Testing

```bash
# Run all tests
deno task test

# Run tests in watch mode
deno task test:watch

# Run tests with coverage report
deno task test:coverage

# Reset test database (recreate + migrate + seed)
deno task test:reset
```

### Code Quality

```bash
# Format code
deno task fmt

# Lint code
deno task lint

# Type check
deno task check
```

---

## Database Setup

**Source**:
[packages/api-starter/src/config/database.ts](packages/api-starter/src/config/database.ts)

### Connection Setup

```typescript
// Source: packages/api-starter/src/config/database.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "./env.ts";

const client = postgres(config.databaseUrl);

export const db = drizzle(client, {
  casing: "snake_case", // Auto-converts camelCase to snake_case
});

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

// Initialize database connection
export async function initDatabase(): Promise<void> {
  const healthy = await healthCheck();
  if (!healthy) {
    throw new Error("Database connection failed");
  }
  console.log("[INFO] Database connected successfully");
}
```

### Common Columns

All entities should include these standard columns:

```typescript
// Source: packages/api-starter/src/shared/common-columns.ts
import { serial, timestamp } from "drizzle-orm/pg-core";

export const commonColumns = {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
};
```

### Three-Database Pattern

Each project uses three databases:

| Database      | Purpose           | When Used            |
| ------------- | ----------------- | -------------------- |
| `{name}_dev`  | Development       | `deno task dev`      |
| `{name}_test` | Automated testing | `deno task test`     |
| `{name}_prod` | Production        | Deployed application |

### Migration Workflow

```bash
# 1. Modify schema in *.model.ts files

# 2. Generate migration
deno task migrate:generate
# Creates: migrations/NNNN_*.sql

# 3. Review generated SQL
cat migrations/0001_*.sql

# 4. Apply migration
deno task migrate:run

# 5. Verify in Drizzle Studio
deno task db:studio
```

---

## Authentication System

**Source**: [packages/api-starter/src/auth/](packages/api-starter/src/auth/)

### User Model

```typescript
// Source: packages/api-starter/src/auth/user.model.ts
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { commonColumns } from "../shared/common-columns.ts";

export type UserRole = "superadmin" | "admin" | "moderator" | "user";

export const users = pgTable("users", {
  ...commonColumns,
  username: text("username"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(), // bcrypt hashed
  role: text("role").$type<UserRole>().default("user").notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SafeUser = Omit<User, "password">;
```

### Token Model

```typescript
// Source: packages/api-starter/src/auth/token.model.ts
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { commonColumns } from "../shared/common-columns.ts";
import { users } from "./user.model.ts";

export const tokens = pgTable("tokens", {
  ...commonColumns,
  token: text("token").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  revokedAt: timestamp("revoked_at", { mode: "date" }),
});

export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
```

### Auth DTOs

```typescript
// Source: packages/api-starter/src/auth/auth.dto.ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
```

### Auth Service

```typescript
// Source: packages/api-starter/src/auth/auth.service.ts
export class AuthService {
  // Register a new user
  static async register(
    data: RegisterDTO,
  ): Promise<{ user: SafeUser; token: string }> {
    // 1. Check if email exists
    // 2. Hash password with bcrypt
    // 3. Insert user
    // 4. Generate JWT token
    // 5. Store token in database
    // 6. Return user (without password) and token
  }

  // Login existing user
  static async login(
    data: LoginDTO,
  ): Promise<{ user: SafeUser; token: string }> {
    // 1. Find user by email
    // 2. Verify password
    // 3. Update lastLoginAt
    // 4. Generate JWT token
    // 5. Store token in database
    // 6. Return user and token
  }

  // Logout user (revoke token)
  static async logout(token: string): Promise<void> {
    // 1. Find token in database
    // 2. Set revokedAt timestamp
  }

  // Validate token and get user
  static async validateToken(token: string): Promise<SafeUser | null> {
    // 1. Verify JWT signature
    // 2. Check token exists in database
    // 3. Check token not revoked
    // 4. Check token not expired
    // 5. Return user data
  }

  // Get current user by ID
  static async getCurrentUser(userId: number): Promise<SafeUser> {
    // 1. Find user by ID
    // 2. Return user (without password)
  }

  // Change user password
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // 1. Find user
    // 2. Verify current password
    // 3. Hash new password
    // 4. Update user
    // 5. Revoke all existing tokens
  }
}
```

### Auth Routes

```typescript
// Source: packages/api-starter/src/auth/auth.route.ts
import { Hono } from "hono";
import { AuthController } from "./auth.controller.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";

export const authRoutes = new Hono();

// Public routes (no authentication required)
authRoutes.post("/auth/register", AuthController.register);
authRoutes.post("/auth/login", AuthController.login);

// Protected routes (authentication required)
authRoutes.post("/auth/logout", requireAuth, AuthController.logout);
authRoutes.get("/auth/me", requireAuth, AuthController.getCurrentUser);
authRoutes.put(
  "/auth/change-password",
  requireAuth,
  AuthController.changePassword,
);
```

### JWT Utilities

```typescript
// Source: packages/api-starter/src/shared/utils/jwt.ts
import * as jose from "jose";
import { config } from "../../config/env.ts";

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

// Generate JWT token
export async function generateToken(payload: TokenPayload): Promise<string> {
  const secret = new TextEncoder().encode(config.jwt.secret);

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(config.jwt.issuer)
    .setExpirationTime(config.jwt.expiry)
    .sign(secret);

  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(config.jwt.secret);
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: config.jwt.issuer,
    });
    return payload as TokenPayload;
  } catch {
    return null;
  }
}
```

---

## RBAC (Role-Based Access Control)

**Source**:
[packages/api-starter/src/shared/middleware/requireRole.ts](packages/api-starter/src/shared/middleware/requireRole.ts)

### Role Hierarchy

```
superadmin
    │
    └── admin
          │
          └── moderator
                │
                └── user
```

| Role         | Can Access                                 |
| ------------ | ------------------------------------------ |
| `superadmin` | Everything, create admins, system settings |
| `admin`      | Admin panel, manage content, view users    |
| `moderator`  | Moderate content, limited admin access     |
| `user`       | Public API, own profile                    |

### Role Middleware

```typescript
// Source: packages/api-starter/src/shared/middleware/requireRole.ts
import { Context, Next } from "hono";
import type { UserRole } from "../../auth/user.model.ts";

export function requireRole(allowedRoles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    await next();
  };
}

// Pre-configured role middlewares
export const requireSuperadmin = requireRole(["superadmin"]);
export const requireAdmin = requireRole(["superadmin", "admin"]);
export const requireModerator = requireRole([
  "superadmin",
  "admin",
  "moderator",
]);
```

### Usage Examples

```typescript
import { requireAuth } from "../shared/middleware/requireAuth.ts";
import {
  requireAdmin,
  requireModerator,
  requireSuperadmin,
} from "../shared/middleware/requireRole.ts";

// Only superadmin can create other admins
app.post("/admin/users", requireAuth, requireSuperadmin, createAdmin);

// Admin and superadmin can manage content
app.delete("/admin/articles/:id", requireAuth, requireAdmin, deleteArticle);

// Moderator can approve comments
app.put(
  "/admin/comments/:id/approve",
  requireAuth,
  requireModerator,
  approveComment,
);
```

---

## Base Abstractions

The API Starter uses base classes to reduce boilerplate. These come from the
`@tstack/admin` package.

### BaseService

**Source**:
[packages/api-starter/src/shared/base/base-service.ts](packages/api-starter/src/shared/base/base-service.ts)

Provides standard CRUD operations with lifecycle hooks.

#### Interface

```typescript
// Pagination options for queries
export interface PaginationOptions {
  page?: number; // Default: 1
  limit?: number; // Default: 20
  offset?: number; // Alternative to page
}

// Paginated response format
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Query options
export interface QueryOptions {
  where?: SQL; // Drizzle SQL condition
  orderBy?: SQL; // Sort order
  pagination?: PaginationOptions;
}
```

#### Methods

```typescript
abstract class BaseService<
  T, // Entity type (from $inferSelect)
  CreateDTO, // Create data shape
  UpdateDTO, // Update data shape
  ResponseDTO, // Response shape
> {
  constructor(
    protected db: DrizzleDB,
    protected table: PgTable,
  ) {}

  // READ operations
  async getAll(options?: QueryOptions): Promise<ResponseDTO[]>;
  async getAllPaginated(
    pagination: PaginationOptions,
    options?: QueryOptions,
  ): Promise<PaginatedResponse<ResponseDTO>>;
  async getById(id: number): Promise<ResponseDTO | null>;
  async getByIds(ids: number[]): Promise<ResponseDTO[]>;
  async count(where?: SQL): Promise<number>;
  async exists(id: number): Promise<boolean>;

  // CREATE operations
  async create(data: CreateDTO): Promise<ResponseDTO>;
  async createMany(data: CreateDTO[]): Promise<ResponseDTO[]>;

  // UPDATE operations
  async update(id: number, data: UpdateDTO): Promise<ResponseDTO | null>;
  async updateMany(where: SQL, data: UpdateDTO): Promise<number>;

  // DELETE operations
  async delete(id: number): Promise<boolean>;
  async deleteMany(where: SQL): Promise<number>;

  // LIFECYCLE HOOKS (override in subclass)
  protected beforeCreate?(data: CreateDTO): Promise<CreateDTO> | CreateDTO;
  protected afterCreate?(
    result: ResponseDTO,
  ): Promise<ResponseDTO> | ResponseDTO;
  protected beforeUpdate?(
    id: number,
    data: UpdateDTO,
  ): Promise<UpdateDTO> | UpdateDTO;
  protected afterUpdate?(
    result: ResponseDTO,
  ): Promise<ResponseDTO> | ResponseDTO;
  protected beforeDelete?(id: number): Promise<void> | void;
  protected afterDelete?(id: number): Promise<void> | void;
}
```

#### Usage Example

```typescript
// Source: packages/api-starter/src/entities/articles/article.service.ts
import { BaseService } from "../../shared/base/base-service.ts";
import { db } from "../../config/database.ts";
import { Article, articles } from "./article.model.ts";
import {
  ArticleResponseDTO,
  CreateArticleDTO,
  UpdateArticleDTO,
} from "./article.dto.ts";

export class ArticleService extends BaseService<
  Article,
  CreateArticleDTO,
  UpdateArticleDTO,
  ArticleResponseDTO
> {
  constructor() {
    super(db, articles);
  }

  // Override lifecycle hook to generate slug
  protected override async beforeCreate(
    data: CreateArticleDTO,
  ): Promise<CreateArticleDTO> {
    if (!data.slug && data.title) {
      data.slug = this.generateSlug(data.title);
    }
    return data;
  }

  // Override lifecycle hook to update timestamps
  protected override async beforeUpdate(
    id: number,
    data: UpdateArticleDTO,
  ): Promise<UpdateArticleDTO> {
    return { ...data, updatedAt: new Date() };
  }

  // Custom method with author join
  async getWithAuthor(id: number): Promise<ArticleWithAuthor | null> {
    const [result] = await this.db
      .select({
        article: articles,
        author: { id: users.id, email: users.email },
      })
      .from(articles)
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.id, id));

    return result || null;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

export const articleService = new ArticleService();
```

### BaseController

**Source**:
[packages/api-starter/src/shared/base/base-controller.ts](packages/api-starter/src/shared/base/base-controller.ts)

Handles HTTP requests with declarative authorization.

#### Interface

```typescript
// Authorization configuration per operation
export interface AuthConfig {
  roles?: UserRole[]; // Allowed roles
  ownershipCheck?: (entity: unknown, userId: number) => boolean; // Check ownership
  customCheck?: (c: Context, entity?: unknown) => Promise<void> | void; // Custom logic
}

// Controller configuration
export interface ControllerConfig {
  create?: AuthConfig;
  update?: AuthConfig;
  delete?: AuthConfig;
}
```

#### Methods

```typescript
abstract class BaseController<
  ServiceType extends BaseService<any, any, any, any>,
> {
  constructor(
    protected service: ServiceType,
    protected entityName: string,
    protected authConfig?: ControllerConfig,
  ) {}

  // HTTP handlers (bind to routes)
  getAll = async (c: Context) => {
    // Parses: ?page=1&limit=20&search=term&sortBy=name&sortOrder=asc
    // Returns: { data: [...], pagination: {...} }
  };

  getById = async (c: Context) => {
    // Parses: /:id
    // Returns: { data: {...} }
  };

  create = async (c: Context) => {
    // Body: validated by schema
    // Returns: { data: {...} }, 201
  };

  update = async (c: Context) => {
    // Parses: /:id, Body: validated by schema
    // Returns: { data: {...} }
  };

  delete = async (c: Context) => {
    // Parses: /:id
    // Returns: { message: "Deleted" }
  };

  // Check authorization based on config
  protected async checkAuth(
    c: Context,
    method: "create" | "update" | "delete",
    entity?: unknown,
  ): Promise<void>;

  // Parse ID from route params
  protected parseId(c: Context): number | string;

  // Export as static handlers for routes
  toStatic(): {
    getAll: MiddlewareHandler;
    getById: MiddlewareHandler;
    create: MiddlewareHandler;
    update: MiddlewareHandler;
    delete: MiddlewareHandler;
  };
}
```

#### Usage Example

```typescript
// Source: packages/api-starter/src/entities/articles/article.controller.ts
import { BaseController } from "../../shared/base/base-controller.ts";
import { ArticleService, articleService } from "./article.service.ts";

class ArticleController extends BaseController<ArticleService> {
  constructor() {
    super(articleService, "Article", {
      // Anyone can create (if authenticated)
      create: {},

      // Only author or admin can update
      update: {
        ownershipCheck: (article, userId) => article.authorId === userId,
        roles: ["admin", "superadmin"], // OR these roles
      },

      // Only admin/superadmin can delete
      delete: {
        roles: ["admin", "superadmin"],
      },
    });
  }
}

// Export static handlers for routes
export const articleController = new ArticleController().toStatic();
```

### BaseRouteFactory

**Source**:
[packages/api-starter/src/shared/base/base-route-factory.ts](packages/api-starter/src/shared/base/base-route-factory.ts)

Creates standard CRUD routes with minimal configuration.

#### Interface

```typescript
export interface CrudRouteConfig {
  basePath: string;
  controller: {
    getAll: MiddlewareHandler;
    getById: MiddlewareHandler;
    create: MiddlewareHandler;
    update: MiddlewareHandler;
    delete: MiddlewareHandler;
  };
  schemas?: {
    create?: ZodSchema;
    update?: ZodSchema;
  };
  publicRoutes?: ("getAll" | "getById")[]; // Routes without auth
  disabledRoutes?: ("getAll" | "getById" | "create" | "update" | "delete")[];
  middleware?: {
    auth?: MiddlewareHandler;
    role?: MiddlewareHandler;
    custom?: MiddlewareHandler[];
  };
}
```

#### Methods

```typescript
export class BaseRouteFactory {
  static createCrudRoutes(config: CrudRouteConfig): Hono {
    // Creates:
    // GET    /          -> controller.getAll
    // GET    /:id       -> controller.getById
    // POST   /          -> controller.create
    // PUT    /:id       -> controller.update
    // DELETE /:id       -> controller.delete
    //
    // With:
    // - Zod validation on create/update
    // - Auth middleware on protected routes
    // - Role middleware if configured
  }
}
```

#### Usage Example

```typescript
// Source: packages/api-starter/src/entities/articles/article.route.ts
import { Hono } from "hono";
import { articleController } from "./article.controller.ts";
import { createArticleSchema, updateArticleSchema } from "./article.dto.ts";
import { BaseRouteFactory } from "../../shared/base/base-route-factory.ts";

export const articleRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/articles",
  controller: articleController,
  schemas: {
    create: createArticleSchema,
    update: updateArticleSchema,
  },
  publicRoutes: ["getAll", "getById"], // No auth needed
  // disabledRoutes: [],                // All routes enabled
});

// Register in main.ts:
// app.route("/articles", articleRoutes);
```

---

## Entity Structure

Each entity follows a consistent file structure.

### Model (Drizzle Schema)

```typescript
// src/entities/{entity}/{entity}.model.ts
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { commonColumns } from "../../shared/common-columns.ts";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "../../auth/user.model.ts";

export const articles = pgTable("articles", {
  ...commonColumns,
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at", { mode: "date" }),
  authorId: integer("author_id").references(() => users.id).notNull(),
});

// Type inference from schema
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

// Auto-generated Zod schemas
export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);
```

### DTO (Data Transfer Objects)

```typescript
// src/entities/{entity}/{entity}.dto.ts
import { z } from "zod";

// Create validation
export const createArticleSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().max(255).optional(),
  content: z.string().optional(),
  excerpt: z.string().max(500).optional(),
  isPublished: z.boolean().default(false),
});

// Update validation (all fields optional)
export const updateArticleSchema = createArticleSchema.partial();

// TypeScript types from schemas
export type CreateArticleDTO = z.infer<typeof createArticleSchema>;
export type UpdateArticleDTO = z.infer<typeof updateArticleSchema>;

// Response shape (what API returns)
export interface ArticleResponseDTO {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Service (Business Logic)

```typescript
// src/entities/{entity}/{entity}.service.ts
import { BaseService } from "../../shared/base/base-service.ts";
import { db } from "../../config/database.ts";
import { Article, articles } from "./article.model.ts";
import {
  ArticleResponseDTO,
  CreateArticleDTO,
  UpdateArticleDTO,
} from "./article.dto.ts";

export class ArticleService extends BaseService<
  Article,
  CreateArticleDTO,
  UpdateArticleDTO,
  ArticleResponseDTO
> {
  constructor() {
    super(db, articles);
  }

  // Add custom methods as needed
  async findBySlug(slug: string): Promise<ArticleResponseDTO | null> {
    const [result] = await this.db
      .select()
      .from(this.table)
      .where(eq(articles.slug, slug));
    return result || null;
  }

  async findPublished(): Promise<ArticleResponseDTO[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(articles.isPublished, true))
      .orderBy(desc(articles.publishedAt));
  }
}

export const articleService = new ArticleService();
```

### Controller (HTTP Handlers)

```typescript
// src/entities/{entity}/{entity}.controller.ts
import { BaseController } from "../../shared/base/base-controller.ts";
import { ArticleService, articleService } from "./article.service.ts";

class ArticleController extends BaseController<ArticleService> {
  constructor() {
    super(articleService, "Article", {
      create: {},
      update: {
        ownershipCheck: (article, userId) => article.authorId === userId,
        roles: ["admin", "superadmin"],
      },
      delete: { roles: ["admin", "superadmin"] },
    });
  }

  // Custom endpoint handler
  getBySlug = async (c: Context) => {
    const slug = c.req.param("slug");
    const article = await this.service.findBySlug(slug);
    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }
    return c.json({ data: article });
  };
}

export const articleController = new ArticleController().toStatic();
```

### Routes (HTTP Endpoints)

```typescript
// src/entities/{entity}/{entity}.route.ts (Public API)
import { BaseRouteFactory } from "../../shared/base/base-route-factory.ts";
import { articleController } from "./article.controller.ts";
import { createArticleSchema, updateArticleSchema } from "./article.dto.ts";

export const articleRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/articles",
  controller: articleController,
  schemas: {
    create: createArticleSchema,
    update: updateArticleSchema,
  },
  publicRoutes: ["getAll", "getById"],
});
```

```typescript
// src/entities/{entity}/{entity}.admin.route.ts (Admin API)
import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { requireAdmin } from "../../shared/middleware/requireRole.ts";

const ormAdapter = new DrizzleAdapter(articles, {
  db,
  idColumn: "id",
  idType: "number",
});

const admin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "article",
  entityNamePlural: "articles",
  columns: ["id", "title", "slug", "isPublished", "createdAt"],
  searchable: ["title", "slug", "content"],
  sortable: ["id", "title", "createdAt"],
  allowedRoles: ["superadmin", "admin"],
});

export const articleAdminRoutes = new Hono();

// All admin routes require authentication and admin role
articleAdminRoutes.use("*", requireAuth, requireAdmin);

articleAdminRoutes.get("/", admin.list());
articleAdminRoutes.get("/new", admin.new());
articleAdminRoutes.get("/:id", admin.show());
articleAdminRoutes.get("/:id/edit", admin.edit());
articleAdminRoutes.post("/", admin.create());
articleAdminRoutes.put("/:id", admin.update());
articleAdminRoutes.delete("/:id", admin.destroy());
articleAdminRoutes.post("/bulk-delete", admin.bulkDelete());
```

### Test (Endpoint Tests)

```typescript
// src/entities/{entity}/{entity}.test.ts
import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { users } from "../../auth/user.model.ts";

describe("Articles API", () => {
  let testArticleId: number;
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Create test user and get auth token
    const [user] = await db.insert(users).values({
      email: "test@example.com",
      password: await hash("password123"),
      role: "admin",
    }).returning();
    testUserId = user.id;

    const loginRes = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });
    const { data } = await loginRes.json();
    authToken = data.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(articles).where(eq(articles.authorId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("GET /articles", () => {
    it("should return paginated list", async () => {
      const res = await app.request("/articles?page=1&limit=10");
      assertEquals(res.status, 200);

      const body = await res.json();
      assertExists(body.data);
      assertExists(body.pagination);
    });
  });

  describe("POST /articles", () => {
    it("should create article with auth", async () => {
      const res = await app.request("/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: "Test Article",
          content: "Test content",
        }),
      });
      assertEquals(res.status, 201);

      const body = await res.json();
      assertExists(body.data.id);
      testArticleId = body.data.id;
    });

    it("should fail without auth", async () => {
      const res = await app.request("/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "No Auth" }),
      });
      assertEquals(res.status, 401);
    });
  });

  describe("PUT /articles/:id", () => {
    it("should update article", async () => {
      const res = await app.request(`/articles/${testArticleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: "Updated Title" }),
      });
      assertEquals(res.status, 200);

      const body = await res.json();
      assertEquals(body.data.title, "Updated Title");
    });
  });

  describe("DELETE /articles/:id", () => {
    it("should delete article", async () => {
      const res = await app.request(`/articles/${testArticleId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      assertEquals(res.status, 200);
    });
  });
});
```

---

## API Endpoints Reference

### Public API Routes

| Method | Endpoint                | Description       | Auth Required |
| ------ | ----------------------- | ----------------- | ------------- |
| POST   | `/auth/register`        | Register new user | No            |
| POST   | `/auth/login`           | Login user        | No            |
| POST   | `/auth/logout`          | Logout user       | Yes           |
| GET    | `/auth/me`              | Get current user  | Yes           |
| PUT    | `/auth/change-password` | Change password   | Yes           |
| GET    | `/health`               | Health check      | No            |
| GET    | `/{entity}`             | List entities     | Configurable  |
| GET    | `/{entity}/:id`         | Get single entity | Configurable  |
| POST   | `/{entity}`             | Create entity     | Yes           |
| PUT    | `/{entity}/:id`         | Update entity     | Yes           |
| DELETE | `/{entity}/:id`         | Delete entity     | Yes           |

### Admin API Routes

All routes under `/ts-admin/*` require authentication and appropriate role.

| Method | Endpoint                         | Description          | Required Role |
| ------ | -------------------------------- | -------------------- | ------------- |
| GET    | `/ts-admin/{entity}`             | List with pagination | admin+        |
| GET    | `/ts-admin/{entity}/new`         | Get form metadata    | admin+        |
| GET    | `/ts-admin/{entity}/:id`         | Get single record    | admin+        |
| GET    | `/ts-admin/{entity}/:id/edit`    | Get record for edit  | admin+        |
| POST   | `/ts-admin/{entity}`             | Create record        | admin+        |
| PUT    | `/ts-admin/{entity}/:id`         | Update record        | admin+        |
| DELETE | `/ts-admin/{entity}/:id`         | Delete record        | admin+        |
| POST   | `/ts-admin/{entity}/bulk-delete` | Bulk delete records  | admin+        |

### User Management Routes (Superadmin only)

| Method | Endpoint           | Description       | Required Role |
| ------ | ------------------ | ----------------- | ------------- |
| GET    | `/admin/users`     | List all users    | superadmin    |
| GET    | `/admin/users/:id` | Get user by ID    | superadmin    |
| POST   | `/admin/users`     | Create admin user | superadmin    |
| PUT    | `/admin/users/:id` | Update user       | superadmin    |
| DELETE | `/admin/users/:id` | Delete user       | superadmin    |

### Query Parameters

```
# Pagination
?page=1                    # Page number (default: 1)
?limit=20                  # Items per page (default: 20)

# Search
?search=keyword            # Search in searchable columns

# Sorting
?sortBy=createdAt          # Column to sort by
?sortOrder=desc            # asc or desc (default: asc)

# Combined example
/articles?page=1&limit=10&search=typescript&sortBy=createdAt&sortOrder=desc
```

### Response Formats

**Success Response (Single)**:

```json
{
  "data": {
    "id": 1,
    "title": "Article Title",
    "content": "Content here...",
    "createdAt": "2025-12-23T10:00:00.000Z",
    "updatedAt": "2025-12-23T10:00:00.000Z"
  }
}
```

**Success Response (List with Pagination)**:

```json
{
  "data": [
    { "id": 1, "title": "Article 1", ... },
    { "id": 2, "title": "Article 2", ... }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Error Response**:

```json
{
  "error": "Not found",
  "message": "Article with ID 999 not found",
  "statusCode": 404
}
```

**Validation Error Response**:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "title", "message": "Title is required" },
    { "field": "email", "message": "Invalid email format" }
  ],
  "statusCode": 400
}
```

---

## Middleware

### requireAuth

**Source**:
[packages/api-starter/src/shared/middleware/requireAuth.ts](packages/api-starter/src/shared/middleware/requireAuth.ts)

Validates JWT token and attaches user to context.

```typescript
export async function requireAuth(c: Context, next: Next) {
  // 1. Extract token from Authorization header
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No token provided" }, 401);
  }
  const token = authHeader.slice(7);

  // 2. Verify JWT signature
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: "Invalid token" }, 401);
  }

  // 3. Validate token in database (not revoked, not expired)
  const validToken = await AuthService.validateToken(token);
  if (!validToken) {
    return c.json({ error: "Token expired or revoked" }, 401);
  }

  // 4. Attach user info to context
  c.set("userId", payload.userId);
  c.set("userEmail", payload.email);
  c.set("userRole", payload.role);
  c.set("user", validToken);

  await next();
}
```

**Usage**:

```typescript
// Single route
app.get("/protected", requireAuth, handler);

// Route group
app.use("/api/*", requireAuth);
```

**Context Variables Set**:

| Key         | Type       | Description               |
| ----------- | ---------- | ------------------------- |
| `userId`    | `number`   | User's database ID        |
| `userEmail` | `string`   | User's email              |
| `userRole`  | `string`   | User's role               |
| `user`      | `SafeUser` | Full user object (no pwd) |

### requestLogger

**Source**:
[packages/api-starter/src/shared/middleware/requestLogger.ts](packages/api-starter/src/shared/middleware/requestLogger.ts)

Logs incoming requests and response times.

```typescript
export function requestLogger() {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    console.log(`[${method}] ${path} - ${status} (${duration}ms)`);
  };
}
```

### securityHeaders

**Source**:
[packages/api-starter/src/shared/middleware/securityHeaders.ts](packages/api-starter/src/shared/middleware/securityHeaders.ts)

Adds security headers to all responses.

```typescript
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();

    c.res.headers.set("X-Content-Type-Options", "nosniff");
    c.res.headers.set("X-Frame-Options", "DENY");
    c.res.headers.set("X-XSS-Protection", "1; mode=block");
    c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  };
}
```

---

## Error Handling

**Source**:
[packages/api-starter/src/shared/errors/http-errors.ts](packages/api-starter/src/shared/errors/http-errors.ts)

### HTTP Error Classes

```typescript
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad request", details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Resource already exists") {
    super(409, message);
  }
}

export class ValidationError extends HttpError {
  constructor(details: Array<{ field: string; message: string }>) {
    super(400, "Validation failed", details);
  }
}
```

### Global Error Handler

```typescript
// Source: packages/api-starter/src/main.ts
app.onError((error, c) => {
  console.error("[ERROR]", error);

  if (error instanceof HttpError) {
    return c.json({
      error: error.message,
      details: error.details,
      statusCode: error.statusCode,
    }, error.statusCode);
  }

  // Zod validation errors
  if (error instanceof z.ZodError) {
    return c.json({
      error: "Validation failed",
      details: error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
      statusCode: 400,
    }, 400);
  }

  // Unknown errors
  return c.json({
    error: "Internal server error",
    statusCode: 500,
  }, 500);
});
```

### Usage in Services/Controllers

```typescript
import { ConflictError, NotFoundError } from "../shared/errors/http-errors.ts";

class ArticleService {
  async getById(id: number) {
    const article = await this.db.select().from(articles).where(
      eq(articles.id, id),
    );
    if (!article) {
      throw new NotFoundError("Article");
    }
    return article;
  }

  async create(data: CreateArticleDTO) {
    // Check for duplicate slug
    const existing = await this.findBySlug(data.slug);
    if (existing) {
      throw new ConflictError("Article with this slug already exists");
    }
    // ... create article
  }
}
```

---

## Testing

### Test Configuration

```bash
# Environment for tests
ENVIRONMENT=test
DATABASE_URL=postgresql://postgres:password@localhost:5432/myproject_test
JWT_SECRET=test-secret-key-for-testing
LOG_LEVEL=error  # Suppress logs during tests
```

### Running Tests

```bash
# Run all tests
deno task test

# Run specific file
deno test --allow-all src/entities/articles/article.test.ts

# Run with filter
deno test --allow-all --filter "should create article"

# Watch mode
deno task test:watch

# Coverage
deno task test:coverage
```

### Test Patterns

```typescript
import { assertEquals, assertExists, assertRejects } from "@std/assert";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";

describe("Feature Name", () => {
  // Setup before all tests in this describe block
  beforeAll(async () => {
    // Create test data, get auth tokens, etc.
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Remove test data
  });

  // Reset before each test (optional)
  beforeEach(async () => {
    // Reset state
  });

  describe("Endpoint Group", () => {
    it("should do something successfully", async () => {
      const res = await app.request("/endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "value" }),
      });

      assertEquals(res.status, 201);
      const body = await res.json();
      assertExists(body.data);
    });

    it("should handle errors correctly", async () => {
      const res = await app.request("/endpoint/999");
      assertEquals(res.status, 404);
    });
  });
});
```

### Test Utilities

```typescript
// Create authenticated request helper
async function authRequest(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getTestToken();
  return app.request(path, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
    },
  });
}

// Create test user and get token
async function createTestUser(role: UserRole = "user") {
  const [user] = await db.insert(users).values({
    email: `test-${Date.now()}@example.com`,
    password: await hash("password123"),
    role,
  }).returning();

  const res = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      password: "password123",
    }),
  });

  const { data } = await res.json();
  return { user, token: data.token };
}
```

---

## Related Documentation

- **CLI Reference**: [LLMS-CLI.md](LLMS-CLI.md)
- **Frontend Reference**: [LLMS-FRONTEND.md](LLMS-FRONTEND.md)
- **Main Index**: [LLMS.md](LLMS.md)
- **Coding Standards**: [CODING_STANDARDS.md](CODING_STANDARDS.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
