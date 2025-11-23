# TStack Kit

> **Full-stack SaaS MVP toolkit for Deno. Ship products, not boilerplate.**

From API to deployment in minutes - a complete toolkit for building type-safe
SaaS applications with Deno, Hono, Drizzle ORM, Fresh, and PostgreSQL.

**Project Evolution:**

- ✅ **v1.0** - Starter Kit (Single API project scaffolding)
- 🔥 **v1.2** - MVP Kit (Multi-project workspaces with API + Admin UI)
- 🚀 **v2.0** - SaaS Kit (Add payments, mobile, infrastructure, deployment)

---

## What is TStack?

**TStack is evolving from a backend toolkit into a complete SaaS MVP launcher.**

**Current State (v1.2 - MVP Kit):**

- 🎯 **Single Project**: `tstack create` - API scaffolding with auth, CRUD,
  testing
- 🚀 **Workspaces**: `tstack workspace create` - Multi-project setup (API +
  Admin UI + GitHub)
- ⚡ **Entity Generation**: `tstack scaffold` - Complete MVC with tests in
  seconds

**Think of it as:**

- **Create React App** + **T3 Stack** → but for **full-stack Deno SaaS
  products**
- **Rails generators** + **Laravel Artisan** → but **workspace-aware and
  deployment-ready**

**One command to:**

1. Create backend API (Deno + Hono + Drizzle)
2. Create admin dashboard (Fresh + Preact)
3. Initialize Git repos with initial commits
4. Push to GitHub organization
5. Set up databases (dev/test/prod)

**Then scaffold entities:**

- `tstack scaffold products` → Model, Service, Controller, Routes, Admin Routes,
  Tests (8 files)
- Focus on **business logic**, not plumbing

---

## Why TStack?

### The Problem

Every time you start a new backend project, you waste hours on:

- Setting up the same folder structure
- Writing repetitive CRUD boilerplate
- Configuring database connections and migrations
- Setting up validation, error handling, and logging
- Copy-pasting controller/service patterns from old projects

**This toolkit was born from frustration.** After building dozens of APIs with
the same patterns, it became clear: **stop rewriting, start generating**.

### What TStack Solves

- **Saves 2-4 hours per project** - Skip the setup, start coding features
- **Saves $5-15 in AI costs per project** - Stop burning tokens on repetitive
  boilerplate. One `tstack create` command replaces ~50-100 AI prompts for
  setup, architecture, and CRUD scaffolding
- **Saves $2-5 per entity** - Each `tstack scaffold` saves ~15-30 AI prompts
  that developers typically waste asking for the same CRUD patterns, validation
  schemas, and controller boilerplate
- **TypeScript first** - Full type safety from database to API responses
- **Consistency** - Every entity follows the same proven patterns
- **Focus on problems, not plumbing** - Stop fighting with tools, stop being a
  CRUD monkey - ship features that matter
- **Production ready** - Includes error handling, logging, validation out of the
  box
- **No vendor lock-in** - Generated code is yours to modify freely

**Real savings example:** A typical project with 10 entities could save
$65-165 in AI costs ($15 setup + $50 for 10 scaffolds) plus 25-50 hours of token
wait time and prompt engineering.

### Default Stack (v1.0)

TStack currently uses this proven stack:

- **Runtime**: Deno 2.0+
- **Framework**: Hono
- **ORM**: Drizzle
- **Database**: PostgreSQL

This is the **default and recommended stack** for new projects. It's fast,
type-safe, and production-ready.

### Future: Multi-Runtime Support

Coming in v2.0 (2026):

- **Node.js + Express + Prisma + PostgreSQL/SQLite** - Full-stack support with
  both databases

The Deno + Hono + Drizzle + PostgreSQL stack will remain the flagship and
recommended choice. As a solo developer, I'm focusing on polishing the Deno
stack first before expanding to other runtimes. Other combinations (Bun,
Fastify, etc.) may be added based on community demand.

**Contributing:** If you'd like to contribute support for additional stacks,
please open an issue or discussion first to coordinate with maintainers.

