# @tstack/admin

> **Production-Ready Admin CRUD API for TStack Kit**
>
> Pure JSON API for admin operations - bring your own frontend

**Version:** 2.0.0  
**Status:** ✅ Production Ready (72/72 tests passing)  
**License:** MIT

---

## 📚 Documentation

- **[Quick Start](#quick-start)** - Get started in 5 minutes
- **[COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md)** - Complete documentation
- **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** - Security analysis (Grade A)
- **[STATUS.md](./STATUS.md)** - Implementation status & roadmap

---

## Why Use @tstack/admin?

When you run:

```bash
tstack scaffold products
```

You get a complete MVC stack, but **NO admin API**.

**Add 10 lines of code, get full admin JSON API:**

```typescript
import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";

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

- ✅ Full CRUD JSON API with pagination, search, sorting
- ✅ Works with ANY frontend (React, Vue, Angular, Svelte, Astro)
- ✅ Type-safe, framework-agnostic, ORM-agnostic
- ✅ Production-tested (72 tests, real database, NO MOCKS)

---

## Features

**Core:**

- 🚀 Zero configuration required
- 🎯 Type-safe with full TypeScript generics
- 🔌 Framework-agnostic (Hono now, Express future)
- 🗄️ ORM-agnostic (Drizzle now, Sequelize/Prisma future)
- ✅ Production-ready (72/72 tests passing)

**API:**

- 📡 Pure JSON responses (API-first architecture)
- 🔍 Full-text search across columns
- 📄 Efficient pagination
- 🔄 Sortable columns
- 🗑️ Bulk operations
- 🌐 Works with any frontend framework

**Security:**

- 🔒 Authentication & authorization checks
- 🛡️ Role-based access control
- 🔐 SQL injection protection (parameterized queries)
- ✅ Type-safe input validation

---

## Installation

### Deno

```typescript
import {
  HonoAdminAdapter,
  DrizzleAdapter,
} from "jsr:@tstack/admin";
```

Or add to `deno.json`:

```json
{
  "imports": {
    "@tstack/admin": "jsr:@tstack/admin@^1.0.0"
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
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

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
import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";
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
    {"id": 1, "name": "Widget", "price": 19.99, "createdAt": "..."},
    {"id": 2, "name": "Gadget", "price": 29.99, "createdAt": "..."}
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

**Philosophy:** **Mocks lie. Real databases tell the truth.**

All 73 tests run against real PostgreSQL. Zero mocks. Zero lies.

```bash
# Run all tests
deno task test

# Test results
✅ Core Pagination:   22/22 tests
✅ Drizzle Adapter:   26/26 tests (real PostgreSQL)
✅ Hono Adapter:      25/25 tests (real HTTP + DB)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TOTAL:            73/73 passing | 0 failed
```

---

## Future Extensions

**Coming Soon:**

### Framework Adapters

- ✅ **Hono** (complete)
- 🚧 **Express** (planned)

### ORM Adapters

- ✅ **Drizzle** (complete)
- 🚧 **Sequelize** (planned)
- 🚧 **Prisma** (planned)

**For Contributors:**

When implementing new adapters, you **MUST**:

1. ✅ Follow the same adapter patterns
2. ✅ Write all 20+ tests (real databases, NO MOCKS)
3. ✅ Maintain type safety
4. ✅ Support both number and string IDs
5. ✅ Follow the same naming conventions

See **[COMPREHENSIVE_GUIDE.md - Section 8: Future Extensions](./COMPREHENSIVE_GUIDE.md#8-future-extensions--standards)** for complete standards and patterns.

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

See **[COMPREHENSIVE_GUIDE.md - Section 3: Architecture Deep Dive](./COMPREHENSIVE_GUIDE.md#3-architecture-deep-dive)** for complete explanation.

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

See **[COMPREHENSIVE_GUIDE.md - Section 6: Complete API Reference](./COMPREHENSIVE_GUIDE.md#6-complete-api-reference)** for full documentation.

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

See **[COMPREHENSIVE_GUIDE.md - Section 5: Integration with TStack Kit](./COMPREHENSIVE_GUIDE.md#5-integration-with-tstack-kit)** for step-by-step guide.

---

## Using in Existing Projects (Without TStack Kit)

**Good news:** @tstack/admin works in **ANY** Deno/Hono + Drizzle project!

### Quick Integration

1. **Add to your project:**

```json
// deno.json
{
  "imports": {
    "@tstack/admin": "jsr:@tstack/admin@^1.0.0"
  }
}
```

2. **Create admin route for existing model:**

```typescript
// src/admin/product.admin.route.ts
import { Hono } from "hono";
import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";
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

See **[COMPREHENSIVE_GUIDE.md - Section 9: Advanced Usage](./COMPREHENSIVE_GUIDE.md#9-advanced-usage)** for more details.

---

## Security

**Grade A** (see [SECURITY_AUDIT.md](./SECURITY_AUDIT.md))

✅ **Implemented:**

- Authentication checks via middleware
- Authorization with role-based access
- SQL injection protection (parameterized queries)
- Type-safe input handling
- Error message sanitization

⚠️ **Recommended Additions:**

1. CSRF protection (use Hono's CSRF middleware)
2. XSS escaping (use template library with auto-escaping)
3. Rate limiting (use `hono-rate-limit`)

See **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** for complete analysis.

---

## Contributing

We welcome contributions! When adding features:

1. **Follow Existing Patterns** - Match current code style
2. **Write Tests** - Real database tests, NO MOCKS
3. **Maintain Type Safety** - Full TypeScript with strict mode
4. **Document Everything** - Update README and COMPREHENSIVE_GUIDE
5. **Test Before PR** - All 73+ tests must pass

**Adding New Adapters:**

- See **[COMPREHENSIVE_GUIDE.md - Section 8: Future Extensions](./COMPREHENSIVE_GUIDE.md#8-future-extensions--standards)**
- Follow adapter interface patterns
- Write minimum 20+ tests per adapter
- Test with real database (NO MOCKS)

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
allowedRoles: ["superadmin", "admin"]
```

See **[COMPREHENSIVE_GUIDE.md - Section 10: Troubleshooting](./COMPREHENSIVE_GUIDE.md#10-troubleshooting)** for complete guide.

---

## Support

- **Documentation:** [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md) - **Start here!**
- **Issues:** <https://github.com/desingh-rajan/tstack-kit/issues>
- **Discussions:** Create GitHub Discussion for questions

---

## License

MIT License - See [LICENSE](../../LICENSE) file for details.

---

## Credits

**Maintainers:** TStack Kit Team  
**Version:** 1.0.0  
**Last Updated:** November 13, 2025

**Built with:**

- [Hono](https://hono.dev/) - Web framework
- [Drizzle](https://orm.drizzle.team/) - ORM
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Deno](https://deno.com/) - Runtime

---

**Together, we build better tools!** 🚀
