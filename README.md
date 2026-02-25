# TStack Kit

[![CI](https://github.com/desingh-rajan/tstack-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/desingh-rajan/tstack-kit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/desingh-rajan/tstack-kit/graph/badge.svg)](https://codecov.io/gh/desingh-rajan/tstack-kit)
[![Version](https://img.shields.io/github/v/release/desingh-rajan/tstack-kit?label=version)](https://github.com/desingh-rajan/tstack-kit/releases)
[![License](https://img.shields.io/github/license/desingh-rajan/tstack-kit)](LICENSE)

> **A Production-Ready Deno Full-Stack Foundation.**
>
> A CLI-driven architecture for shipping products, not managing boilerplate.
> Designed for velocity, correctness, and scale.

## Try it now

```bash
# Install CLI (takes 10 seconds)
curl -fsSL https://raw.githubusercontent.com/desingh-rajan/tstack-kit/main/install.sh | sh

# Create a full-stack workspace
tstack create workspace my-shop
cd my-shop/my-shop-api

# Setup database (PostgreSQL must be running)
deno task migrate:generate  # Generate migrations from schema
deno task migrate:run       # Apply migrations
deno task db:seed           # Seed superadmin + demo data

# Start the stack (in separate terminals)
deno task dev                         # API:   localhost:8000
cd ../my-shop-admin && deno task dev  # Admin: localhost:5173
cd ../my-shop-store && deno task dev  # Store: localhost:5174
```

---

## System Architecture

```
my-shop/
├── my-shop-api/      # Hono + Drizzle + PostgreSQL
├── my-shop-admin/    # Fresh + DaisyUI admin panel
└── my-shop-store/    # Fresh + Tailwind storefront
```

- Database created and migrated
- JWT auth + OAuth (Google) ready
- Admin panel with CRUD for all entities
- E-commerce: Products, Cart, Orders, Payments
- Guest checkout with order tracking
- 255+ tests included (70% coverage)

---

## The TStack Philosophy

**TStack is not a static template.** It is a CLI-managed development lifecycle.

| Command                          | Outcome                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `tstack create api my-app`       | **Zero-Config API**: Database ready, git initialized, secure defaults.  |
| `tstack create workspace my-app` | **Integrated Monorepo**: API + Admin + Store, pre-wired.                |
| `tstack scaffold product`        | **Vertical Slice**: Model, service, routes, tests, UI config—generated. |
| `tstack destroy my-app`          | **Clean Teardown**: Project removed, database dropped. No orphans.      |

The CLI maintains state via Deno KV, ensuring a deterministic project lifecycle.
Create 10 projects, destroy 5—your system remains clean.

---

### Eliminate Redundant Engineering

The authentication flow, the CRUD operations, the admin dashboard—these are
solved problems. TStack standardizes the foundation so you can focus on your
unique domain logic.

**Development Velocity:**

| Timeline      | Operational State                                                                    |
| ------------- | ------------------------------------------------------------------------------------ |
| **3 Minutes** | **Active Development**. Database up. Migrations run. Seed data loaded.               |
| **1 Hour**    | **Business Logic**. Models mapped. Relations hooked up. Payments & Email configured. |
| **3 Hours**   | **Production Candidate**. Full test coverage. Admin panel generated. API complete.   |

---

### Battle-Tested Patterns

Built on proven patterns from Rails, Phoenix, and Hono—refined for TypeScript.
Opinionated structure that both developers and AI agents can navigate
predictably.

---

### Scalable by Design

| Your Stage                   | Architectural Guarantee                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| **Portfolio site**           | **Minimal Footprint**. Contact forms, content management included.                    |
| **Product catalog**          | **Structured Data**. Listings, categories, admin panel built-in.                      |
| **E-commerce store**         | **Transaction Ready**. Carts, checkout (guest + registered), payments pre-configured. |
| **MVP testing**              | **Containerized**. Local Docker development fully configured.                         |
| **Scaling up**               | **Modular**. Architecture designed for microservices extraction.                      |
| **Enterprise multi-service** | **Orchestration Ready**. Docker compose and future k8s paths aligned.                 |

---

### Production Deployment (In Development)

**Robust Infrastructure via Kamal.**

- **One-Command Deploy**: Push to any VPS or Cloud Provider.
- **Zero-Downtime**: Rolling updates and automated traffic routing.
- **SSL Automation**: Managed certificate provisioning.

_(Docker configurations ready; Kamal integration compliant with v1.4 roadmap)_

---

### Architectural Integrity

Most starter kits are assemblies of disparate parts. TStack is an engineered
system. It is test-driven, production-hardened, and designed to provide a
cohesive developer experience from CLI to Cloud.

**The foundation we wish we had.**

**Docs:** [docs/README.md](./docs/README.md) | **Issues:**
[GitHub](https://github.com/desingh-rajan/tstack-kit/issues)

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
- Git initialized with `main`, `staging`, and `dev` branches
- JWT authentication (included by default)
- Role-based access control (user/admin/superadmin)
- Built-in entities: Users, Articles, Site Settings
- E-commerce entities: Brands, Categories, Products, Variants, Addresses, Carts,
  Orders, Payments

**Control what you get with `--scope`:**

```bash
# Minimal: articles, site_settings, enquiries
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

| Feature                  | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| **Entity Scope Control** | `--scope=core/listing/commerce` for progressive builds                 |
| **Workspace Management** | Create/destroy multi-project workspaces                                |
| **GitHub Integration**   | Auto-create repos with `--github-org`; pushes `main`, `staging`, `dev` |
| **Base Abstractions**    | 70-80% less code with BaseService/BaseController                       |
| **Admin UI**             | Config-driven CRUD with Fresh + DaisyUI                                |
| **Storefront**           | Public e-commerce site with Fresh + Tailwind                           |
| **Guest Checkout**       | Full purchase flow without account creation (guest orders + payments)  |
| **Order Tracking**       | Public order lookup by email + order number                            |
| **Type-Safe**            | Full TypeScript from database to API                                   |
| **JWT Auth**             | Authentication system + password reset flow                            |
| **OAuth Providers**      | Google & Facebook OAuth integration ready                              |
| **RBAC**                 | Role-based access (user/admin/superadmin)                              |
| **PostgreSQL**           | Three-database setup (dev/test/prod)                                   |
| **Advanced Pagination**  | Filterable tables with date pickers & search                           |
| **Email Templates**      | Order notifications (confirmation, processing, shipped, delivered)     |
| **Kamal Deployment**     | One-command production deployment via `tstack infra`                   |
| **255+ Tests**           | 70% coverage with real PostgreSQL integration tests                    |
| **Docker Ready**         | docker-compose included with internal networking support               |
| **Health Checks**        | `/health` endpoint on all services for container orchestration         |

---

## CLI Commands

```bash
# Create projects
tstack create workspace my-app          # Full workspace (API + Admin UI + Store)
tstack create workspace my-app --github-org=your-org  # With GitHub repos
tstack create workspace my-app --scope=core  # Minimal (articles, site_settings, enquiries)
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

## Running Tests

Three packages have test suites: `cli`, `admin`, and `api-starter`.

### CLI (no database required)

```bash
cd packages/cli && deno task test
```

The default CLI test suite mocks all database operations. To run the full
integration suite that actually creates/destroys real databases:

```bash
cd packages/cli
TSTACK_TEST_DB=true PGUSER=your_user PGPASSWORD=your_password deno task test:db
```

#### Leftover test databases

If a test run is interrupted, test databases may be left behind. Clean them up
with:

```bash
cd packages/cli
PGUSER=your_user PGPASSWORD=your_password deno task cleanup:test-dbs
```

### Admin

Requires a local PostgreSQL server. Tests default to user `postgres` with
password `password`. If your local PostgreSQL uses a different user:

```bash
cd packages/admin
PGUSER=your_user PGPASSWORD=your_password deno task test
```

### API Starter

Requires a local PostgreSQL server. Before running tests, create a
`.env.test.local` file (gitignored) with your database credentials:

```bash
cd packages/api-starter
cp .env.example .env.test.local
```

Edit `.env.test.local`:

```dotenv
ENVIRONMENT=test
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/tstack_starter_test
```

Then run:

```bash
deno task test
```

> **Common pitfalls**:
>
> - Tests fail with "password authentication failed" → wrong PostgreSQL
>   credentials. Update `PGUSER`/`PGPASSWORD` (CLI, admin) or `DATABASE_URL` in
>   `.env.test.local` (api-starter).
> - Tests fail with `role "postgres" does not exist` → your system's default
>   PostgreSQL user is not `postgres`. Pass your actual username via `PGUSER`.
> - `api-starter` tests fail with "no such file or directory" for
>   `.env.test.local` → run `cp .env.example .env.test.local` and set your
>   credentials.
> - The test runner creates and destroys test databases automatically. You only
>   need a PostgreSQL user with `CREATEDB` privileges.

---

## GitHub Integration

To use `--github-org` flag for automatic GitHub repository creation:

```bash
# Set your GitHub token (required)
export GITHUB_TOKEN=ghp_your_token_here

# Add to ~/.bashrc or ~/.zshrc to persist
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.bashrc
```

Create token at <https://github.com/settings/tokens> with `repo` and
`delete_repo` scopes.

When using `--github-org`, TStack automatically creates and pushes three
branches (`main`, `staging`, `dev`) to each remote repository — ready for a
standard branching workflow out of the box.

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
├── components/              # Reusable UI components (Navbar, Hero, Footer)
├── islands/                 # Interactive Preact islands
├── lib/
│   ├── api.ts               # API client (SSR_API_URL, guest methods)
│   └── auth.ts              # Auth helpers (requireAuth, optionalAuth, guest ID)
├── routes/                  # Fresh file-based routing
│   ├── _middleware.ts        # Session + cart resolution
│   ├── track-order.tsx       # Public order tracking
│   ├── checkout/             # Guest + authenticated checkout
│   └── api/                  # Server-side proxy routes
├── static/                  # Static assets
├── main.ts                  # Fresh entry + /health endpoint
├── deno.json                # Tasks & config
└── vite.config.ts           # Vite + Tailwind
````

````
---

## Tech Stack

| Layer      | Technology               |
| ---------- | ------------------------ |
| Runtime    | Deno 2.6.4+              |
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

## Built for Serious Founders

- **Production-Grade Architecture**: Layered architecture
  (Controller-Service-Data) that scales.
- **Full-Stack Type Safety**: Types flow from your database schema directly to
  your API and frontend.
- **Business-First**: Comes with real e-commerce primitives (Carts, Orders), not
  just "Hello World".
- **No Vendor Lock-in**: Deploy anywhere Deno runs (VPS, Edge, Docker).

## When NOT to use TStack

- **NoSQL Requirements**: We firmly believe in relational data (PostgreSQL). No
  Mongo/Firebase support.
- **Single Page Applications (SPA)**: We use Fresh (Server-Side Rendering +
  Islands) for better performance and SEO, not client-side heavy SPAs.

---

## Roadmap

### v1.5 (February 2026) ✅ Shipped

- ✅ Password reset & email verification
- ✅ Facebook OAuth provider
- ✅ Advanced pagination with filters
- ✅ Order notification email templates
- ✅ `tstack infra` command for Kamal deployment setup
- ✅ Legal policy page templates
- ✅ Performance optimizations (connection pooling, N+1 fixes)

### v1.6 (Q2 2026) - Admin Enhancements

- Interactive order status updates
- Site settings integration with email templates
- Enhanced product management UI
- Payment method feature flags

### v2.0 (2026) - Expansion

- Node.js stack support
- Monitoring & observability
- Multi-cloud deployment toolkit
- Mobile admin app (Flutter)

See [GitHub Releases](https://github.com/desingh-rajan/tstack-kit/releases) for
detailed release notes.

---

## Cheatsheet

Quick-reference PDFs covering all CLI commands, flags, Deno tasks, routes, env
vars and deployment — no need to re-read the docs.

| Format                       | Download                                                              |
| ---------------------------- | --------------------------------------------------------------------- |
| Landscape (3-column, A4)     | [tstack-cheatsheet.pdf](docs/tstack-cheatsheet.pdf)                   |
| Portrait (single-column, A4) | [tstack-cheatsheet-portrait.pdf](docs/tstack-cheatsheet-portrait.pdf) |

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
[Releases](https://github.com/desingh-rajan/tstack-kit/releases)

Built by [Desingh Rajan](https://desinghrajan.in)
