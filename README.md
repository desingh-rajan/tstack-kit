# TStack Kit

> **Rails-like backend toolkit for Deno. Build APIs fast.**

A minimal, production-ready starter for building type-safe REST APIs with Deno,
Hono, Drizzle ORM, and PostgreSQL.

---

## What is TStack?

**TonyStack is a backend scaffolding toolkit** - like what Vite does for
frontend, but for Deno backend APIs.

- **Vite** → Scaffolds React/Vue/Svelte projects (frontend)
- **TStack** → Scaffolds Deno REST API projects (backend)

Think of it as **"Rails generators for Deno"** or **"Laravel Artisan for
minimalists"**. Instead of writing boilerplate CRUD code repeatedly, TStack
generates complete, production-ready entities (models, controllers, routes,
DTOs) with a single command.

**One command** → Full MVC entity with database migrations → **Start building
your business logic**

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
- **TypeScript first** - Full type safety from database to API responses
- **Consistency** - Every entity follows the same proven patterns
- **Focus on problems, not plumbing** - Stop fighting with tools, stop being a
  CRUD monkey - ship features that matter
- **Production ready** - Includes error handling, logging, validation out of the
  box
- **No vendor lock-in** - Generated code is yours to modify freely

### Default Stack (v1.0)

TStack currently uses this proven stack:

- **Runtime**: Deno 2.0+
- **Framework**: Hono
- **ORM**: Drizzle
- **Database**: PostgreSQL

This is the **default and recommended stack** for new projects. It's fast,
type-safe, and production-ready.

### Future: Choose Your Stack

Coming soon, you'll be able to scaffold with different stacks using simple
flags:

```bash
# Current (default) - Deno + Hono + Drizzle + PostgreSQL
tstack create my-api

# Long form (explicit)
tstack create my-api --runtime=bun --orm=drizzle --db=sqlite
tstack create my-api --runtime=node --orm=prisma --db=mysql

# Short form (quick and easy)
tstack create my-api --stack=bds  # Bun + Drizzle + SQLite
tstack create my-api --stack=npm  # Node + Prisma + MySQL
tstack create my-api --stack=dhp  # Deno + Hono + PostgreSQL (default)
```

**Examples:**

- `dhp` → Deno + Hono + PostgreSQL (default)
- `bds` → Bun + Drizzle + SQLite
- `npm` → Node + Prisma + MySQL
- `nes` → Node + Express + SQLite
- `dss` → Deno + Sequelize + SQLite

**Planned stack support:**

- **Runtimes**: Node.js, Bun
- **Frameworks**: Express, Fastify, Fresh
- **ORMs**: Prisma, Sequelize, TypeORM
- **Databases**: MySQL, SQLite, MongoDB

**Your contributions are welcome!** Whether you're fixing bugs, adding features,
or porting to new stacks - this toolkit grows with the community.

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

```bash
# Create new project
tstack create blog-api
cd blog-api

# Start PostgreSQL
docker-compose up -d postgres

# Generate and run migrations
deno task migrate:generate
deno task migrate:run

# Start dev server
deno task dev
```

Server running at **<http://localhost:8000>**

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
tstack create <project>     # Create new project
tstack scaffold <entity>    # Generate entity
tstack destroy <project>    # Remove project and drop databases
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

**Site Settings** (Dynamic Configuration):

- `GET /site-settings` - List all public settings
- `GET /site-settings/:idOrKey` - Get setting by ID or key
- `POST /site-settings` - Create setting (superadmin only)
- `PUT /site-settings/:id` - Update setting (superadmin only)
- `DELETE /site-settings/:id` - Delete setting (superadmin only)

**Articles** (Example Content Entity):

- `GET /api/articles` - List published articles
- `GET /api/articles/:id` - Get article by ID
- `POST /api/articles` - Create article (auth required)
- `PUT /api/articles/:id` - Update own article
- `DELETE /api/articles/:id` - Delete own article
- `GET /admin/articles` - List all articles (superadmin only)

### Scaffolded Entity Endpoints

After `tstack scaffold products`:

- `GET /api/products` - List all
- `GET /api/products/:id` - Get one
- `POST /api/products` - Create
- `PUT /api/products/:id` - Update
- `DELETE /api/products/:id` - Delete

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