Built by [Desingh Rajan](https://desinghrajan.in) and
[contributors](https://github.com/desingh-rajan/tstack-kit/graphs/contributors)

---

## Features

- **Fast Setup** - Create new projects in seconds
- **CLI Scaffolding** - Generate complete MVC entities with one command
- 🔒 **Type-Safe** - Full TypeScript with Drizzle ORM
- **PostgreSQL** - Production-ready from day 1
- 🐳 **Docker Ready** - Includes docker-compose setup
- 🎨 **Clean MVC** - Organized entity structure
- **Minimal** - No auth bloat, add what you need

---

## Quick Start

### 1. Install Deno

```bash
curl -fsSL https://deno.land/install.sh | sh
```

### 2. Install TStack CLI

```bash
# Clone the repo
git clone https://github.com/desingh-rajan/tstack-kit.git
cd tstack-kit

# Install CLI globally (default: prompts for permissions at runtime)
cd packages/cli
deno task install

# Or skip permission prompts (if you trust the CLI)
deno install --allow-all --global --name tstack --config deno.json mod.ts
```

**Default:** CLI asks for permission (y/n/A) when needed - safer for first-time
users. **Skip prompts:** Use `--allow-all` if you don't want interruptions
during project creation.

### 3. Create Your First Project

**Option A: Single API Project (Traditional)**

```bash
# Create new project
tstack create blog-api
cd blog-api

# Start PostgreSQL
docker-compose up -d

# Generate and run migrations
deno task migrate:generate
deno task migrate:run

# Start dev server
deno task dev
```

Server running at **<http://localhost:8000>**

**What you get:**

- ✅ Complete API project with Deno + Hono + Drizzle
- ✅ JWT authentication system (optional, ready to use)
- ✅ 3 databases created: `blog_api_dev`, `blog_api_test`, `blog_api_prod`
- ✅ Built-in entities: Users, Articles, Site Settings
- ✅ Docker Compose setup
- ✅ Migration system
- ✅ Testing framework (BDD-style)

**Option B: Full Workspace (API + Admin UI)**

```bash
# Create workspace with multiple projects
tstack workspace create my-saas
cd my-saas

# Each project has its own folder:
# - my-saas-api/        (Backend API)
# - my-saas-admin-ui/   (Admin Dashboard)

# Start API
cd my-saas-api
docker-compose up -d
deno task migrate:generate
deno task migrate:run
deno task dev  # Port 8000

# Start Admin UI (in another terminal)
cd my-saas-admin-ui
deno task dev  # Port 5173
```

**With GitHub Integration:**

```bash
# Create workspace + push to GitHub organization
tstack workspace create my-saas --github-org=your-company

# Creates:
# - Local folders: my-saas-api/, my-saas-admin-ui/
# - GitHub repos: your-company/my-saas-api, your-company/my-saas-admin-ui
# - Git initialized + initial commit + pushed to remote
# - All tracked in workspace metadata
```

---

## Workspace Management

### Create Workspace

Create a workspace with multiple projects (api, admin-ui, etc.):

```bash
# Create workspace with default components (api + admin-ui)
tstack workspace create my-app

# Create workspace with specific components
tstack workspace create my-app --with-api --with-admin-ui

# Create workspace with only API
tstack workspace create my-app --with-api

# Create workspace and skip admin-ui
tstack workspace create my-app --skip-admin-ui

# Create workspace with GitHub repos
tstack workspace create my-app --github-org=your-org

# Create workspace locally only (skip GitHub)
tstack workspace create my-app --github-org=your-org --skip-remote
```

### Workspace Structure

```text
my-app/
├── my-app-api/          # Backend API (Deno + Hono + Drizzle)
│   └── .git/           # Initialized with initial commit
└── my-app-admin-ui/    # Admin dashboard (Fresh + Preact)
    └── .git/           # Initialized with initial commit
```

### Destroy Workspace

```bash
# Destroy workspace (removes projects and databases)
tstack workspace destroy my-app

# Force destroy (skip confirmation)
tstack workspace destroy my-app --force

# Destroy workspace and delete GitHub repos
tstack workspace destroy my-app --delete-remote
```

**What gets deleted:**

- Project directories and all files
- Development databases (`{project}_dev`)
- Test databases (`{project}_test`)
- Production databases (`{project}_prod`)
- Remote GitHub repositories (if `--delete-remote` specified)
- Workspace metadata from tracking database

---

## Scaffold Entities

Generate complete MVC structures:

```bash
# Scaffold articles entity
tstack scaffold articles

# This creates (7 files by default):
# [OK] src/entities/articles/article.model.ts         (Drizzle schema)
# [OK] src/entities/articles/article.dto.ts           (Zod validation)
# [OK] src/entities/articles/article.service.ts       (Business logic)
# [OK] src/entities/articles/article.controller.ts    (HTTP handlers)
# [OK] src/entities/articles/article.route.ts         (Public routes: /articles)
# [OK] src/entities/articles/article.admin.route.ts   (Admin API: /ts-admin/articles)
# [OK] src/entities/articles/article.test.ts          (API tests)
# [OK] src/entities/articles/article.admin.test.ts    (Admin tests)
```

### Customize the Model

Edit `src/entities/articles/article.model.ts`:

```typescript
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const articles = pgTable("articles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text().notNull(),
  content: text(),
  published: boolean().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Register Routes

Edit `src/main.ts`:

```typescript
import articleRoutes from "./entities/articles/article.route.ts";

app.route("/api", articleRoutes);
```

### Run Migrations

```bash
deno task migrate:generate
deno task migrate:run
```

---

## Project Structure

```text
my-project/
├── src/
│   ├── main.ts              # App entry point
│   ├── auth/                # JWT authentication (optional)
│   ├── config/
│   │   ├── database.ts      # PostgreSQL connection
│   │   └── env.ts           # Environment config
│   ├── entities/            # Your domain entities
│   │   ├── articles/        # Example: Blog/content entity
│   │   ├── site_settings/   # Built-in: Dynamic app configuration
│   │   └── users/           # Built-in: User management
│   └── shared/
│       ├── middleware/      # Error handling, logging
│       └── utils/           # Response, validation helpers
├── migrations/              # Drizzle migrations
├── scripts/                 # Database seeding scripts
├── tests/                   # Colocated test files
├── deno.json               # Deno configuration & tasks
├── drizzle.config.ts       # Drizzle config
├── docker-compose.yml      # PostgreSQL setup
└── .env.example            # Environment template
```

### Built-in Entities

TStack starter includes reference entities out of the box:

1. **Articles** - Example blog/content entity with authorization
   - Public read access
   - Protected write operations (auth required)
   - Author-based permissions

2. **Site Settings** - Dynamic configuration system
   - Key-value storage with JSONB
   - Public/private setting separation
   - Frontend-accessible configuration API
   - Default settings: site_info, contact_info, theme_config, feature_flags,
     email_settings, api_config

3. **Users** - User management & JWT authentication
   - Registration and login
   - Role-based access (user, superadmin)
   - Password hashing with Argon2

**Seeding Built-in Data:**

```bash
# Seed all default data
deno task db:seed

# Or individually:
deno task db:seed:superadmin   # Create superadmin user
deno task db:seed:alpha        # Create test user
deno task db:seed:site         # Create default site settings
```

---

## Available Commands

### TStack CLI

```bash
# Project commands
tstack create <project>     # Create new project
tstack destroy <project>    # Remove project and drop databases

# Workspace commands
tstack workspace create <name>   # Create workspace with multiple projects
tstack workspace destroy <name>  # Remove workspace, projects, and databases

# Scaffolding
tstack scaffold <entity>    # Generate entity (model, controller, routes, tests)

# Help
tstack --help              # Show help
tstack --version           # Show version
```

### Project Commands

```bash
deno task dev              # Start development server (with watch)
deno task start            # Start production server
deno task migrate:generate # Generate migrations
deno task migrate:run      # Run migrations
deno task db:studio        # Open Drizzle Studio
deno task test             # Run tests
deno task fmt              # Format code
deno task lint             # Lint code
```

---

## Tech Stack

| Layer      | Technology | Version |
| ---------- | ---------- | ------- |
| Runtime    | Deno       | 2.5.4+  |
| Framework  | Hono       | 4.6.3   |
| ORM        | Drizzle    | 0.33.0  |
| Database   | PostgreSQL | 16+     |
| Validation | Zod        | 3.23.0  |

---

## Environment Variables

```bash
# .env
ENVIRONMENT=development
PORT=8000
DATABASE_URL=postgresql://tonystack:password@localhost:5432/tonystack
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=info
```

---

## Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

Set environment variables:

```bash
export ENVIRONMENT=production
export DATABASE_URL=postgresql://user:pass@host:5432/db
```

Then:

```bash
docker-compose --profile prod up -d
```

---

## What You Get

### Default Endpoints

- `GET /` - API information
- `GET /health` - Health check

### Built-in Entity Endpoints

TStack starter includes these pre-built endpoints:

**Site Settings** (Dynamic Configuration) - Public API:

- `GET /site-settings` - List all public settings
- `GET /site-settings/:idOrKey` - Get setting by ID or key

**Site Settings Admin API** - Protected Endpoints:

- `GET /ts-admin/site-settings` - List all settings (superadmin only)
- `GET /ts-admin/site-settings/:id` - Get specific setting (superadmin only)
- `POST /ts-admin/site-settings` - Create setting (superadmin only)
- `PUT /ts-admin/site-settings/:id` - Update setting (superadmin only)
- `DELETE /ts-admin/site-settings/:id` - Delete setting (superadmin only)

**Articles** (Example Content Entity) - Public API:

- `GET /api/articles` - List published articles
- `GET /api/articles/:id` - Get article by ID
- `POST /api/articles` - Create article (auth required)
- `PUT /api/articles/:id` - Update own article
- `DELETE /api/articles/:id` - Delete own article

**Articles Admin API** - Protected Endpoints:

- `GET /ts-admin/articles` - List all articles (superadmin/admin only)
- `GET /ts-admin/articles/:id` - Get article (superadmin/admin only)
- `POST /ts-admin/articles` - Create article (superadmin/admin only)
- `PUT /ts-admin/articles/:id` - Update article (superadmin/admin only)
- `DELETE /ts-admin/articles/:id` - Delete article (superadmin/admin only)
- `POST /ts-admin/articles/bulk-delete` - Bulk delete (superadmin/admin only)

### Scaffolded Entity Endpoints

After `tstack scaffold products`:

**Public API** (`/api/products`):

- `GET /api/products` - List all
- `GET /api/products/:id` - Get one
- `POST /api/products` - Create
- `PUT /api/products/:id` - Update
- `DELETE /api/products/:id` - Delete

**Admin API** (`/ts-admin/products`) - Protected:

- `GET /ts-admin/products` - List all products with pagination/search
  (superadmin/admin)
- `GET /ts-admin/products/new` - Get new product form metadata
  (superadmin/admin)
- `POST /ts-admin/products` - Create product (superadmin/admin)
- `GET /ts-admin/products/:id` - Get product details (superadmin/admin)
- `GET /ts-admin/products/:id/edit` - Get edit form metadata (superadmin/admin)
- `PUT /ts-admin/products/:id` - Update product (superadmin/admin)
- `PATCH /ts-admin/products/:id` - Partial update (superadmin/admin)
- `DELETE /ts-admin/products/:id` - Delete product (superadmin/admin)
- `POST /ts-admin/products/bulk-delete` - Bulk delete products
  (superadmin/admin)

---

## Using Site Settings

### Frontend Configuration

Site settings provide a dynamic configuration API for your frontend:

```typescript
// Fetch public configuration at app startup
const config = await fetch("http://localhost:8000/site-settings")
  .then((res) => res.json());

// Use configuration in your app
const { site_info, theme_config, feature_flags } = config;

// Apply theme
document.documentElement.style.setProperty(
  "--primary-color",
  theme_config.primaryColor,
);

// Toggle features
if (feature_flags.enableComments) {
  renderComments();
}

// Display site info
document.title = site_info.siteName;
```

### Backend Configuration

Access private settings (not exposed to frontend):

```typescript
import { SiteSettingService } from "./entities/site_settings/site-setting.service.ts";

// Get email configuration
const emailConfig = await SiteSettingService.getByKey("email_settings");
sendEmail({
  host: emailConfig.value.smtp_host,
  port: emailConfig.value.smtp_port,
});

// Get API rate limits
const apiConfig = await SiteSettingService.getByKey("api_config");
const maxRequests = apiConfig.value.rateLimit.maxRequests;
```

### Default Settings

Run `deno task db:seed:site` to create 6 default settings:

| Setting        | Public | Use Case                                  |
| -------------- | ------ | ----------------------------------------- |
| site_info      | Yes    | Site name, tagline, logo - display in UI  |
| contact_info   | Yes    | Email, phone, social links - contact page |
| theme_config   | Yes    | Colors, fonts - apply to frontend theme   |
| feature_flags  | Yes    | Toggle features - enable/disable features |
| email_settings | No     | SMTP config - backend email sending       |
| api_config     | No     | Rate limits, CORS - API configuration     |

**Updating Settings:**

```bash
# Via API (superadmin required)
curl -X PUT http://localhost:8000/site-settings/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": {"siteName": "Updated Name"}}'

# Or modify scripts/seed-site-settings.ts and re-run
deno task db:seed:site
```

---

## Example: Building a Blog API

```bash
# 1. Create project
tstack create blog-api && cd blog-api

# 2. Start PostgreSQL
docker-compose up -d postgres

# 3. Scaffold entities
tstack scaffold articles
tstack scaffold comments
tstack scaffold categories

# 4. Customize models
# Add title, content, etc. to article.model.ts

# 5. Register routes in main.ts

# 6. Generate and run migrations
deno task migrate:generate
deno task migrate:run

# 7. Start server
deno task dev
```

Done! You have a working blog API.

---

## Removing Projects

### Destroy Single Project

When you no longer need a single API project:

```bash
# Destroy with confirmation prompt
tstack destroy blog-api

# Force destroy (skip confirmation)
tstack destroy blog-api --force
```

**What Gets Deleted:**

- ✅ Project directory and all files
- ✅ Development database (`blog_api_dev`)
- ✅ Test database (`blog_api_test`)
- ✅ Production database (`blog_api_prod`)
- ✅ Project metadata from tracking database

**Safety Features:**

- Requires typing project name exactly for confirmation (unless `--force`)
- Shows what will be deleted before proceeding
- Searches in current directory and `~/projects`
- Clear error messages if project not found

### Destroy Workspace

When you no longer need a workspace with multiple projects:

```bash
# Destroy workspace (local only)
tstack workspace destroy my-saas

# Force destroy (skip confirmation)
tstack workspace destroy my-saas --force

# Destroy workspace + delete GitHub repos
tstack workspace destroy my-saas --delete-remote

# Force destroy + delete GitHub repos
tstack workspace destroy my-saas --force --delete-remote
```

**What Gets Deleted:**

- ✅ All project directories (`my-saas-api/`, `my-saas-admin-ui/`)
- ✅ All databases for each project (dev/test/prod per project)
- ✅ Workspace directory
- ✅ Workspace metadata from tracking database
- ✅ Remote GitHub repositories (if `--delete-remote` specified)

**Example Workflow:**

```bash
# Create workspace with GitHub repos
tstack workspace create demo --github-org=my-company
# Creates: my-company/demo-api, my-company/demo-admin-ui on GitHub

# Later, destroy everything including GitHub repos
tstack workspace destroy demo --delete-remote
# Deletes: Local folders + databases + GitHub repos
```

**⚠️ Warning:**

- `tstack destroy` - Deletes 3 databases (dev/test/prod)
- `tstack workspace destroy` - Deletes 3 databases **per project** (6 total for
  API + Admin UI)
- `--delete-remote` - Permanently deletes GitHub repositories

Make sure to backup any important data before running these commands.

---

## Is TStack For You?

### Perfect If You Want

- ✅ **Zero auth bloat** - Authentication included but optional, add what you
  need
- ✅ **PostgreSQL first** - No SQLite native binding issues
- ✅ **Minimal defaults** - Clean, opinionated starting point
- ✅ **Pure Deno** - No Node.js baggage (or use Node.js stack in future)
- ✅ **Fast scaffolding** - Generate complete entities in seconds
- ✅ **Type-safe** - Full TypeScript from database to API responses
- ✅ **Save time and money** - Reduces development time by 2-4 hours per
  project, saves $5-15 in AI/token costs per project, and $2-5 per entity
  scaffold

> **💰 Cost Savings:** TStack eliminates repetitive boilerplate setup, reducing
> AI prompts and token usage significantly. Developers save approximately **2-4
> hours of setup time** and **$5-15 in AI credits** per new project, plus **$2-5
> per entity** scaffolded. This adds up to substantial savings over multiple
> projects.

### Not Ideal If You Need

- ❌ GraphQL support (REST API only)
- ❌ All-in-one batteries-included framework (this is a toolkit - you build what
  you need)
- ❌ Immediate support for all runtime/framework combinations (Deno + Hono is
  currently the only stack)

---

## Development Workflow

1. **Create** - `tstack create my-api`
2. **Scaffold** - `tstack scaffold products`
3. **Customize** - Edit models, add fields
4. **Generate** - `deno task migrate:generate`
5. **Migrate** - `deno task migrate:run`
6. **Test** - `curl http://localhost:8000/api/products`
7. **Deploy** - `docker-compose up -d`

---

## Roadmap

### v1.2 (Current - November 2025) - MVP Kit ✅

**Workspace Management (Completed) ✅**

- ✅ `tstack workspace create` - Multi-project setup (API + Admin UI)
- ✅ Component flags: `--with-api`, `--with-admin-ui`, `--skip-*`
- ✅ GitHub integration: `--github-org` auto-creates and pushes repos
- ✅ `--skip-remote` flag for local-only development
- ✅ `tstack workspace destroy` with `--delete-remote` option
- ✅ Git initialization per project with initial commits
- ✅ Workspace metadata tracking in KV store
- ✅ Comprehensive test suite (12 tests: 7 local + 5 GitHub)

**Single Project (Existing) ✅**

- ✅ `tstack create` - API scaffolding
- ✅ `tstack destroy` - Project + database cleanup
- ✅ `tstack scaffold` - Entity generation with MVC pattern
- ✅ Auto-discovery route system
- ✅ PostgreSQL with three-database setup (dev/test/prod)
- ✅ JWT authentication system (optional)
- ✅ Rails-style `--skip-*` flags for scaffold
- ✅ BDD-style testing framework
- ✅ Site settings with JSON schema validation
- ✅ Docker Compose setup

**In Progress**

- 🔄 **Base Service/Controller Refactoring** (#45) - 85% code reduction per
  entity
- 🔄 **Fresh Admin UI Kit** (#44) - Config-driven CRUD interface

### v1.3 (Q1 2026) - Infrastructure & Deployment

- [ ] **Docker Support** (#43) - Multi-environment Dockerfile setup
- [ ] **Kamal Deployment** (#7) - Production-ready deployment config
- [ ] **Interactive Create** (#37) - CLI prompts for project setup
- [ ] **Public UI Kit** - Next.js/React frontend starter

### v1.3 (Q2 2026) - Communication & Integration

- [ ] **Email Service** (#10) - SMTP + external provider support
- [ ] **Contact Forms** (#11) - Email notification module
- [ ] **Redis Integration** (#9) - Caching and job queue
- [ ] **OAuth Login** (#34) - Gmail, GitHub authentication
- [ ] **Feature Opt-out** (#38) - Post-creation feature management

### v2.0 (2026) - Multi-Runtime & Expansion

- [ ] **Node.js Stack** - Express + Prisma + PostgreSQL/SQLite
- [ ] **Metrics Kit** (#41) - Monitoring, observability, Grafana
- [ ] **Infra Kit** (#40) - Multi-cloud deployment toolkit
- [ ] **Flutter Kit** (#39) - Super admin mobile app
- [ ] **Database Seeding** - Enhanced seeding with faker
- [ ] **Migration Rollback** - `deno task migrate:rollback`

- [ ] **Relationship scaffolding** - `tstack relate articles comments`
      (auto-setup foreign keys)
- [ ] **API versioning** - `/api/v1`, `/api/v2` structure generator
- [ ] **Pagination helper** - Built-in cursor/offset pagination utilities
- [ ] **Rate limiting** - Simple middleware for API throttling
- [ ] **CORS presets** - Quick configs for common scenarios
- [ ] **Health checks** - Enhanced monitoring endpoints (DB, Redis, external
      APIs)
- [ ] **Background jobs** - Simple task queue (BullMQ integration)

#### Awesome to Have (Game Changers)

- [ ] **Live reload API docs** - Auto-generated Swagger UI from routes/DTOs
- [ ] **Database GUI** - Built-in web interface for data management (better than
      Drizzle Studio)
- [ ] **API playground** - Interactive testing UI (like GraphiQL but for REST)
- [ ] **Deployment presets** - One-command deploy to Railway, Fly.io, Render,
      DigitalOcean
- [ ] **Monitoring dashboard** - Real-time API metrics, logs, performance
- [ ] **CLI plugins system** - `tstack plugin add stripe` for common
      integrations
- [ ] **Database backup/restore** - `tstack db:backup`, `tstack db:restore`
- [ ] **Multi-tenancy support** - Tenant isolation helpers for SaaS apps

#### Nice to Have (Polish)

- [ ] **File upload helpers** - S3, Cloudinary, local storage abstractions
- [ ] **Email templates** - Transactional email system (welcome, reset password,
      etc.)
- [ ] **WebSocket rooms** - Real-time features scaffolding
- [ ] **Search integration** - Elasticsearch/Meilisearch helpers
- [ ] **Cache layer** - Redis integration with decorators
- [ ] **Testing utilities** - Test generators for entities
- [ ] **i18n support** - Multi-language response helpers
- [ ] **Audit logging** - Automatic change tracking for entities
- [ ] **Database choice flag** - `--db=postgres|mysql|sqlite`

---

## Contributing

Found a bug? Want to add a feature?

1. Fork the repo
2. Create a feature branch
3. Submit a pull request

---

## For Core Maintainers

### Quick Reference: Managing Issues & Project Board

#### Create a New Issue

```bash
# Feature request
gh issue create \
  --title "Feature: Your feature title" \
  --label "type:feature,priority:medium,area:cli" \
  --body "## Problem
Describe the problem

## Proposed Solution
Your solution

## Success Criteria
- [ ] Item 1
- [ ] Item 2"

# Bug report
gh issue create \
  --title "Bug: Something is broken" \
  --label "type:bug,priority:high" \
  --body "## Bug Description
What's broken

## Steps to Reproduce
1. Step 1
2. Step 2

## Expected Behavior
What should happen

## Actual Behavior
What actually happens"
```

#### Add Issue to Project Board

```bash
# After creating an issue, add it to the project board
gh project item-add 2 --owner desingh-rajan --url https://github.com/desingh-rajan/tstack-kit/issues/NUMBER
```

#### Available Labels

- **Type**: `type:feature`, `type:bug`
- **Priority**: `priority:high`, `priority:medium`, `priority:low`
- **Area**: `area:cli`, `area:auth`, `area:docs`

#### Working on an Issue

```bash
# 1. Assign to yourself
gh issue edit NUMBER --add-assignee @me

# 2. Create branch
git checkout -b feature/NUMBER-short-description

# 3. Work on it and commit
git commit -m "feat: your changes

Closes #NUMBER"

# 4. Push and create PR
git push origin feature/NUMBER-short-description
gh pr create --title "feat: Your PR title" --body "Closes #NUMBER"

# 5. Merge when ready
gh pr merge --squash --delete-branch
```

#### View Project Board

```bash
# List all issues
gh issue list

# View issues assigned to you
gh issue list --assignee @me

# View project board
open https://github.com/users/desingh-rajan/projects/2
```

---

## License

MIT License - Free for personal and commercial use.

---

## Links

- **GitHub**: <https://github.com/desingh-rajan/tstack-kit>
- **Issues**: <https://github.com/desingh-rajan/tstack-kit/issues>
- **Deno**: <https://deno.land>
- **Hono**: <https://hono.dev>
- **Drizzle**: <https://orm.drizzle.team>

---

Built with for the Deno community

Clean, Fast, Simple.
