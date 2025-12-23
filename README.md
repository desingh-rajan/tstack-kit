# TStack Kit

[![CI](https://github.com/desingh-rajan/tstack-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/desingh-rajan/tstack-kit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/desingh-rajan/tstack-kit/graph/badge.svg)](https://codecov.io/gh/desingh-rajan/tstack-kit)
[![Version](https://img.shields.io/github/v/release/desingh-rajan/tstack-kit?label=version)](https://github.com/desingh-rajan/tstack-kit/releases)
[![License](https://img.shields.io/github/license/desingh-rajan/tstack-kit)](LICENSE)

> **A growing SaaS toolkit that scales from day zero.** Ship products, not
> boilerplate.

TStack Kit is a full-stack toolkit for building type-safe SaaS applications with
Deno, Hono, Drizzle ORM, Fresh, and PostgreSQL. Create complete API, Admin UI, and Storefront workspaces in minutes.

**Documentation:** [docs/README.md](./docs/README.md) for quick navigation to
getting started, CLI, scaffolding, admin, testing, and architecture guides.

**What you can build:**

- Internal tools and admin dashboards
- SaaS MVPs with authentication out of the box
- Portfolio sites that grow into full products
- SSR e-commerce applications
- Content management systems
- Any CRUD-heavy application

---

## Quick Start

```bash
# Install TStack CLI
curl -fsSL https://raw.githubusercontent.com/desingh-rajan/tstack-kit/main/install.sh | sh

# Verify installation (restart terminal if command not found)
tstack --version

# Create your first workspace
tstack create workspace my-app
cd my-app/my-app-api

# Setup database
deno task migrate:generate
deno task migrate:run
deno task db:seed

# Start development
deno task dev
```

Your API is running at `http://localhost:8000`

---

## What You Get

### One Command, Full Stack

```bash
tstack create workspace my-shop
```

Creates:

- **my-shop-api/** - Backend API (Deno + Hono + Drizzle + PostgreSQL)
- **my-shop-admin-ui/** - Admin dashboard (Fresh + Preact + DaisyUI)
- **my-shop-store/** - Storefront (Fresh + Preact + Tailwind CSS)
- 3 databases per project (dev/test/prod)
- Git initialized with initial commit
- JWT authentication (included by default)
- Role-based access control (user/admin/superadmin)
- Built-in entities: Users, Articles, Site Settings
- Product listing entities (brands, categories, products, variants)

### Entity Scaffolding

```bash
tstack scaffold products
```

Generates 8 files in seconds:

- `product.model.ts` - Drizzle schema
- `product.dto.ts` - Zod validation
- `product.service.ts` - Business logic
- `product.controller.ts` - HTTP handlers
- `product.route.ts` - Public API routes
- `product.admin.route.ts` - Admin panel routes
- `product.test.ts` - API tests
- `product.admin.test.ts` - Admin tests

Entity automatically appears in Admin UI sidebar.

---

## Features

| Feature                  | Description                                      |
| ------------------------ | ------------------------------------------------ |
| **Workspace Management** | Create/destroy multi-project workspaces          |
| **GitHub Integration**   | Auto-create repos with `--github-org` flag       |
| **Base Abstractions**    | 70-80% less code with BaseService/BaseController |
| **Admin UI**             | Config-driven CRUD with Fresh + DaisyUI          |
| **Storefront**           | Public e-commerce site with Fresh + Tailwind     |
| **Type-Safe**            | Full TypeScript from database to API             |
| **JWT Auth**             | Optional authentication system included          |
| **PostgreSQL**           | Three-database setup (dev/test/prod)             |
| **Docker Ready**         | docker-compose included                          |

---

## CLI Commands

```bash
# Create projects
tstack create workspace my-app          # Full workspace (API + Admin UI)
tstack create workspace my-app --github-org=your-org  # With GitHub repos
tstack create workspace my-app --skip-listing  # Skip product listing entities
tstack create api my-api                # API only
tstack create admin-ui my-admin         # Admin UI only
tstack create store my-store            # Storefront only

# Scaffold entities
tstack scaffold products                # Generate full MVC entity

# Destroy projects
tstack destroy my-api                   # Remove project + databases
tstack destroy workspace my-app         # Remove entire workspace
tstack destroy workspace my-app --delete-remote  # Also delete GitHub repos

# Info
tstack list                             # List all tracked projects
tstack --help                           # Show help
tstack --version                        # Show version
```

### Project Tasks

```bash
deno task dev              # Start dev server (with watch)
deno task test             # Run tests
deno task migrate:generate # Generate migrations
deno task migrate:run      # Run migrations
deno task db:seed          # Seed database
deno task db:studio        # Open Drizzle Studio
```

---

## Project Structure

### API Backend

```text
my-project-api/
├── src/
│   ├── main.ts              # App entry point
│   ├── auth/                # JWT authentication (included)
│   ├── config/              # Database & environment config
│   ├── entities/            # Your domain entities
│   │   ├── articles/        # Example entity
│   │   ├── brands/          # Product brands
│   │   ├── categories/      # Product categories
│   │   ├── products/        # Products with variants
│   │   ├── product_images/  # Product image gallery
│   │   ├── product_variants/ # SKU variants (size, color)
│   │   ├── variant_options/ # Variant option values
│   │   ├── site_settings/   # Dynamic app configuration
│   │   └── users/           # User management
│   └── shared/              # Middleware & utilities
├── migrations/              # Drizzle migrations
├── scripts/                 # Seeding scripts
├── deno.json                # Tasks & config
├── docker-compose.yml       # PostgreSQL setup
└── .env.example             # Environment template
```

### Admin UI Frontend

```text
my-project-admin-ui/
├── components/              # Reusable UI components
├── config/                  # Entity configurations
├── entities/                # Entity-specific pages & logic
├── islands/                 # Interactive Preact components
├── lib/                     # API client & utilities
├── routes/                  # Fresh file-based routing
├── static/                  # Static assets
├── main.ts                  # Fresh entry point
├── client.ts                # Client-side entry
├── deno.json                # Tasks & config
└── tailwind.config.ts       # Tailwind + DaisyUI

### Storefront

```text
my-project-store/
├── components/              # Reusable UI components (Hero, Features, etc.)
├── islands/                 # Interactive Preact islands
├── routes/                  # Fresh file-based routing
├── static/                  # Static assets
├── main.ts                  # Fresh entry point
├── deno.json                # Tasks & config
└── vite.config.ts           # Vite + Tailwind
```
```

---

## Tech Stack

| Layer      | Technology               |
| ---------- | ------------------------ |
| Runtime    | Deno 2.6+                |
| Framework  | Hono                     |
| ORM        | Drizzle                  |
| Database   | PostgreSQL 16+           |
| Validation | Zod                      |
| Admin UI   | Fresh + Preact + DaisyUI |
| Storefront | Fresh + Preact + Tailwind|

---

## API Endpoints

### Default Routes

```text
GET  /           # API info
GET  /health     # Health check
```

### After `tstack scaffold products`

**Public API:**

```text
GET    /api/products      # List all
GET    /api/products/:id  # Get one
POST   /api/products      # Create
PUT    /api/products/:id  # Update
DELETE /api/products/:id  # Delete
```

**Admin API (protected):**

```text
GET    /ts-admin/products              # List with pagination/search
POST   /ts-admin/products              # Create
GET    /ts-admin/products/:id          # Get details
PUT    /ts-admin/products/:id          # Update
DELETE /ts-admin/products/:id          # Delete
POST   /ts-admin/products/bulk-delete  # Bulk delete
```

---

## Base Abstractions Pattern

Generated entities use base classes to eliminate boilerplate:

```typescript
// Service - Add custom logic via lifecycle hooks
export class ProductService extends BaseService<Product, CreateDTO, UpdateDTO> {
  protected override async beforeCreate(data: CreateDTO) {
    return { ...data, slug: slugify(data.name) };
  }
}

// Controller - Declarative authorization
export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(productService, "Product", {
      update: {
        requireAuth: true,
        ownershipCheck: (product, userId) => product.ownerId === userId,
      },
    });
  }
}
```

**What you get:**

- Lifecycle hooks: `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`,
  `beforeDelete`, `afterDelete`
- Declarative authorization with ownership checks
- Auto-generated CRUD routes
- Full TypeScript generics

---

## Environment Setup

```bash
# .env
ENVIRONMENT=development
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/my_app_dev
JWT_SECRET=your-secret-key
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=your-password
```

---

## Why TStack?

**The Problem:** Every new backend project means hours spent on folder
structure, CRUD boilerplate, database config, validation, error handling - the
same patterns over and over.

**The Solution:** TStack generates all of this in seconds. Focus on business
logic, not plumbing.

| Without TStack              | With TStack              |
| --------------------------- | ------------------------ |
| 2-4 hours setup per project | Minutes                  |
| Copy-paste CRUD patterns    | `tstack scaffold entity` |
| Manual route registration   | Auto-discovery           |
| Repetitive admin panels     | Config-driven CRUD UI    |

### AI Prompt Savings

If you're using AI assistants to write boilerplate, TStack saves significant
time and money:

| Task                   | Manual AI Prompts | With TStack | Savings  |
| ---------------------- | ----------------- | ----------- | -------- |
| Project setup          | 50-100 prompts    | 1 command   | ~$5-15   |
| Entity scaffold (each) | 15-30 prompts     | 1 command   | ~$2-5    |
| 10-entity project      | 200-400 prompts   | 11 commands | ~$65-165 |

_Estimates based on typical AI coding assistant usage at $0.10-0.25 per prompt
cycle._

### Good Fit

- PostgreSQL-first, type-safe API development
- Fast entity scaffolding with tests included
- JWT auth included by default (ready to use, not forced)
- Clean, modifiable generated code

### Not Ideal For

- GraphQL (REST only)
- Non-Deno runtimes (Node.js coming in v2.0)

---

## Roadmap

### v1.2 (Current) - MVP Kit

- Workspace management (API + Admin UI)
- GitHub integration
- Base abstractions (70-80% less code)
- Fresh Admin UI Kit
- Project tracking with Deno KV

### v1.3 (Q1 2026) - Infrastructure

- Docker multi-environment setup
- Kamal deployment config
- Interactive CLI prompts
- Public UI starter (Next.js/React)

### v2.0 (2026) - Expansion

- Node.js stack support
- Monitoring & observability
- Multi-cloud deployment toolkit
- Mobile admin app (Flutter)

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a pull request

See [issues](https://github.com/desingh-rajan/tstack-kit/issues) for open tasks.

---

## Support

- **Star this repo** - Helps others discover TStack
- **Report bugs** -
  [Open an issue](https://github.com/desingh-rajan/tstack-kit/issues)
- **Sponsor** - [GitHub Sponsors](https://github.com/sponsors/desingh-rajan)

---

## License

MIT License - Free for personal and commercial use.

---

**Links:** [GitHub](https://github.com/desingh-rajan/tstack-kit) |
[Issues](https://github.com/desingh-rajan/tstack-kit/issues) |
[Changelog](CHANGELOG.md)

Built by [Desingh Rajan](https://desinghrajan.in)