| Setting        | Public    | Use Case                                  |
| -------------- | --------- | ----------------------------------------- |
| site_info      | [SUCCESS] | Site name, tagline, logo - display in UI  |
| contact_info   | [SUCCESS] | Email, phone, social links - contact page |
| theme_config   | [SUCCESS] | Colors, fonts - apply to frontend theme   |
| feature_flags  | [SUCCESS] | Toggle features - enable/disable features |
| email_settings | [ERROR]   | SMTP config - backend email sending       |
| api_config     | [ERROR]   | Rate limits, CORS - API configuration     |

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

### Destroy Command

When you no longer need a project, the `tstack destroy` command safely removes:

- Project directory and all files
- Development database
- Test database

**Basic Usage:**

```bash
# Destroy with confirmation prompt
tstack destroy blog-api

# Type the project name to confirm: blog-api
```

**Force Destruction (Skip Confirmation):**

```bash
# Skip confirmation prompt
tstack destroy blog-api --force
```

**What Gets Deleted:**

1. **Project Directory**: The entire project folder (searched in current
   directory and ~/projects)
2. **Development Database**: `{project_name}_db` (hyphens replaced with
   underscores)
3. **Test Database**: `{project_name}_test_db`

**Examples:**

```bash
# Create and destroy a test project
tstack create test-api
tstack destroy test-api

# Project: my-blog-api
# Deletes directory: my-blog-api/
# Drops database: my_blog_api_db
# Drops test DB: my_blog_api_test_db
```

**Safety Features:**

- Requires typing project name exactly for confirmation (unless --force)
- Shows what will be deleted before proceeding
- Searches in both current directory and ~/projects
- Provides clear error messages if project not found

**Note**: Docker Compose services must be stopped separately if running:

```bash
# Stop Docker services before destroying project
cd my-blog-api
docker-compose down -v
cd ..
tstack destroy my-blog-api
```

---

## Is TStack For You?

### Perfect If You Want

- [SUCCESS] **Zero auth bloat** - Add authentication when YOU need it
- [SUCCESS] **PostgreSQL first** - No SQLite native binding issues
- [SUCCESS] **Minimal defaults** - Clean starting point
- [SUCCESS] **Pure Deno** - No Node.js baggage
- [SUCCESS] **Fast scaffolding** - Generate entities in seconds

### Not Ideal If You Need

- [ERROR] Batteries-included auth out of the box (add it yourself!)
- [ERROR] GraphQL support (REST only for now)
- [ERROR] All-in-one framework (this is a toolkit)

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

### v1.0 (Current - October 2025)

- [SUCCESS] Auto-discovery route system
- [SUCCESS] PostgreSQL support with proper .env loading
- [SUCCESS] Entity scaffolding with interface templates
- [SUCCESS] Docker ready
- [SUCCESS] Minimal starter with common columns helper
- [SUCCESS] Fail-fast configuration

### v1.1 (Next - Q4 2025)

- [ ] **Kamal deployment** - YAML setup with deployment instructions
- [ ] **GitHub Copilot integration** - Custom instructions for TonyStack
- [SUCCESS] **`tstack destroy` command** - Remove scaffolded entities
- [SUCCESS] **Basic JWT authentication** - User entity with auth system
  (optional addon)

### v1.2 (Q1 2026)

- [ ] **Multi-stack support**:
  - [ ] Node.js + Drizzle + Express
  - [ ] Node.js + Sequelize + Express
  - [ ] Node.js + Sequelize + Hono
  - [ ] Node.js + Drizzle + Hono

### v2.0 (Future)

#### Must Have (Solo Developer Essentials)

- [ ] **Database seeding** - `tstack seed` command with faker integration
- [ ] **Migration rollback** - `deno task migrate:rollback`
- [ ] **Environment management** - `tstack env` for multi-environment configs
      (.env.dev, .env.staging, .env.prod)
- [ ] **Quick CRUD testing** - Auto-generate Thunder Client / REST Client
      collections
- [ ] **Error tracking integration** - Easy Sentry/Rollbar setup

#### Good to Have (Productivity Boosters)

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
