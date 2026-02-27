# TStack Kit

[![CI](https://github.com/desingh-rajan/tstack-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/desingh-rajan/tstack-kit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/desingh-rajan/tstack-kit/branch/main/graph/badge.svg)](https://codecov.io/gh/desingh-rajan/tstack-kit)
[![Version](https://img.shields.io/github/v/release/desingh-rajan/tstack-kit?label=version)](https://github.com/desingh-rajan/tstack-kit/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![JSR @tstack/admin](https://jsr.io/badges/@tstack/admin)](https://jsr.io/@tstack/admin)

**A production-ready Deno full-stack foundation.** CLI-driven. Security
hardened. Ship products, not boilerplate.

- **3 services in 3 minutes** -- API + Admin Panel + Storefront, pre-wired
- **Auth included** -- JWT, OAuth (Google/Facebook), RBAC, password reset
- **E-commerce ready** -- Products, cart, guest checkout, Razorpay payments,
  order tracking
- **Security hardened** -- Rate limiting, input validation, pinned deps, scoped
  permissions
- **360+ tests** -- Real PostgreSQL integration tests across all packages
- **Docker multi-env** -- Dev (hot reload), test, prod -- auto-generated with
  Dozzle logs

---

## Try It Now

```bash
# Requires: Deno 2.6+, PostgreSQL 16+, Docker (optional)

# Install CLI (10 seconds)
curl -fsSL https://raw.githubusercontent.com/desingh-rajan/tstack-kit/main/install.sh | sh

# Create a full-stack workspace
tstack create workspace my-shop
cd my-shop
```

Every workspace ships with three ways to run your stack:

```bash
# Option 1: Local dev (no Docker)
deno task dev                # runs all services with concurrently

# Option 2: Docker dev (hot reload)
./start-dev.sh               # all services in containers, code changes reload
./start-dev.sh --with-db     # same + containerised PostgreSQL

# Option 3: Docker production (lightweight)
./start-prod.sh              # multi-stage alpine builds, no dev deps
./start-prod.sh --with-db    # same + containerised PostgreSQL
```

Setup your database and start building:

```bash
cd my-shop-api
deno task migrate:generate   # Generate migrations from schema
deno task migrate:run        # Apply migrations
deno task db:seed            # Seed superadmin + demo data
```

---

## Architecture

```
my-shop/
├── my-shop-api/              # Hono + Drizzle + PostgreSQL
├── my-shop-admin/            # Fresh + DaisyUI admin panel
├── my-shop-store/            # Fresh + Tailwind storefront
├── my-shop-status/           # Health status page
├── docker-compose.dev.yml    # Hot-reload dev containers
├── docker-compose.test.yml   # Production images + test DB
├── docker-compose.yml        # Production images + prod DB
├── start-dev.sh              # ./start-dev.sh [--with-db]
├── start-test.sh             # ./start-test.sh [--with-db]
├── start-prod.sh             # ./start-prod.sh [--with-db]
├── stop.sh                   # Stop all Docker services
└── deno.json                 # deno task dev (no Docker)
```

Each workspace creates 3 databases (dev/test/prod), initializes git with
`main`/`staging`/`dev` branches, generates Docker configuration, and wires all
services together.

---

## Why TStack

**TStack is not a static template.** It is a CLI-managed development lifecycle.

| Command                          | What Happens                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `tstack create workspace my-app` | **Full Stack**: API + Admin + Store, databases created, git initialized      |
| `tstack create api my-api`       | **Zero-Config API**: Database ready, auth wired, secure defaults             |
| `tstack scaffold product`        | **Vertical Slice**: Model, service, routes, tests, admin UI -- all generated |
| `tstack destroy my-app`          | **Clean Teardown**: Project removed, databases dropped, no orphans           |
| `./start-dev.sh`                 | **Docker Dev**: All services in containers with hot reload + Dozzle logs     |
| `./start-prod.sh`                | **Docker Prod**: Multi-stage alpine builds, production-ready                 |

The CLI tracks every project via Deno KV. Create 10 projects, destroy 5 -- your
system stays clean.

**Development velocity:**

| Timeline      | State                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| **3 minutes** | Database up. Migrations run. Seed data loaded. Dev server running.         |
| **1 hour**    | Models mapped. Relations configured. Payments and email wired.             |
| **3 hours**   | Full test coverage. Admin panel generated. API complete. Production ready. |

Built on proven patterns from Rails, Phoenix, and Hono -- refined for
TypeScript. Opinionated structure that both developers and AI agents can
navigate predictably.

---

## What You Get

### One Command, Full Stack

```bash
tstack create workspace my-shop
```

Creates three connected projects with:

- JWT authentication + OAuth (Google, Facebook)
- Role-based access control (user / admin / superadmin)
- Built-in entities: Users, Articles, Site Settings, Enquiries
- E-commerce: Brands, Categories, Products, Variants, Cart, Orders, Payments

**Control scope with `--scope`:**

```bash
tstack create workspace blog --scope=core       # Articles, site settings, enquiries
tstack create workspace shop --scope=listing     # + product catalog
tstack create workspace store --scope=commerce   # + cart, orders, payments (default)
```

### Entity Scaffolding

```bash
tstack scaffold products
```

Generates a complete vertical slice in seconds:

```
product.model.ts          # Drizzle schema
product.dto.ts            # Zod validation
product.service.ts        # Business logic with lifecycle hooks
product.controller.ts     # HTTP handlers with auth rules
product.route.ts          # Public API routes
product.admin.route.ts    # Admin panel routes
product.test.ts           # Integration tests
product.admin.test.ts     # Admin API tests
```

Entity automatically appears in the Admin UI sidebar.

---

## Features

| Feature                  | Description                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| **Security Hardened**    | Rate limiting, SQL injection prevention, JWT strict mode, pinned deps, scoped Dockerfile |
| **Open Redirect Guard**  | `isSafeRedirect()` on all auth redirects, constant-time webhook signature verification   |
| **390+ Tests**           | Real PostgreSQL integration tests (CLI: 235, Admin: 83, API: 50)                         |
| **Guest Checkout**       | Full purchase flow without account creation                                              |
| **Order Tracking**       | Public order lookup by email + order number                                              |
| **Entity Scopes**        | `--scope=core/listing/commerce` for progressive builds                                   |
| **Base Abstractions**    | 80% less CRUD code with BaseService / BaseController                                     |
| **Admin UI**             | Config-driven CRUD with Fresh + DaisyUI                                                  |
| **Storefront**           | E-commerce frontend with Fresh + Tailwind                                                |
| **JWT + OAuth**          | Authentication + Google/Facebook OAuth + password reset                                  |
| **RBAC**                 | Role-based access (user / admin / superadmin)                                            |
| **Email System**         | Order notifications, admin alerts, verification emails                                   |
| **Workspace Management** | Create/destroy multi-project workspaces with database lifecycle                          |
| **GitHub Integration**   | Auto-create repos with `--github-org`; pushes main/staging/dev                           |
| **Kamal Deployment**     | One-command production deployment via `tstack infra`                                     |
| **Docker Multi-Env**     | Dev (hot reload), test (E2E), prod (alpine) -- auto-generated per workspace              |
| **Dozzle Logs**          | Real-time Docker log viewer at `localhost:9999` in every compose environment             |
| **Health Checks**        | `/health` endpoint on all services                                                       |
| **Advanced Pagination**  | Filterable tables with date pickers, search, and sorting                                 |

---

## Security

v1.6 includes a comprehensive security audit across all packages:

- **Rate limiting** on all auth routes (login, register, password reset)
- **SQL injection prevention** -- quoted identifiers in all dynamic SQL
- **JWT strict mode** -- no fallback secret; throws if `JWT_SECRET` unset in
  production
- **OAuth redirect allowlist** -- validated redirect URIs + HttpOnly cookies
- **Per-request API client** -- prevents auth token leakage between concurrent
  SSR requests
- **Pinned dependency versions** -- no `^` caret ranges, fully deterministic
  builds
- **Scoped Dockerfile permissions** -- granular `--allow-*` flags replace
  `--allow-all`
- **Request ID tracing** -- `X-Request-ID` header on every request/response
- **Input validation** -- NaN guards on all `parseInt()`, Zod schemas on all
  mutations
- **DB transactions** -- order and payment mutations wrapped in transactions
- **Open redirect prevention** -- `isSafeRedirect()` validates all auth redirect
  URLs (v1.6.1)
- **Secure cookies** -- `Secure` flag on session cookies in production (v1.6.1)
- **Constant-time signature verification** -- `timingSafeEqual` for Razorpay
  webhook signatures (v1.6.1)
- **NoOp payment guard** -- NoOp payment provider throws in production (v1.6.1)

---

## CLI Reference

```bash
# Create
tstack create workspace my-app                    # Full stack
tstack create workspace my-app --github-org=org   # With GitHub repos
tstack create workspace my-app --scope=core       # Minimal scope
tstack create api my-api                          # API only
tstack create admin-ui my-admin                   # Admin UI only
tstack create store my-store                      # Storefront only
tstack create status my-status                    # Status page only

# Destroy
tstack destroy my-api                             # Remove project + databases
tstack destroy workspace my-app                   # Remove entire workspace
tstack destroy workspace my-app --delete-remote   # Also delete GitHub repos

# Info
tstack list                                       # List tracked projects
tstack --version                                  # Show version
tstack --help                                     # Show help
```

**GitHub integration** requires a `GITHUB_TOKEN` env var with `repo` and
`delete_repo` scopes. Create one at <https://github.com/settings/tokens>.

**Project tasks** (run inside any created project):

```bash
deno task dev              # Dev server with hot reload
deno task test             # Run tests
deno task migrate:generate # Generate migrations from schema changes
deno task migrate:run      # Apply migrations
deno task db:seed          # Seed database
deno task db:studio        # Open Drizzle Studio
```

---

## Project Structure

### API

```text
my-project-api/
├── src/
│   ├── main.ts              # App entry + health check
│   ├── auth/                # JWT auth + OAuth providers
│   ├── config/              # Database & environment config
│   ├── entities/            # Domain logic (entity-per-folder)
│   │   ├── users/           # User management (always included)
│   │   ├── articles/        # Blog/CMS content (core)
│   │   ├── site_settings/   # Runtime config (core)
│   │   ├── products/        # Product catalog (listing)
│   │   ├── categories/      # Taxonomy (listing)
│   │   ├── brands/          # Brand management (listing)
│   │   ├── carts/           # Shopping cart (commerce)
│   │   ├── orders/          # Order processing (commerce)
│   │   └── payments/        # Payment handling (commerce)
│   └── shared/              # Middleware & base classes
├── migrations/              # Drizzle migrations
├── scripts/                 # Seed scripts
├── docker-compose.yml       # PostgreSQL setup
└── .env.example             # Environment template
```

### Admin UI

```text
my-project-admin-ui/
├── components/              # DataTable, ShowPage, GenericForm
├── config/entities/         # Entity configs (1 file per entity)
├── entities/                # Entity services & types
├── islands/                 # Interactive components (DatePicker, ImageUpload)
├── lib/                     # API client, auth helpers
├── routes/admin/            # CRUD routes per entity
└── tailwind.config.ts       # Tailwind + DaisyUI
```

### Storefront

```text
my-project-store/
├── components/              # Navbar, Hero, Footer
├── islands/                 # CartButton, ContactForm
├── lib/
│   ├── api.ts               # API client (SSR-aware, guest methods)
│   └── auth.ts              # Auth helpers (requireAuth, optionalAuth)
├── routes/
│   ├── _middleware.ts        # Session + cart resolution
│   ├── track-order.tsx       # Public order tracking
│   ├── checkout/             # Guest + authenticated checkout
│   └── api/                  # Server-side proxy routes
└── vite.config.ts           # Vite + Tailwind
```

---

## Base Abstractions

Generated entities inherit base classes that eliminate 80% of boilerplate:

```typescript
// Service -- lifecycle hooks for custom logic
export class ProductService extends BaseService<Product, CreateDTO, UpdateDTO> {
  protected override async beforeCreate(data: CreateDTO) {
    return { ...data, slug: slugify(data.name) };
  }
}

// Controller -- declarative authorization
export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(productService, "Product", {
      update: {
        requireAuth: true,
        ownershipCheck: (product, userId) => product.ownerId === userId,
      },
      delete: { requireRole: "admin" },
    });
  }
}
```

Lifecycle hooks: `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`,
`beforeDelete`, `afterDelete`. Full TypeScript generics throughout.

---

## Tech Stack

| Layer      | Technology                |
| ---------- | ------------------------- |
| Runtime    | Deno 2.6+                 |
| Framework  | Hono (API)                |
| ORM        | Drizzle                   |
| Database   | PostgreSQL 16+            |
| Validation | Zod                       |
| Admin UI   | Fresh + Preact + DaisyUI  |
| Storefront | Fresh + Preact + Tailwind |

---

## Environment Setup

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/my_app_dev
JWT_SECRET=your-64-char-hex-secret           # Required in production (no fallback)
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=your-secure-password

# Optional integrations
RESEND_API_KEY=re_xxxxxxxxxxxx               # Email (Resend)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx        # Payments (Razorpay)
AWS_ACCESS_KEY_ID=AKIA...                    # File uploads (S3)
```

See [docs/environment-variables.md](docs/environment-variables.md) for the full
reference including database pool tuning (`DB_POOL_SIZE`, `DB_IDLE_TIMEOUT`,
`DB_CONNECT_TIMEOUT`, `DB_MAX_LIFETIME`).

---

## Docker Development

Every `tstack create workspace` generates a complete Docker setup with three
environments:

| Environment | Command           | Purpose                                       | Ports                               |
| ----------- | ----------------- | --------------------------------------------- | ----------------------------------- |
| **Dev**     | `./start-dev.sh`  | Hot-reload containers, source-mounted volumes | API: 8000, Admin: 5173, Store: 5174 |
| **Test**    | `./start-test.sh` | Production images with test database          | API: 8000, Admin: 3001, Store: 3002 |
| **Prod**    | `./start-prod.sh` | Lightweight multi-stage alpine builds         | API: 8000, Admin: 3001, Store: 3002 |

All environments include Dozzle (Docker log viewer) at `http://localhost:9999`
and a status page at `http://localhost:8001`.

### PostgreSQL: Host or Container

By default, Docker services connect to your host machine's PostgreSQL -- the
databases TStack already created for you. No duplication, no data sync issues.

Need a fully isolated environment? Pass `--with-db`:

```bash
./start-dev.sh --with-db     # Spins up postgres:16-alpine alongside services
./start-test.sh --with-db    # Test DB on port 5433 (avoids conflict with dev)
```

### Non-Docker Local Dev

Every workspace also gets a root `deno.json` with a `dev` task that uses
`concurrently` to run all services locally without Docker:

```bash
cd my-shop
deno task dev                # Runs api + admin + store + status in parallel
deno task dev:api             # Run just the API
deno task dev:admin           # Run just the admin UI
deno task dev:store           # Run just the storefront
```

### Stopping Services

```bash
./stop.sh                    # Stops all Docker services across all environments
```

---

## Running Tests

All three packages have test suites with real PostgreSQL integration tests.

```bash
# CLI (225 tests, no database required for default suite)
cd packages/cli && deno task test

# Admin (83 tests, requires PostgreSQL)
cd packages/admin && PGUSER=your_user PGPASSWORD=your_pass deno task test

# API Starter (35 tests / 601 steps, requires PostgreSQL + .env.test.local)
cd packages/api-starter && deno task test
```

See [docs/testing-guide.md](docs/testing-guide.md) for setup details,
environment variables, and troubleshooting.

---

## When NOT to Use TStack

- **NoSQL requirements** -- TStack is PostgreSQL-only. No MongoDB/Firebase.
- **Client-side SPA** -- TStack uses Fresh (SSR + Islands) for performance and
  SEO, not client-heavy SPAs.

---

## Roadmap

### v1.5 (January 2026) -- Shipped

- Password reset and email verification
- Facebook OAuth provider
- Advanced pagination with filters
- Order notification email templates
- `tstack infra` command for Kamal deployment setup
- Legal policy page templates
- Performance optimizations (connection pooling, N+1 fixes)

### v1.6 (February 2026) -- Shipped

- Security hardening: 9-block audit (SQL injection, JWT strict mode, OAuth
  allowlist, rate limiting, scoped Dockerfile, DB transactions)
- Guest checkout and order tracking (full stack)
- Email and notification system (refund, admin alerts)
- 360+ tests across all packages, all passing
- Per-request API client (SSR auth isolation)
- Error pages (`_error.tsx`) and health endpoints
- Pinned dependency versions across all packages
- CLI robustness (partial workspace tracking, better error handling)

### v1.6.1 (February 2026) -- Shipped

- Open redirect prevention (`isSafeRedirect()`) on all auth routes
- Secure cookie flag on session cookies in production
- Constant-time webhook signature verification (`timingSafeEqual`)
- NoOp payment provider guard (throws in production)
- N+1 query fix in `getUserOrders` (single `GROUP BY` query)
- Deterministic entity route registration (sorted `readDir`)
- `EnvFileBuilder` utility replacing regex-based .env manipulation
- Migration tooling: `db:migrate:status`, `db:migrate:rollback`,
  `db:migrate:check`
- SEO routes: `robots.txt` and `sitemap.xml` for storefront
- CLI KV store fixes: `kvPath` passthrough, OCC for `updateWorkspace`
- 390+ tests across all packages (CLI: 235, Admin: 83, API: 50)

### v1.6.2 (February 2026) -- Shipped

- Self-hosted status page (`packages/status-starter`): Hono + Deno KV, 90-day
  uptime history, dark/light theme toggle, server-rendered, no build step
- `tstack create status` command -- scaffold a status page project
- Status page included as default component in every `tstack create workspace`
- Per-service configurable health check paths (`API_HEALTH_PATH`, etc.)
- `/health` routes added to storefront and admin-ui templates
- Comprehensive Kamal multi-service deployment guide in `docs/deployment.md`

### v1.6.4 (February 2026) -- Shipped

- Docker multi-environment workspace generation: dev (hot reload), test
  (production images + test DB), prod (multi-stage alpine builds)
  ([#43](https://github.com/desingh-rajan/tstack-kit/issues/43))
- Shell scripts (`start-dev.sh`, `start-test.sh`, `start-prod.sh`, `stop.sh`)
  with `--with-db` flag for opt-in containerised PostgreSQL
- Dozzle real-time Docker log viewer in every compose environment
- Workspace root `deno.json` with `concurrently` for non-Docker local dev
- Dockerfiles for all starter packages (dev + production multi-stage builds)
- Netdata metrics monitoring section in deployment guide
  ([#41](https://github.com/desingh-rajan/tstack-kit/issues/41))

### v1.7 (Q2 2026)

- Playwright E2E tests for storefront and admin UI
  ([#84](https://github.com/desingh-rajan/tstack-kit/issues/84))
- Integer vs UUID column support
  ([#65](https://github.com/desingh-rajan/tstack-kit/issues/65))
- Test coverage improvements
  ([#71](https://github.com/desingh-rajan/tstack-kit/issues/71))

### v2.0 (2026)

- Multi-cloud deployment toolkit
  ([#40](https://github.com/desingh-rajan/tstack-kit/issues/40))
- Mobile admin app (Flutter)
  ([#39](https://github.com/desingh-rajan/tstack-kit/issues/39))
- Cross-platform GUI (Tauri)
  ([#69](https://github.com/desingh-rajan/tstack-kit/issues/69))
- CDN provider support
  ([#62](https://github.com/desingh-rajan/tstack-kit/issues/62))
- AWS Cognito auth provider
  ([#60](https://github.com/desingh-rajan/tstack-kit/issues/60))

See [GitHub Releases](https://github.com/desingh-rajan/tstack-kit/releases) for
detailed release notes.

---

## Cheatsheet

| Format                       | Download                                                              |
| ---------------------------- | --------------------------------------------------------------------- |
| Landscape (3-column, A4)     | [tstack-cheatsheet.pdf](docs/tstack-cheatsheet.pdf)                   |
| Portrait (single-column, A4) | [tstack-cheatsheet-portrait.pdf](docs/tstack-cheatsheet-portrait.pdf) |

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a pull request

See [open issues](https://github.com/desingh-rajan/tstack-kit/issues) for tasks
to pick up.

---

## Support

- [Star this repo](https://github.com/desingh-rajan/tstack-kit) -- helps others
  discover TStack
- [Report bugs](https://github.com/desingh-rajan/tstack-kit/issues) -- open an
  issue
- [Sponsor](https://github.com/sponsors/desingh-rajan) -- support development

---

## License

MIT -- free for personal and commercial use.

---

[GitHub](https://github.com/desingh-rajan/tstack-kit) | [Docs](./docs/README.md)
| [Releases](https://github.com/desingh-rajan/tstack-kit/releases) |
[Issues](https://github.com/desingh-rajan/tstack-kit/issues)

Built by [Desingh Rajan](https://desinghrajan.in)
