# TStack Kit

[![CI](https://github.com/desingh-rajan/tstack-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/desingh-rajan/tstack-kit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/desingh-rajan/tstack-kit/graph/badge.svg)](https://codecov.io/gh/desingh-rajan/tstack-kit)
[![Version](https://img.shields.io/github/v/release/desingh-rajan/tstack-kit?label=version)](https://github.com/desingh-rajan/tstack-kit/releases)
[![License](https://img.shields.io/github/license/desingh-rajan/tstack-kit)](LICENSE)

> **Ship products, not boilerplate.** A battle-tested, CLI-powered SaaS starter
> kit that scales from portfolio to platform.

---

## Why TStack Kit?

### A CLI That Actually Does the Work

You know how most starter kits work—clone a repo, search-and-replace project
names, update configs by hand, initialize git, create databases manually. That's
not a starter kit. That's a chore list.

**TStack CLI handles all of it:**

- **Smart project creation** - Generates and customizes projects with your
  names, not template placeholders
- **Local + GitHub repos** - Creates repos locally AND on GitHub (with
  `--github-org` flag)
- **State-aware tracking** - Remembers every project you create (stored in local
  Deno KV)
- **Destroy command** - Deletes projects AND drops their databases (no orphaned
  DBs cluttering your Postgres)
- **Entity scaffolding** - Generates models, services, controllers, routes,
  tests, and admin UI configs in one command
- **Multi-project workspaces** - Creates API + Admin + Store and wires them
  together automatically

It's not a template cloner. It's a project generator that thinks.

---

### Stop Building the Same App Over and Over

You've done this before. The auth system. The CRUD boilerplate. The admin panel.
The Docker config. Every new project starts with the same week of setup,
rebuilding what you just built last month.

**Here's what actually happens with TStack:**

| Timeline         | What You Get                                                                |
| ---------------- | --------------------------------------------------------------------------- |
| **⚡ 3 Minutes** | Database is up. Migrations run. Seed data loaded. You're writing features.  |
| **⚡ 1 Hour**    | Your models are mapped. Relations hooked up. Stripe, S3, Resend configured. |
| **⚡ 3 Hours**   | Models tested. Admin panel generated. API endpoints working. Ready to ship. |

---

### Tests That Actually Cover Your Ass

You know what happens when you skip tests. You ship on Friday. Something breaks
Saturday at 2 AM. You don't know why because you never had time to write tests.

**TStack ships with tests built in:**

- **255+ test suite** covering auth, CRUD, admin routes, payment flows
- **70% code coverage** (show me another starter kit with this)
- **Real integration tests** against PostgreSQL—not mocked nonsense (we only
  mock external providers)
- You can actually sleep through the night. We already debugged this stuff.

---

### 10 Years of Framework Experience, One Codebase

This isn't some weekend experiment. TStack distills a decade of building
production systems with Rails, Phoenix, Sinatra, Express, Hono, Node, Deno,
Ruby, and Elixir.

Every pattern here earned its place in production. We took the elegance of
Rails, the resilience of Phoenix, the simplicity of Sinatra, and the raw speed
of Hono—and made them work together in TypeScript.

**Human-readable code. AI-ready architecture.** It's opinionated because
indecision is expensive. It's structured so both you and AI agents can navigate
it without guessing.

---

### Scales With You (Not Against You)

| Your Stage                   | What You Get                                       |
| ---------------------------- | -------------------------------------------------- |
| **Portfolio site**           | Contact forms, content management—done             |
| **Product catalog**          | Listings, categories, admin panel—built in         |
| **E-commerce store**         | Cart, checkout, payments—ready to go               |
| **MVP testing**              | Local Docker development—configured                |
| **Scaling up**               | Architecture designed for microservices extraction |
| **Enterprise multi-service** | Docker orchestration ready                         |

---

### Production Deployment Made Simple _(coming soon)_

**Dockerfile and Kamal configs are in the pipeline.** When they land, you'll
get:

- One-command VPS deployment ($5 DigitalOcean droplets, any cloud provider)
- Automated SSL certificates, traffic routing, rolling deployments
- Zero-downtime updates out of the box
- You write code. Kamal ships it.

_(Currently in development—Docker configs ready, Kamal integration in progress)_

---

### Not Another Template. A Real Foundation

Most starter kits are copy-pasted side projects. This one took 3 months to
architect right. It's test-driven, production-hardened, and built to last.

**This is the starter kit we wish we had 10 years ago.**

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

**Documentation:** [docs/README.md](./docs/README.md) for CLI reference,
scaffolding, admin panel, testing, and architecture guides.

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
- E-commerce entities: Brands, Categories, Products, Variants, Addresses, Carts,
  Orders, Payments

**Control what you get with `--scope`:**

```bash
# Minimal: Just articles and site_settings
tstack create workspace blog --scope=core

# Add product catalog (brands, categories, products, variants)
tstack create workspace shop --scope=listing

# Full e-commerce (listing + cart, orders, payments) - DEFAULT
tstack create workspace store --scope=commerce
```

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

| Feature                  | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| **Entity Scope Control** | `--scope=core/listing/commerce` for progressive builds |
| **Workspace Management** | Create/destroy multi-project workspaces                |
| **GitHub Integration**   | Auto-create repos with `--github-org` flag             |
| **Base Abstractions**    | 70-80% less code with BaseService/BaseController       |
| **Admin UI**             | Config-driven CRUD with Fresh + DaisyUI                |
| **Storefront**           | Public e-commerce site with Fresh + Tailwind           |
| **Type-Safe**            | Full TypeScript from database to API                   |
| **JWT Auth**             | Authentication system included (ready to use)          |
| **RBAC**                 | Role-based access (user/admin/superadmin)              |
| **PostgreSQL**           | Three-database setup (dev/test/prod)                   |
| **255+ Tests**           | 70% coverage with real PostgreSQL integration tests    |
| **Docker Ready**         | docker-compose included                                |

---

## CLI Commands

```bash
# Create projects
tstack create workspace my-app          # Full workspace (API + Admin UI + Store)
tstack create workspace my-app --github-org=your-org  # With GitHub repos
tstack create workspace my-app --scope=core  # Minimal (articles + site_settings)
tstack create workspace my-app --scope=listing  # + product catalog
tstack create workspace my-app --scope=commerce  # + cart & checkout (default)
tstack create api my-api                # API only
tstack create api my-api --scope=core   # Minimal API
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

## GitHub Integration

To use `--github-org` flag for automatic GitHub repository creation:

```bash
# Set your GitHub token (required)
export GITHUB_TOKEN=ghp_your_token_here

# Add to ~/.bashrc or ~/.zshrc to persist
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.bashrc
```

Create token at https://github.com/settings/tokens with `repo` and `delete_repo` scopes.

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
│   │   ├── articles/        # Blog/CMS content (core)
│   │   ├── site_settings/   # Dynamic app configuration (core)
│   │   ├── brands/          # Product brands (listing)
│   │   ├── categories/      # Product categories (listing)
│   │   ├── products/        # Products with variants (listing)
│   │   ├── product_images/  # Product image gallery (listing)
│   │   ├── product_variants/ # SKU variants (size, color) (listing)
│   │   ├── variant_options/ # Variant option values (listing)
│   │   ├── addresses/       # User shipping addresses (commerce)
│   │   ├── carts/           # Shopping carts (commerce)
│   │   ├── orders/          # Order management (commerce)
│   │   ├── payments/        # Payment processing (commerce)
│   │   └── users/           # User management (always included)
│   └── shared/              # Middleware & utilities
├── migrations/              # Drizzle migrations
├── scripts/                 # Seeding scripts
├── deno.json                # Tasks & config
├── docker-compose.yml       # PostgreSQL setup
└── .env.example             # Environment template
```

### Admin UI Frontend

````text
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
````

````
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
````

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
# .env.development.local
ENVIRONMENT=development
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/my_app_dev
JWT_SECRET=your-64-char-hex-secret
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=your-secure-password

# Optional: Email (Resend for quick setup)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev

# Optional: Payments (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx

# Optional: File Uploads (S3)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=your-bucket
```

**See [docs/environment-variables.md](docs/environment-variables.md) for
complete reference.**

---

## Good Fit

- PostgreSQL-first, type-safe API development
- Fast entity scaffolding with tests included
- JWT auth included by default (ready to use, not forced)
- Clean, modifiable generated code

## Not Ideal For

- GraphQL (REST only)
- Non-Deno runtimes (Node.js coming in v2.0)

---

## Roadmap

### v1.3 (Current) - Entity Scope Control

- `--scope` flag for progressive entity inclusion (core/listing/commerce)
- Workspace management (API + Admin UI + Store)
- GitHub integration with `--github-org`
- Base abstractions (70-80% less code)
- Fresh Admin UI Kit with config-driven CRUD
- Project tracking with Deno KV
- 255+ tests with 70% coverage

### v1.4 (Q1 2026) - Infrastructure

- Docker multi-environment setup
- Kamal deployment config
- Interactive CLI prompts
- Storefront enhancements

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
