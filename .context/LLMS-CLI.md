# TStack CLI - Complete Reference

> **For AI Agents, LLMs, and Developers**: This is the exhaustive reference for
> the `tstack` CLI tool. Every command, flag, interface, and behavior is
> documented here.

**Source Code**: [packages/cli/src/](packages/cli/src/)

---

## Table of Contents

- [Installation](#installation)
- [Command Overview](#command-overview)
- [tstack create](#tstack-create)
  - [create api](#create-api)
  - [create admin-ui](#create-admin-ui)
  - [create store](#create-store)
  - [create workspace](#create-workspace)
- [tstack scaffold](#tstack-scaffold)
- [tstack destroy](#tstack-destroy)
- [tstack list](#tstack-list)
- [tstack upgrade](#tstack-upgrade)
- [tstack versions](#tstack-versions)
- [tstack templates](#tstack-templates)
- [Project Tracking (Deno KV)](#project-tracking-deno-kv)
- [Naming Conventions](#naming-conventions)
- [Template Files Generated](#template-files-generated)

---

## Installation

```bash
# Install globally from JSR
deno install --global --allow-read --allow-write --allow-env --allow-run --allow-net --unstable-kv -n tstack jsr:@tonystack/cli

# Or with shorthand flags
deno install -gArf --unstable-kv -n tstack jsr:@tonystack/cli

# Verify installation
tstack --version
tstack --help
```

**Required Permissions**:

| Permission      | Reason                                  |
| --------------- | --------------------------------------- |
| `--allow-read`  | Read starter templates and config files |
| `--allow-write` | Create project files and directories    |
| `--allow-env`   | Access environment variables            |
| `--allow-run`   | Execute git, psql, docker commands      |
| `--allow-net`   | Fetch latest versions, GitHub API       |
| `--unstable-kv` | Project tracking with Deno KV           |

**Local Development** (from repo):

```bash
cd packages/cli
deno task install  # Installs locally with all permissions
```

---

## Command Overview

```bash
tstack <command> [options]

Commands:
  create <type> <name>    Create a new project
  scaffold <entity>       Generate entity files (model, service, controller, etc.)
  destroy [type] <name>   Remove a project and its databases
  list                    List all tracked projects
  upgrade [version]       Upgrade CLI to latest or specific version
  versions                List available CLI versions
  templates               Show available starter templates

Global Options:
  --help, -h              Show help
  --version, -v           Show version
```

---

## tstack create

Creates new projects from starter templates.

**Source**:
[packages/cli/src/commands/create.ts](packages/cli/src/commands/create.ts)

### Syntax

```bash
tstack create <type> <name> [options]
```

### Project Types

- `api` - API backend only
- `admin-ui` - Admin dashboard only
- `store` - Storefront only
- `workspace` - Full stack (API + Admin UI + Store)

### Common Options

| Flag                 | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `--scope=<level>`    | Entity scope level: `core`, `listing`, `commerce` (default: `commerce`) |
| `--dir=<path>`       | Parent directory for project (default: current directory)               |
| `--github-org=<org>` | Create GitHub repositories under organization                           |
| `--skip-db-setup`    | Skip database creation and migrations                                   |
| `--skip-git`         | Skip git initialization                                                 |
| `--skip-seed`        | Skip database seeding                                                   |
| `--skip-admin`       | (workspace only) Skip admin UI creation                                 |
| `--skip-store`       | (workspace only) Skip storefront creation                               |

### Entity Scope Levels

The `--scope` flag controls which entities are included in the generated
project:

**core** - Minimal content management:

- articles (blog/CMS)
- site_settings (dynamic config)
- users (authentication)

**listing** - core + Product catalog:

- brands
- categories
- products
- product_images
- product_variants
- variant_options

**commerce** (default) - listing + Shopping & checkout:

- addresses (shipping addresses)
- carts (shopping carts)
- orders (order management)
- payments (payment processing)

Examples:

```bash
tstack create workspace blog --scope=core          # Minimal blog/CMS
tstack create workspace catalog --scope=listing    # Product catalog only
tstack create workspace shop --scope=commerce      # Full e-commerce (default)
tstack create api backend-api --scope=core         # Minimal API
```

| Type        | Description                         | Template Source               |
| ----------- | ----------------------------------- | ----------------------------- |
| `api`       | Backend REST API                    | `packages/api-starter`        |
| `admin-ui`  | Admin dashboard                     | `packages/admin-ui-starter`   |
| `store`     | Public storefront                   | `packages/storefront-starter` |
| `workspace` | Full stack (api + admin-ui + store) | All of the above              |

### TypeScript Interface

```typescript
// Source: packages/cli/src/commands/create.ts
export interface CreateOptions {
  projectName: string;
  projectType?: "api" | "admin-ui" | "store" | "workspace";
  targetDir?: string;
  latest?: boolean;
  skipDbSetup?: boolean;
  forceOverwrite?: boolean;
  skipListing?: boolean;
}
```

### Common Options (All Types)

| Flag              | Type    | Default | Description                                      |
| ----------------- | ------- | ------- | ------------------------------------------------ |
| `--latest`        | boolean | false   | Fetch latest versions from JSR/npm registries    |
| `--dir <path>`    | string  | `.`     | Target directory for project creation            |
| `--force`         | boolean | false   | Overwrite existing files without prompting       |
| `--skip-listing`  | boolean | false   | Skip product listing entities (brands, products) |
| `--skip-db-setup` | boolean | false   | Skip database creation (useful for testing)      |

### Listing Entities (Skipped with --skip-listing)

These entities are included by default for e-commerce projects:

```typescript
// Source: packages/cli/src/commands/creators/base-creator.ts
static readonly LISTING_ENTITIES = [
  "brands",
  "categories", 
  "products",
  "product_images",
  "product_variants",
  "variant_options"
];
```

---

### create api

Creates a new backend API project using Hono + Drizzle + PostgreSQL.

```bash
tstack create api <name> [options]
```

**Example**:

```bash
tstack create api my-backend
tstack create api my-api --latest
tstack create api shop-api --skip-listing
```

**What Gets Created**:

```
my-backend/
├── deno.json              # Deno configuration with tasks
├── drizzle.config.ts      # Drizzle ORM configuration
├── docker-compose.yml     # PostgreSQL container setup
├── docker-compose.dev.yml # Development overrides
├── Dockerfile             # Production container
├── .env                   # Environment variables (gitignored)
├── .env.example           # Environment template
├── .env.development.local # Dev environment
├── .env.test.local        # Test environment
├── .env.production.local  # Prod environment
├── migrations/            # Drizzle migrations (empty initially)
├── scripts/
│   ├── create-db.ts       # Database creation script
│   ├── seed.ts            # Data seeding script
│   └── cleanup-test-db.ts # Test database cleanup
└── src/
    ├── main.ts            # App entry point
    ├── config/
    │   ├── database.ts    # DB connection setup
    │   └── env.ts         # Environment configuration
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.route.ts
    │   ├── auth.dto.ts
    │   ├── user.model.ts
    │   └── token.model.ts
    ├── entities/
    │   ├── articles/      # Example entity
    │   ├── site_settings/ # Dynamic config system
    │   └── ... (listing entities if not skipped)
    └── shared/
        ├── base/
        │   ├── base-service.ts
        │   ├── base-controller.ts
        │   └── base-route-factory.ts
        ├── middleware/
        │   ├── requireAuth.ts
        │   └── requireRole.ts
        ├── utils/
        │   ├── jwt.ts
        │   └── validation.ts
        └── errors/
            └── http-errors.ts
```

**Databases Created** (3 databases per project):

| Database      | Purpose                 |
| ------------- | ----------------------- |
| `{name}_dev`  | Development environment |
| `{name}_test` | Automated testing       |
| `{name}_prod` | Production environment  |

**Interactive Prompts** (if not provided):

1. Database host (default: localhost)
2. Database port (default: 5432)
3. Database username (default: postgres)
4. Database password
5. JWT secret (auto-generated if not provided)

**Post-Creation Steps** (shown in terminal):

```bash
cd my-backend
deno task migrate:generate  # Generate initial migration
deno task migrate:run       # Apply migration
deno task db:seed           # Seed superadmin user
deno task dev               # Start development server
```

---

### create admin-ui

Creates a new admin dashboard using Fresh + Preact + DaisyUI.

```bash
tstack create admin-ui <name> [options]
```

**Example**:

```bash
tstack create admin-ui my-admin
tstack create admin-ui shop-admin --latest
```

**What Gets Created**:

```
my-admin/
├── deno.json              # Deno configuration
├── main.ts                # Fresh app entry point
├── client.ts              # Client-side entry
├── utils.ts               # Fresh utilities
├── vite.config.ts         # Vite bundler config
├── tailwind.config.ts     # Tailwind CSS config
├── .env                   # Environment variables
├── .env.example           # Environment template
├── assets/
│   └── styles.css         # Global styles
├── static/
│   └── styles.css         # Static assets
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx    # Navigation sidebar
│   │   ├── Header.tsx     # Top header
│   │   └── Footer.tsx     # Footer
│   ├── admin/
│   │   ├── DataTable.tsx  # Generic data table
│   │   ├── ShowPage.tsx   # Generic show page
│   │   └── GenericForm.tsx # Generic form
│   └── ui/
│       └── ... (UI components)
├── config/
│   └── entities/
│       ├── articles.ts    # Article entity config
│       └── ... (other entity configs)
├── entities/
│   └── articles/
│       ├── article.service.ts
│       └── article.types.ts
├── islands/
│   ├── ThemeSwitcher.tsx  # Dark/light mode toggle
│   └── DataTableActions.tsx
├── lib/
│   ├── api.ts             # API client
│   ├── auth.ts            # Auth utilities
│   ├── base-service.ts    # Base service class
│   └── admin/
│       ├── types.ts       # Entity config types
│       └── crud-handlers.ts
└── routes/
    ├── _app.tsx           # App layout
    ├── index.tsx          # Dashboard home
    ├── auth/
    │   └── login.tsx      # Login page
    └── admin/
        └── articles/
            ├── index.tsx  # List page
            ├── [id].tsx   # Show page
            ├── new.tsx    # Create page
            └── [id]/
                └── edit.tsx # Edit page
```

**Environment Variables**:

```bash
# .env
API_BASE_URL=http://localhost:8000  # Backend API URL
```

---

### create store

Creates a new public storefront using Fresh + Preact + Tailwind.

```bash
tstack create store <name> [options]
```

**Example**:

```bash
tstack create store my-store
tstack create store shop-frontend --latest
```

**What Gets Created**:

```
my-store/
├── deno.json
├── main.ts
├── client.ts
├── utils.ts
├── vite.config.ts
├── assets/
│   └── styles.css
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ... (UI components)
├── islands/
│   └── ... (interactive components)
├── routes/
│   ├── _app.tsx
│   ├── index.tsx          # Landing page
│   └── api/
└── static/
    └── styles.css
```

---

### create workspace

Creates a complete full-stack workspace with multiple services.

```bash
tstack create workspace <name> [options]
```

**TypeScript Interface**:

```typescript
// Source: packages/cli/src/commands/workspace.ts
export interface WorkspaceOptions {
  name: string;
  targetDir?: string;
  namespace?: string;
  // Component selection
  withApi?: boolean;
  withAdminUi?: boolean;
  withStore?: boolean;
  withUi?: boolean;
  withInfra?: boolean;
  withMobile?: boolean;
  withMetrics?: boolean;
  // Component exclusion
  skipApi?: boolean;
  skipAdminUi?: boolean;
  skipStore?: boolean;
  skipUi?: boolean;
  skipInfra?: boolean;
  skipMobile?: boolean;
  skipMetrics?: boolean;
  // GitHub integration
  skipRemote?: boolean;
  githubOrg?: string;
  githubToken?: string;
  visibility?: "private" | "public";
}
```

**Component Selection Flags**:

| Flag              | Creates                     | Default |
| ----------------- | --------------------------- | ------- |
| `--with-api`      | `{name}-api` backend        | true    |
| `--with-admin-ui` | `{name}-admin-ui` dashboard | true    |
| `--with-store`    | `{name}-store` storefront   | true    |
| `--with-ui`       | (Future) Frontend app       | false   |
| `--with-infra`    | (Future) Infrastructure     | false   |
| `--with-mobile`   | (Future) Mobile app         | false   |
| `--with-metrics`  | (Future) Metrics/monitoring | false   |

**Component Exclusion Flags**:

| Flag              | Skips                 |
| ----------------- | --------------------- |
| `--skip-api`      | Skip backend creation |
| `--skip-admin-ui` | Skip admin dashboard  |
| `--skip-store`    | Skip storefront       |

**GitHub Integration Flags**:

| Flag                     | Description                            |
| ------------------------ | -------------------------------------- |
| `--github-org=<org>`     | Create repos under organization        |
| `--github-token=<token>` | GitHub personal access token           |
| `--visibility=<vis>`     | Repo visibility: `private` or `public` |
| `--skip-remote`          | Skip GitHub repo creation entirely     |

**Examples**:

```bash
# Create full workspace with all components
tstack create workspace my-shop

# Create workspace without storefront
tstack create workspace my-blog --skip-store

# Create only API and admin
tstack create workspace my-app --with-api --with-admin-ui --skip-store

# Create with GitHub repos under organization
tstack create workspace vega --github-org=mycompany

# Create with public GitHub repos
tstack create workspace oss-project --github-org=myorg --visibility=public
```

**What Gets Created**:

```
my-shop/
├── my-shop-api/           # Backend (if not skipped)
│   └── ... (api structure)
├── my-shop-admin-ui/      # Admin panel (if not skipped)
│   └── ... (admin-ui structure)
└── my-shop-store/         # Storefront (if not skipped)
    └── ... (store structure)
```

**GitHub Repos Created** (with `--github-org`):

- `{org}/{name}-api`
- `{org}/{name}-admin-ui`
- `{org}/{name}-store`

Each repo gets:

- Initial commit with all files
- `.gitignore` configured
- Remote origin set

**GitHub Authentication Methods** (tried in order):

1. `--github-token` flag
2. `GITHUB_TOKEN` environment variable
3. `gh` CLI (if authenticated)

---

## tstack scaffold

Generates complete MVC entity files for an existing project.

**Source**:
[packages/cli/src/commands/scaffold.ts](packages/cli/src/commands/scaffold.ts)

### Syntax

```bash
tstack scaffold <entity-name> [options]
```

### TypeScript Interface

```typescript
// Source: packages/cli/src/commands/scaffold.ts
export interface ScaffoldOptions {
  entityName: string;
  targetDir?: string;
  force?: boolean;
  skipAdmin?: boolean;
  skipTests?: boolean;
  skipAuth?: boolean;
  skipValidation?: boolean;
  skipAdminUi?: boolean;
  onlyApi?: boolean;
  onlyAdminUi?: boolean;
}
```

### Options

| Flag                | Type    | Default | Description                         |
| ------------------- | ------- | ------- | ----------------------------------- |
| `--force`           | boolean | false   | Overwrite existing files            |
| `--skip-admin`      | boolean | false   | Skip admin route files              |
| `--skip-tests`      | boolean | false   | Skip test files                     |
| `--skip-auth`       | boolean | false   | Don't add auth middleware to routes |
| `--skip-validation` | boolean | false   | Skip Zod validation schemas         |
| `--skip-admin-ui`   | boolean | false   | Skip admin-ui scaffolding           |
| `--only-api`        | boolean | false   | Generate API files only             |
| `--only-admin-ui`   | boolean | false   | Generate admin-ui files only        |
| `--dir <path>`      | string  | `.`     | Target directory                    |

### Examples

```bash
# In an API project directory
cd my-shop-api
tstack scaffold product
tstack scaffold blog_post
tstack scaffold BlogPost         # All naming formats supported
tstack scaffold order --skip-tests
tstack scaffold comment --skip-auth

# In a workspace directory (scaffolds both API and Admin-UI)
cd my-shop
tstack scaffold product

# Only scaffold API files
tstack scaffold product --only-api

# Only scaffold Admin-UI files
tstack scaffold product --only-admin-ui
```

### Files Generated (API - 8 files)

**Location**: `src/entities/{snake_case_plural}/`

| File                              | Description                            |
| --------------------------------- | -------------------------------------- |
| `{kebab-singular}.model.ts`       | Drizzle schema definition              |
| `{kebab-singular}.dto.ts`         | Zod validation + TypeScript types      |
| `{kebab-singular}.service.ts`     | Business logic (extends BaseService)   |
| `{kebab-singular}.controller.ts`  | HTTP handlers (extends BaseController) |
| `{kebab-singular}.route.ts`       | Public API routes                      |
| `{kebab-singular}.admin.route.ts` | Admin panel routes                     |
| `{kebab-singular}.test.ts`        | API endpoint tests                     |
| `{kebab-singular}.admin.test.ts`  | Admin endpoint tests                   |

**Example for `tstack scaffold BlogPost`**:

```
src/entities/blog_posts/
├── blog-post.model.ts
├── blog-post.dto.ts
├── blog-post.service.ts
├── blog-post.controller.ts
├── blog-post.route.ts
├── blog-post.admin.route.ts
├── blog-post.test.ts
└── blog-post.admin.test.ts
```

### Files Generated (Admin-UI - 7 files)

| File                                      | Description          |
| ----------------------------------------- | -------------------- |
| `config/entities/{plural}.ts`             | Entity configuration |
| `routes/admin/{plural}/index.tsx`         | List page            |
| `routes/admin/{plural}/[id].tsx`          | Show page            |
| `routes/admin/{plural}/new.tsx`           | Create page          |
| `routes/admin/{plural}/[id]/edit.tsx`     | Edit page            |
| `entities/{plural}/{singular}.service.ts` | API service          |
| `entities/{plural}/{singular}.types.ts`   | TypeScript types     |

**Example for `tstack scaffold BlogPost`**:

```
config/entities/blog-posts.ts
routes/admin/blog-posts/index.tsx
routes/admin/blog-posts/[id].tsx
routes/admin/blog-posts/new.tsx
routes/admin/blog-posts/[id]/edit.tsx
entities/blog_posts/blog-post.service.ts
entities/blog_posts/blog-post.types.ts
```

### Post-Scaffolding Steps

After scaffolding, you need to:

1. **Register routes** in `src/main.ts`:

```typescript
import { blogPostRoutes } from "./entities/blog_posts/blog-post.route.ts";
import { blogPostAdminRoutes } from "./entities/blog_posts/blog-post.admin.route.ts";

app.route("/blog-posts", blogPostRoutes);
app.route("/ts-admin/blog-posts", blogPostAdminRoutes);
```

1. **Generate migration**:

```bash
deno task migrate:generate
deno task migrate:run
```

1. **Update sidebar** (Admin-UI) - This is done automatically by the scaffolder
   in `components/layout/Sidebar.tsx`

---

## tstack destroy

Removes projects and drops associated databases.

**Source**:
[packages/cli/src/commands/destroy.ts](packages/cli/src/commands/destroy.ts)

### Syntax

```bash
tstack destroy [type] <name> [options]
```

### TypeScript Interface

```typescript
// Source: packages/cli/src/commands/destroy.ts
export interface DestroyOptions {
  projectName: string;
  projectType?: "api" | "admin-ui" | "store" | "workspace";
  force?: boolean;
  skipDbSetup?: boolean;
  interactive?: boolean;
}
```

### Options

| Flag            | Type    | Default | Description               |
| --------------- | ------- | ------- | ------------------------- |
| `--force`       | boolean | false   | Skip confirmation prompt  |
| `--skip-remote` | boolean | false   | Don't delete GitHub repos |

### Examples

```bash
# Destroy a specific project type
tstack destroy api my-backend
tstack destroy admin-ui my-admin
tstack destroy store my-store

# Destroy entire workspace (all components)
tstack destroy workspace my-shop

# Skip confirmation
tstack destroy api my-backend --force

# Keep GitHub repos when destroying workspace
tstack destroy workspace my-shop --skip-remote
```

### What Gets Removed

**For API projects**:

1. Project directory and all files
2. Development database (`{name}_dev`)
3. Test database (`{name}_test`)
4. Production database (`{name}_prod`)
5. KV store metadata (marked as `destroyed`)

**For Admin-UI/Store projects**:

1. Project directory and all files
2. KV store metadata (marked as `destroyed`)

**For Workspaces**:

1. All component directories
2. All databases (from API component)
3. GitHub repos (unless `--skip-remote`)
4. KV store metadata for all projects

### Database Drop Methods

The CLI tries these methods in order:

1. **PGPASSWORD**: Uses `PGPASSWORD` environment variable

   ```bash
   PGPASSWORD=xxx psql -h localhost -U postgres -c "DROP DATABASE {name}"
   ```

2. **Docker exec**: If PostgreSQL container is running

   ```bash
   docker exec postgres psql -U postgres -c "DROP DATABASE {name}"
   ```

3. **Sudo**: Interactive prompt for system PostgreSQL

   ```bash
   sudo -u postgres psql -c "DROP DATABASE {name}"
   ```

---

## tstack list

Shows all tracked projects with their status.

**Source**:
[packages/cli/src/commands/list.ts](packages/cli/src/commands/list.ts)

### Syntax

```bash
tstack list [options]
```

### TypeScript Interface

```typescript
// Source: packages/cli/src/commands/list.ts
export interface ListOptions {
  status?: ProjectStatus | "all";
}

type ProjectStatus = "creating" | "created" | "destroying" | "destroyed";
```

### Options

| Flag                | Values                                                  | Default   | Description              |
| ------------------- | ------------------------------------------------------- | --------- | ------------------------ |
| `--status <status>` | `created`, `creating`, `destroyed`, `destroying`, `all` | `created` | Filter by project status |

### Examples

```bash
# List active projects (default)
tstack list

# List all projects including destroyed
tstack list --status=all

# List only destroyed projects
tstack list --status=destroyed

# List projects being created
tstack list --status=creating
```

### Output Format

```
TStack Projects
===============

Name            Type        Status    Path                          Created
----            ----        ------    ----                          -------
my-shop-api     api         created   /home/user/projects/my-shop   2025-12-20
my-shop-admin   admin-ui    created   /home/user/projects/my-shop   2025-12-20
my-shop-store   store       created   /home/user/projects/my-shop   2025-12-20
old-project     api         destroyed /home/user/projects/old       2025-12-15

Databases (API projects):
  my-shop-api: my_shop_dev, my_shop_test, my_shop_prod
```

---

## tstack upgrade

Updates the TStack CLI to a newer version.

### Syntax

```bash
tstack upgrade [version]
```

### Examples

```bash
# Upgrade to latest version
tstack upgrade

# Upgrade to specific version
tstack upgrade 1.3.0

# Upgrade to specific version with v prefix
tstack upgrade v1.3.0
```

### What Happens

1. Fetches available versions from GitHub releases
2. Downloads specified version (or latest)
3. Reinstalls CLI with new version
4. Shows upgrade confirmation

---

## tstack versions

Lists all available CLI versions from GitHub releases.

### Syntax

```bash
tstack versions
```

### Output

```
Available TStack CLI Versions
=============================

v1.3.2 (latest)
v1.3.1
v1.3.0
v1.2.1
v1.2.0
v1.1.3
...
```

---

## tstack templates

Shows available starter templates with their features.

### Syntax

```bash
tstack templates
```

### Output

```
Available TStack Templates
==========================

api-starter
  Backend REST API with Hono + Drizzle + PostgreSQL
  Features: JWT Auth, RBAC, BaseService, BaseController

admin-ui-starter
  Admin dashboard with Fresh + Preact + DaisyUI
  Features: Config-driven CRUD, DataTable, GenericForm

storefront-starter
  Public storefront with Fresh + Preact + Tailwind
  Features: Landing page, Product display, Responsive design
```

---

## Project Tracking (Deno KV)

Projects are tracked using Deno KV stored at `~/.tstack/projects.db`.

**Source**: [packages/cli/src/utils/kv.ts](packages/cli/src/utils/kv.ts)

### Project Metadata Schema

```typescript
// Source: packages/cli/src/utils/kv.ts
export type ProjectStatus = "creating" | "created" | "destroying" | "destroyed";

export interface ProjectMetadata {
  name: string; // Original name (e.g., "my-shop")
  type: "api" | "admin-ui" | "store" | "workspace";
  folderName: string; // Actual folder (e.g., "my-shop-api")
  path: string; // Absolute path
  databases?: {
    dev?: string; // e.g., "my_shop_dev"
    test?: string; // e.g., "my_shop_test"
    prod?: string; // e.g., "my_shop_prod"
  };
  status: ProjectStatus;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}
```

### Workspace Metadata Schema

```typescript
// Source: packages/cli/src/utils/workspace-store.ts
export type WorkspaceStatus =
  | "creating"
  | "created"
  | "destroying"
  | "destroyed";
export type ProjectType =
  | "api"
  | "admin-ui"
  | "store"
  | "ui"
  | "infra"
  | "mobile";

export interface WorkspaceMetadata {
  name: string;
  path: string;
  namespace: string;
  status: WorkspaceStatus;
  githubOrg?: string;
  githubRepos: Array<{
    name: string;
    url: string;
    type: ProjectType;
  }>;
  projects: Array<{
    folderName: string;
    path: string;
    type: ProjectType;
    projectKey: string;
    addedBy: "workspace-init" | "manual";
    addedAt: Date;
  }>;
  components: {
    api: boolean;
    adminUi: boolean;
    store: boolean;
    ui: boolean;
    infra: boolean;
    mobile: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### KV Store Functions

```typescript
// Save a new project
export async function saveProject(
  metadata: ProjectMetadata,
  kvPath?: string,
): Promise<void>;

// Get project by folder name
export async function getProject(
  folderName: string,
  kvPath?: string,
): Promise<ProjectMetadata | null>;

// Get project by name and type
export async function getProjectByNameAndType(
  name: string,
  type: "api" | "admin-ui" | "workspace",
  kvPath?: string,
): Promise<ProjectMetadata | null>;

// List all projects
export async function listProjects(kvPath?: string): Promise<ProjectMetadata[]>;

// Delete project metadata
export async function deleteProject(
  folderName: string,
  kvPath?: string,
): Promise<void>;

// Update project metadata
export async function updateProject(
  folderName: string,
  updates: Partial<ProjectMetadata>,
  kvPath?: string,
): Promise<void>;

// Close KV connection (for testing)
export function closeKv(): void;
```

---

## Naming Conventions

The CLI automatically transforms entity names to various formats.

**Source**:
[packages/cli/src/utils/stringUtils.ts](packages/cli/src/utils/stringUtils.ts)

### EntityNames Interface

```typescript
// Source: packages/cli/src/utils/stringUtils.ts
export interface EntityNames {
  singular: string; // camelCase: siteSetting
  plural: string; // camelCase: siteSettings
  pascalSingular: string; // PascalCase: SiteSetting
  pascalPlural: string; // PascalCase: SiteSettings
  kebabSingular: string; // kebab-case: site-setting
  kebabPlural: string; // kebab-case: site-settings
  snakeSingular: string; // snake_case: site_setting
  snakePlural: string; // snake_case: site_settings
  tableName: string; // snake_case: site_settings (same as snakePlural)
}
```

### Transformation Examples

| Input           | Folder            | Files                | Routes            | DB Table         |
| --------------- | ----------------- | -------------------- | ----------------- | ---------------- |
| `BlogPost`      | `blog_posts/`     | `blog-post.*.ts`     | `/blog-posts`     | `blog_posts`     |
| `blog_post`     | `blog_posts/`     | `blog-post.*.ts`     | `/blog-posts`     | `blog_posts`     |
| `blogPost`      | `blog_posts/`     | `blog-post.*.ts`     | `/blog-posts`     | `blog_posts`     |
| `site_settings` | `site_settings/`  | `site-setting.*.ts`  | `/site-settings`  | `site_settings`  |
| `User`          | `users/`          | `user.*.ts`          | `/users`          | `users`          |
| `ProductImage`  | `product_images/` | `product-image.*.ts` | `/product-images` | `product_images` |

### String Utility Functions

```typescript
// Capitalize first letter
export function capitalize(str: string): string;
// "hello" -> "Hello"

// Convert to PascalCase
export function pascalCase(str: string): string;
// "blog_post" -> "BlogPost"

// Convert to camelCase
export function camelCase(str: string): string;
// "blog_post" -> "blogPost"

// Convert to kebab-case
export function kebabCase(str: string): string;
// "BlogPost" -> "blog-post"

// Convert to snake_case
export function snakeCase(str: string): string;
// "BlogPost" -> "blog_post"

// Pluralize a word
export function pluralize(str: string): string;
// "post" -> "posts", "category" -> "categories"

// Singularize a word
export function singularize(str: string): string;
// "posts" -> "post", "categories" -> "category"

// Validate entity name
export function isValidEntityName(name: string): boolean;
// Only alphanumeric and underscores, starts with letter

// Get all name variants
export function getEntityNames(input: string): EntityNames;
```

---

## Template Files Generated

### Model Template

**Generated by**:
[packages/cli/src/templates/model.ts](packages/cli/src/templates/model.ts)

```typescript
// Example output for: tstack scaffold BlogPost

import { boolean, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { commonColumns } from "../shared/common-columns.ts";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const blogPosts = pgTable("blog_posts", {
  ...commonColumns,
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  isPublished: boolean("is_published").default(false).notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

export const insertBlogPostSchema = createInsertSchema(blogPosts);
export const selectBlogPostSchema = createSelectSchema(blogPosts);
```

### DTO Template

**Generated by**:
[packages/cli/src/templates/dto.ts](packages/cli/src/templates/dto.ts)

```typescript
// Example output for: tstack scaffold BlogPost

import { z } from "zod";

export const createBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  content: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export type CreateBlogPostDTO = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostDTO = z.infer<typeof updateBlogPostSchema>;

export interface BlogPostResponseDTO {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Service Template

**Generated by**:
[packages/cli/src/templates/service.ts](packages/cli/src/templates/service.ts)

```typescript
// Example output for: tstack scaffold BlogPost

import { BaseService } from "../../shared/base/base-service.ts";
import { db } from "../../config/database.ts";
import { BlogPost, blogPosts, NewBlogPost } from "./blog-post.model.ts";
import {
  BlogPostResponseDTO,
  CreateBlogPostDTO,
  UpdateBlogPostDTO,
} from "./blog-post.dto.ts";

export class BlogPostService extends BaseService<
  BlogPost,
  CreateBlogPostDTO,
  UpdateBlogPostDTO,
  BlogPostResponseDTO
> {
  constructor() {
    super(db, blogPosts);
  }

  // Override lifecycle hooks as needed:
  // protected async beforeCreate(data: CreateBlogPostDTO) { ... }
  // protected async afterCreate(result: BlogPostResponseDTO) { ... }
  // protected async beforeUpdate(id: number, data: UpdateBlogPostDTO) { ... }
  // protected async afterUpdate(result: BlogPostResponseDTO) { ... }
  // protected async beforeDelete(id: number) { ... }
  // protected async afterDelete(id: number) { ... }
}

export const blogPostService = new BlogPostService();
```

### Controller Template

**Generated by**:
[packages/cli/src/templates/controller.ts](packages/cli/src/templates/controller.ts)

```typescript
// Example output for: tstack scaffold BlogPost

import { BaseController } from "../../shared/base/base-controller.ts";
import { BlogPostService, blogPostService } from "./blog-post.service.ts";

class BlogPostController extends BaseController<BlogPostService> {
  constructor() {
    super(blogPostService, "BlogPost", {
      // Auth configuration (uncomment as needed):
      // create: { roles: ["admin", "superadmin"] },
      // update: { roles: ["admin", "superadmin"] },
      // delete: { roles: ["superadmin"] },
    });
  }
}

export const blogPostController = new BlogPostController().toStatic();
```

### Route Template

**Generated by**:
[packages/cli/src/templates/route.ts](packages/cli/src/templates/route.ts)

```typescript
// Example output for: tstack scaffold BlogPost

import { Hono } from "hono";
import { blogPostController } from "./blog-post.controller.ts";
import { createBlogPostSchema, updateBlogPostSchema } from "./blog-post.dto.ts";
import { BaseRouteFactory } from "../../shared/base/base-route-factory.ts";

export const blogPostRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/blog-posts",
  controller: blogPostController,
  schemas: {
    create: createBlogPostSchema,
    update: updateBlogPostSchema,
  },
  publicRoutes: ["getAll", "getById"], // Unauthenticated access
  // disabledRoutes: [],                // Disable specific routes
});
```

### Test Template

**Generated by**:
[packages/cli/src/templates/test.ts](packages/cli/src/templates/test.ts)

```typescript
// Example output for: tstack scaffold BlogPost

import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { app } from "../../main.ts";

describe("BlogPost API", () => {
  let testId: number;

  describe("GET /blog-posts", () => {
    it("should return list of blog posts", async () => {
      const res = await app.request("/blog-posts");
      assertEquals(res.status, 200);

      const body = await res.json();
      assertExists(body.data);
      assertEquals(Array.isArray(body.data), true);
    });
  });

  describe("POST /blog-posts", () => {
    it("should create a new blog post", async () => {
      const res = await app.request("/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Post",
          content: "Test content",
        }),
      });
      assertEquals(res.status, 201);

      const body = await res.json();
      assertExists(body.data.id);
      testId = body.data.id;
    });
  });

  describe("GET /blog-posts/:id", () => {
    it("should return a single blog post", async () => {
      const res = await app.request(`/blog-posts/${testId}`);
      assertEquals(res.status, 200);

      const body = await res.json();
      assertEquals(body.data.title, "Test Post");
    });
  });

  describe("PUT /blog-posts/:id", () => {
    it("should update a blog post", async () => {
      const res = await app.request(`/blog-posts/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Post" }),
      });
      assertEquals(res.status, 200);

      const body = await res.json();
      assertEquals(body.data.title, "Updated Post");
    });
  });

  describe("DELETE /blog-posts/:id", () => {
    it("should delete a blog post", async () => {
      const res = await app.request(`/blog-posts/${testId}`, {
        method: "DELETE",
      });
      assertEquals(res.status, 200);
    });
  });
});
```

---

## CLI Architecture

### Command Flow

```
tstack <command>
    │
    ├── mod.ts (entry point)
    │   └── parseArgs()
    │
    ├── commands/
    │   ├── create.ts
    │   │   └── BaseProjectCreator (Template Method Pattern)
    │   │       ├── ApiCreator
    │   │       ├── AdminUiCreator
    │   │       └── StoreCreator
    │   │
    │   ├── scaffold.ts
    │   │   └── ScaffoldOrchestrator
    │   │       ├── ApiScaffolder
    │   │       └── AdminUiScaffolder
    │   │
    │   ├── workspace.ts
    │   │   └── createWorkspace() / destroyWorkspace()
    │   │
    │   ├── destroy.ts
    │   │   └── destroyProject()
    │   │
    │   └── list.ts
    │       └── listTrackedProjects()
    │
    └── utils/
        ├── kv.ts (project tracking)
        ├── workspace-store.ts (workspace tracking)
        ├── db.ts (database operations)
        ├── stringUtils.ts (naming conventions)
        └── github.ts (GitHub API integration)
```

### Creator Pattern (Template Method)

```typescript
// Source: packages/cli/src/commands/creators/base-creator.ts
abstract class BaseProjectCreator {
  async create(): Promise<ProjectCreatorResult> {
    this.validateProjectName();
    await this.handleExistingProject();
    const starterPath = this.getStarterPath();
    await this.copyTemplate(starterPath);
    await this.configureProject();
    if (this.options.latest) {
      await this.updateDependencies();
    }
    await this.postCreationSetup();
    await this.saveProjectMetadata();
    this.showSuccessMessage();
  }

  // Subclasses implement these:
  protected abstract getStarterTemplateName(): string;
  protected abstract configureProject(): Promise<void>;
  protected abstract updateImports(
    imports: object,
    latestVersions: object,
  ): void;
  protected abstract postCreationSetup(): Promise<void>;
  protected abstract saveProjectMetadata(): Promise<void>;
  protected abstract showSuccessMessage(): void;
}
```

### Scaffolder Pattern (Strategy)

```typescript
// Source: packages/cli/src/commands/scaffolders/base-scaffolder.ts
export interface IScaffolder {
  shouldRun(): Promise<boolean>;
  generateFiles(): Promise<FileToWrite[]>;
  getTargetDir(): string;
  getTypeName(): string;
  postProcess?(): Promise<void>;
}

export abstract class BaseScaffolder implements IScaffolder {
  protected entityNames: EntityNames;
  protected force: boolean;

  abstract shouldRun(): Promise<boolean>;
  abstract generateFiles(): Promise<FileToWrite[]>;
  abstract getTargetDir(): string;
  abstract getTypeName(): string;
}
```

---

## Error Handling

### Common Errors

| Error                          | Cause                        | Solution                                  |
| ------------------------------ | ---------------------------- | ----------------------------------------- |
| `Project already exists`       | Folder with same name exists | Use `--force` or choose different name    |
| `Database already exists`      | DB with same name exists     | Use different name or drop existing DB    |
| `Not in a project directory`   | No deno.json found           | Run from project root                     |
| `Entity already exists`        | Entity folder exists         | Use `--force` to overwrite                |
| `Invalid entity name`          | Contains invalid characters  | Use alphanumeric and underscores only     |
| `GitHub authentication failed` | Invalid or missing token     | Set `GITHUB_TOKEN` or use `gh auth login` |

### Exit Codes

| Code | Meaning                     |
| ---- | --------------------------- |
| 0    | Success                     |
| 1    | General error               |
| 2    | Invalid arguments           |
| 3    | Project/file already exists |
| 4    | Database operation failed   |
| 5    | GitHub API error            |

---

## Testing the CLI

**Test Location**: [packages/cli/tests/](packages/cli/tests/)

### Running Tests

```bash
cd packages/cli

# Run all tests
deno task test

# Run specific test file
deno test --allow-all tests/create.test.ts

# Watch mode
deno task test:watch

# With coverage
deno task test:coverage
```

### Test Environment Variables

```bash
# Skip database operations in tests
TSTACK_TEST_DB=true

# Skip GitHub operations in tests  
TSTACK_TEST_GITHUB=true

# Use custom KV path for test isolation
TSTACK_KV_PATH=/tmp/test-projects.db
```

---

## Related Documentation

- **API Starter Reference**: [LLMS-API.md](LLMS-API.md)
- **Frontend Reference**: [LLMS-FRONTEND.md](LLMS-FRONTEND.md)
- **Main Index**: [LLMS.md](LLMS.md)
- **Coding Standards**: [CODING_STANDARDS.md](CODING_STANDARDS.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
