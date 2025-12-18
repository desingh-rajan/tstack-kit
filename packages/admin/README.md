# @tstack/admin

> **Production-Ready Admin CRUD API for TStack Kit**
>
> Pure JSON API for admin operations - bring your own frontend

**Version:** 2.1.0\
**Status:** Production Ready (28/28 tests passing)\
**License:** MIT

---

## Documentation

- [Quick Start](#quick-start) - Get started in 5 minutes
- [Auto-Features](#auto-features-v210) - Slug generation, display order, hooks
- [API Reference](#api-reference) - DrizzleAdapter and HonoAdminAdapter
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Security analysis (Grade A)

---

## Why Use @tstack/admin?

When you run:

```bash
tstack scaffold products
```

You get a complete MVC stack, but **NO admin API**.

**Add 10 lines of code, get full admin JSON API:**

```typescript
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";

const admin = new HonoAdminAdapter({
  ormAdapter: new DrizzleAdapter(products, { db }),
  entityName: "product",
  columns: ["id", "name", "price", "createdAt"],
  searchable: ["name", "description"],
  sortable: ["id", "name", "price"],
});

app.get("/api/admin/products", admin.list());
app.post("/api/admin/products", admin.create());
app.get("/api/admin/products/:id", admin.show());
app.put("/api/admin/products/:id", admin.update());
app.delete("/api/admin/products/:id", admin.destroy());
```

**You Get:**

- Full CRUD JSON API with pagination, search, sorting
- Works with any frontend (React, Vue, Angular, Svelte, Astro)
- Type-safe, framework-agnostic, ORM-agnostic
- Production-tested (28 tests passing)

---

## Features

**Core:**

- Zero configuration required
- Type-safe with full TypeScript generics
- Framework-agnostic (Hono now, Express planned)
- ORM-agnostic (Drizzle now, Prisma planned)
- Production-ready (28/28 tests passing)

**Auto-Features (v2.1.0):**

- Auto-slug generation from `name` column with uniqueness (-1, -2 suffix)
- Auto-increment `displayOrder` on create
- Shift `displayOrder` on update (Rails acts_as_list style)
- Empty value cleanup (null/undefined/"" removed before insert)
- beforeCreate/beforeUpdate hooks for custom transformations

**API:**

- Pure JSON responses (API-first architecture)
- Full-text search across columns
- Efficient pagination with metadata
- Sortable columns (asc/desc)
- Bulk delete operations

**Security:**

- Authentication and authorization middleware support
- Role-based access control
- SQL injection protection (parameterized queries)
- Type-safe input validation

---

## Installation

### Deno

```typescript
import { DrizzleAdapter, HonoAdminAdapter } from "jsr:@tstack/admin";
```

Or add to `deno.json`:

```json
{
  "imports": {
    "@tstack/admin": "jsr:@tstack/admin@^2.1.0"
  }
}
```

### Node.js / Bun (Future)

```bash
npm install @tstack/admin
```

---

## Quick Start

### Step 1: Define Your Drizzle Model

```typescript
// src/entities/products/product.model.ts
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Step 2: Create Admin Route

```typescript
// src/entities/products/product.admin.route.ts
import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { products } from "./product.model.ts";
import { requireSuperAdmin } from "../../shared/middleware/auth.ts";

const productAdminRoutes = new Hono();

// Protect all admin routes
productAdminRoutes.use("*", requireSuperAdmin);

// Create admin adapter
const admin = new HonoAdminAdapter({
  ormAdapter: new DrizzleAdapter(products, {
    db,
    idColumn: "id",
    idType: "number",
  }),
  entityName: "product",
  entityNamePlural: "products",
  columns: ["id", "name", "description", "price", "createdAt"],
  searchable: ["name", "description"],
  sortable: ["id", "name", "price", "createdAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: "/admin/products",
});

// Register CRUD routes
productAdminRoutes.get("/", admin.list());
productAdminRoutes.get("/new", admin.new());
productAdminRoutes.post("/", admin.create());
productAdminRoutes.get("/:id", admin.show());
productAdminRoutes.get("/:id/edit", admin.edit());
productAdminRoutes.put("/:id", admin.update());
productAdminRoutes.patch("/:id", admin.update());
productAdminRoutes.delete("/:id", admin.destroy());
productAdminRoutes.post("/bulk-delete", admin.bulkDelete());

export { productAdminRoutes };
```

### Step 3: Register in Main App

```typescript
// src/main.ts
import { Hono } from "hono";
import { productRoutes } from "./entities/products/product.route.ts";
import { productAdminRoutes } from "./entities/products/product.admin.route.ts";

const app = new Hono();

// Public API routes
app.route("/api/products", productRoutes);

// Admin routes (protected)
app.route("/admin/products", productAdminRoutes);

export default app;
```

### Step 4: Use the API

**Example with curl:**

```bash
# List products
curl http://localhost:8000/admin/products

# Create product
curl -X POST http://localhost:8000/admin/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","price":19.99}'

# Search
curl "http://localhost:8000/admin/products?search=widget&page=1&limit=20"
```

**JSON Response:**

```json
{
  "data": [
    { "id": 1, "name": "Widget", "price": 19.99, "createdAt": "..." },
    { "id": 2, "name": "Gadget", "price": 29.99, "createdAt": "..." }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasPrevious": false,
  "hasNext": true
}
```

---

## Testing

Core unit tests run without database dependency.

```bash
deno task test
```

```
Core Pagination ........ 22/22 tests
Slug Generation ........ 2/2  tests (13 steps)
DisplayOrder Logic ..... 4/4  tests (11 steps)
────────────────────────────────────────────
TOTAL                   28/28 passing
```

---

## Auto-Features (v2.1.0)

### Auto-Slug Generation

When your table has both `name` and `slug` columns, DrizzleAdapter automatically
generates a URL-friendly slug from the name:

```typescript
// Create with just name - slug is auto-generated
await adapter.create({ name: "My Product" });
// Result: { name: "My Product", slug: "my-product" }

// Duplicate names get unique slugs
await adapter.create({ name: "My Product" });
// Result: { name: "My Product", slug: "my-product-1" }
```

### Auto-Increment displayOrder

When your table has a `displayOrder` column:

- **Create**: Always appends to end (max + 1)
- **Update**: Shifts other items to make room at new position

```typescript
// Items: [A:0, B:1, C:2]
await adapter.create({ name: "D" });
// Items: [A:0, B:1, C:2, D:3]

// Move D to position 1
await adapter.update(idD, { displayOrder: 1 });
// Items: [A:0, D:1, B:2, C:3]
```

### beforeCreate / beforeUpdate Hooks

Transform data before saving:

```typescript
const admin = new HonoAdminAdapter({
  ormAdapter: new DrizzleAdapter(products, { db }),
  entityName: "product",
  beforeCreate: (data) => ({
    ...data,
    createdBy: "system",
  }),
  beforeUpdate: (data) => ({
    ...data,
    modifiedBy: "system",
  }),
});
```

---

## Future Extensions

### Framework Adapters

| Adapter | Status   |
| ------- | -------- |
| Hono    | Complete |
| Express | Planned  |

### ORM Adapters

| Adapter | Status   |
| ------- | -------- |
| Drizzle | Complete |
| Prisma  | Planned  |

### Contributing New Adapters

When implementing new adapters:

1. Follow the existing adapter patterns
2. Write comprehensive tests (no mocks)
3. Maintain full type safety
4. Support both integer and UUID primary keys
5. Follow naming conventions

---

## Architecture

### Three-Layer Design

```text
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│  Your Routes → Middleware → Admin Handlers                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│               FRAMEWORK ADAPTER LAYER                           │
│  HonoAdapter | ExpressAdapter                                  │
│  (framework-specific HTTP handling)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    CORE BUSINESS LOGIC                          │
│  Pagination • Validation • Response Negotiation                │
│  (Framework & ORM agnostic)                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  ORM ADAPTER LAYER                              │
│  DrizzleAdapter | SequelizeAdapter | PrismaAdapter             │
│  (ORM-specific database operations)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     DATABASE LAYER                              │
│              PostgreSQL / MySQL / SQLite                        │
└─────────────────────────────────────────────────────────────────┘
```

**Key Benefits:**

1. **Separation of Concerns** - Each layer has one job
2. **Testability** - Test each layer independently
3. **Extensibility** - Add new adapters without touching core
4. **Type Safety** - Generics flow through all layers

The three-layer architecture ensures clean separation and extensibility.

---

## API Reference

### DrizzleAdapter

```typescript
new DrizzleAdapter<T>(table: PgTable, config: {
  db: any;
  idColumn?: string;       // default: "id"
  idType?: "number" | "string"; // default: "number"
})
```

### HonoAdminAdapter

```typescript
new HonoAdminAdapter<T>({
  ormAdapter: IORMAdapter<T>;
  entityName: string;
  entityNamePlural?: string;
  columns: string[];
  searchable?: string[];
  sortable?: string[];
  allowedRoles?: UserRole[];
  baseUrl?: string;
})
```

**Methods:**

- `list()` - List all records (GET /)
- `show()` - Show single record (GET /:id)
- `new()` - Show create form (GET /new)
- `create()` - Create record (POST /)
- `edit()` - Show edit form (GET /:id/edit)
- `update()` - Update record (PUT|PATCH /:id)
- `destroy()` - Delete record (DELETE /:id)
- `bulkDelete()` - Delete multiple (POST /bulk-delete)

See the method descriptions above for usage examples.

---

## Integration with TStack Kit

### Workflow

```text
1. Scaffold Entity
   └─> tstack scaffold products
       └─> Generates: model, DTO, service, controller, routes, tests

2. Add Admin Route
   └─> Create product.admin.route.ts
       └─> Configure HonoAdminAdapter + DrizzleAdapter

3. Register Route
   └─> app.route("/admin/products", productAdminRoutes)

4. Access Admin Panel
   └─> Visit /admin/products
       └─> Full CRUD interface ready!
```

Follow the steps above for complete TStack Kit integration.

---

## Using in Existing Projects (Without TStack Kit)

**Good news:** @tstack/admin works in **ANY** Deno/Hono + Drizzle project!

### Quick Integration

1. **Add to your project:**

```json
// deno.json
{
  "imports": {
    "@tstack/admin": "jsr:@tstack/admin@^2.1.0"
  }
}
```

2. **Create admin route for existing model:**

```typescript
// src/admin/product.admin.route.ts
import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../config/database.ts"; // Your existing DB
import { products } from "../models/product.model.ts"; // Your existing model

const productAdminRoutes = new Hono();

// Use your existing auth middleware
productAdminRoutes.use("*", yourAuthMiddleware);

const admin = new HonoAdminAdapter({
  ormAdapter: new DrizzleAdapter(products, { db }),
  entityName: "product",
  columns: ["id", "name", "price", "createdAt"],
  searchable: ["name", "description"],
  sortable: ["id", "name", "price"],
});

// Register routes
productAdminRoutes.get("/", admin.list());
productAdminRoutes.get("/new", admin.new());
productAdminRoutes.post("/", admin.create());
productAdminRoutes.get("/:id", admin.show());
productAdminRoutes.get("/:id/edit", admin.edit());
productAdminRoutes.put("/:id", admin.update());
productAdminRoutes.delete("/:id", admin.destroy());
productAdminRoutes.post("/bulk-delete", admin.bulkDelete());

export { productAdminRoutes };
```

3. **Register in your app:**

```typescript
// src/main.ts
app.route("/admin/products", productAdminRoutes);
```

4. **Ensure auth middleware sets user:**

```typescript
// Your auth middleware must do: c.set("user", user)
export async function requireAuth(c: Context, next: Next) {
  const user = await verifyToken(c.req.header("Authorization"));
  c.set("user", user); // ← Required!
  await next();
}
```

**That's it!** Visit `/admin/products` to see your admin panel.

**Requirements:**

- Deno 2.0+ or Node.js 18+
- Hono 4.6+
- Drizzle ORM 0.36+
- PostgreSQL (MySQL/SQLite planned)

More advanced usage patterns coming in future releases.

---

## Security

Security Grade: **A** (see [SECURITY_AUDIT.md](./SECURITY_AUDIT.md))

**Implemented:**

- Authentication checks via middleware
- Authorization with role-based access
- SQL injection protection (parameterized queries)
- Type-safe input handling
- Error message sanitization

**Recommended Additions:**

- CSRF protection (use Hono's CSRF middleware)
- Rate limiting (use `hono-rate-limit`)

---

## Contributing

Contributions welcome. Requirements:

1. Follow existing code patterns
2. Write tests (no mocks)
3. Maintain type safety
4. Update documentation
5. All tests must pass before PR

---

## Troubleshooting

**Issue: "Cannot find module '@tstack/admin'"**

```bash
# For Deno
import { HonoAdminAdapter } from "jsr:@tstack/admin";
```

**Issue: "Unauthorized: Authentication required"**

```typescript
// Ensure auth middleware sets user in context
c.set("user", user);
```

**Issue: "Forbidden: Requires superadmin or admin"**

```typescript
// Check user's role matches allowedRoles
allowedRoles: ["superadmin", "admin"];
```

Check the common issues above or create an issue on GitHub.

---

## Support

- **Issues:** <https://github.com/desingh-rajan/tstack-kit/issues>
- **Discussions:** Create GitHub Discussion for questions

---

## License

MIT License - See [LICENSE](../../LICENSE) file for details.

---

## Credits

**Maintainers:** TStack Kit Team

**Built with:** [Hono](https://hono.dev/) |
[Drizzle ORM](https://orm.drizzle.team/) | [Deno](https://deno.com/)
