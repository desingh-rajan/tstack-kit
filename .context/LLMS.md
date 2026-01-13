# TStack Kit - Complete Reference for AI Agents and Developers

> **Purpose**: This is the master index for TStack Kit documentation. AI agents,
> LLMs (Claude, GPT, Copilot), and developers should start here to understand
> the project structure and find detailed documentation.

**Repository**:
[github.com/desingh-rajan/tstack-kit](https://github.com/desingh-rajan/tstack-kit)

---

## Quick Navigation

| Document                                       | Description               | When to Use                             |
| ---------------------------------------------- | ------------------------- | --------------------------------------- |
| **[LLMS.md](LLMS.md)** (this file)             | Master index and overview | Start here                              |
| **[LLMS-CLI.md](LLMS-CLI.md)**                 | CLI commands reference    | Creating projects, scaffolding entities |
| **[LLMS-API.md](LLMS-API.md)**                 | API Starter reference     | Backend development, auth, CRUD         |
| **[LLMS-FRONTEND.md](LLMS-FRONTEND.md)**       | Frontend reference        | Admin UI, Storefront, components        |
| **[CODING_STANDARDS.md](CODING_STANDARDS.md)** | Code style guide          | Writing code, reviews                   |
| **[TESTING.md](TESTING.md)**                   | Testing guide             | Writing and running tests               |

---

## What is TStack Kit?

TStack Kit is a **monorepo toolkit** for building type-safe SaaS applications
with Deno.

**Goal**: Ship products, not boilerplate.

### Core Stack

| Layer      | Technology             | Purpose                       |
| ---------- | ---------------------- | ----------------------------- |
| Runtime    | Deno 2.6.4+            | JavaScript/TypeScript runtime |
| Backend    | Hono                   | Fast web framework            |
| Database   | PostgreSQL 16+         | Relational database           |
| ORM        | Drizzle ORM            | Type-safe database access     |
| Validation | Zod                    | Schema validation             |
| Frontend   | Fresh + Preact         | Server-rendered UI            |
| Styling    | Tailwind CSS + DaisyUI | Utility-first CSS             |
| Auth       | JWT (JOSE)             | Token-based authentication    |

### What You Can Build

- REST APIs with authentication and RBAC
- Admin dashboards with config-driven CRUD
- E-commerce storefronts
- SaaS applications
- Internal tools

---

## Repository Structure

```
tstack-kit/
├── packages/
│   ├── cli/                 # TStack CLI tool (@tonystack/cli)
│   ├── admin/               # Admin library (@tstack/admin)
│   ├── api-starter/         # API template
│   ├── admin-ui-starter/    # Admin UI template
│   └── storefront-starter/  # Storefront template
├── docs/                    # Additional documentation
├── scripts/                 # Maintenance scripts
├── LLMS.md                  # This file
├── LLMS-CLI.md              # CLI reference
├── LLMS-API.md              # API reference
├── LLMS-FRONTEND.md         # Frontend reference
├── CODING_STANDARDS.md      # Code style guide
├── TESTING.md               # Testing guide
└── deno.json                # Workspace configuration
```

### Package Purposes

| Package              | Published As     | Purpose                                       |
| -------------------- | ---------------- | --------------------------------------------- |
| `cli`                | `@tonystack/cli` | CLI tool for project creation and scaffolding |
| `admin`              | `@tstack/admin`  | Framework-agnostic admin CRUD library         |
| `api-starter`        | Template         | Backend API template (copied to new projects) |
| `admin-ui-starter`   | Template         | Admin dashboard template                      |
| `storefront-starter` | Template         | E-commerce frontend template                  |

---

## Quick Start

### 1. Install the CLI

```bash
deno install -gArf --unstable-kv -n tstack jsr:@tonystack/cli
```

### 2. Create a Workspace

```bash
# Create full-stack workspace (API + Admin UI + Store)
tstack create workspace my-shop

# Create with specific entity scope
tstack create workspace blog --scope=core         # Minimal: articles, settings, enquiries
tstack create workspace catalog --scope=listing   # + Product catalog
tstack create workspace shop --scope=commerce     # + Shopping cart & checkout (default)

# Create API backend only
tstack create api my-api

# Create Admin UI only
tstack create admin-ui my-admin
```

### 3. Entity Scope Control

TStack Kit supports progressive entity inclusion via the `--scope` flag:

- **core**: Articles, site settings, enquiries, users (minimal CMS)
- **listing**: core + brands, categories, products, variants (product catalog)
- **commerce**: listing + addresses, carts, orders, payments (full e-commerce)

This allows you to start minimal and scale up as needed.

# Or create individual projects

tstack create api my-backend tstack create admin-ui my-admin tstack create store
my-store

````
### 3. Set Up the API

```bash
cd my-shop/my-shop-api

# Generate and run migrations
deno task migrate:generate
deno task migrate:run

# Seed the superadmin user
deno task db:seed

# Start development server
deno task dev
````

### 4. Set Up the Admin UI

```bash
cd ../my-shop-admin-ui

# Configure API URL in .env
echo "API_BASE_URL=http://localhost:8000" > .env

# Start development server
deno task dev
```

### 5. Add a New Entity

```bash
cd my-shop/my-shop-api

# Scaffold a new entity
tstack scaffold Product

# This creates:
# - src/entities/products/product.model.ts
# - src/entities/products/product.dto.ts
# - src/entities/products/product.service.ts
# - src/entities/products/product.controller.ts
# - src/entities/products/product.route.ts
# - src/entities/products/product.admin.route.ts
# - src/entities/products/product.test.ts
```

---

## Common Tasks

### CLI Commands

| Command                          | Description                  | See                                                          |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| `tstack create api <name>`       | Create backend project       | [LLMS-CLI.md#create-api](LLMS-CLI.md#create-api)             |
| `tstack create admin-ui <name>`  | Create admin dashboard       | [LLMS-CLI.md#create-admin-ui](LLMS-CLI.md#create-admin-ui)   |
| `tstack create store <name>`     | Create storefront            | [LLMS-CLI.md#create-store](LLMS-CLI.md#create-store)         |
| `tstack create workspace <name>` | Create full-stack workspace  | [LLMS-CLI.md#create-workspace](LLMS-CLI.md#create-workspace) |
| `tstack scaffold <entity>`       | Generate entity files        | [LLMS-CLI.md#tstack-scaffold](LLMS-CLI.md#tstack-scaffold)   |
| `tstack destroy <type> <name>`   | Remove project and databases | [LLMS-CLI.md#tstack-destroy](LLMS-CLI.md#tstack-destroy)     |
| `tstack list`                    | List tracked projects        | [LLMS-CLI.md#tstack-list](LLMS-CLI.md#tstack-list)           |

### API Development

| Task             | Command/Location             | See                                                                                      |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| Add entity       | `tstack scaffold <Entity>`   | [LLMS-CLI.md#tstack-scaffold](LLMS-CLI.md#tstack-scaffold)                               |
| Create migration | `deno task migrate:generate` | [LLMS-API.md#database-setup](LLMS-API.md#database-setup)                                 |
| Run migration    | `deno task migrate:run`      | [LLMS-API.md#database-setup](LLMS-API.md#database-setup)                                 |
| Add auth         | Use `requireAuth` middleware | [LLMS-API.md#middleware](LLMS-API.md#middleware)                                         |
| Add role check   | Use `requireRole` middleware | [LLMS-API.md#rbac-role-based-access-control](LLMS-API.md#rbac-role-based-access-control) |
| Run tests        | `deno task test`             | [LLMS-API.md#testing](LLMS-API.md#testing)                                               |

### Frontend Development

| Task                | Location                      | See                                                                               |
| ------------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| Add entity to admin | `config/entities/<entity>.ts` | [LLMS-FRONTEND.md#entity-configuration](LLMS-FRONTEND.md#entity-configuration)    |
| Customize list view | `fields[].showInList`         | [LLMS-FRONTEND.md#field-types-reference](LLMS-FRONTEND.md#field-types-reference)  |
| Custom field render | `fields[].render` function    | [LLMS-FRONTEND.md#custom-render-examples](LLMS-FRONTEND.md#field-types-reference) |
| Add CRUD routes     | `routes/admin/<entity>/`      | [LLMS-FRONTEND.md#routes-structure](LLMS-FRONTEND.md#routes-structure)            |

---

## Architecture Overview

### Backend Flow

```
Request → Hono Router → Middleware → Controller → Service → Drizzle → PostgreSQL
                ↓
           requireAuth
           requireRole
           validation
```

### Admin UI Flow

```
Browser → Fresh Route → Handler → API Client → Backend API
              ↓
         Component
              ↓
         DataTable / GenericForm / ShowPage
```

### Key Patterns

1. **Base Classes**: `BaseService` and `BaseController` reduce CRUD boilerplate
   by ~70%
2. **Config-Driven Admin**: Define entity config once, get full CRUD UI
3. **Lifecycle Hooks**: `beforeCreate`, `afterCreate`, etc. for custom logic
4. **Type Safety**: End-to-end TypeScript from DB schema to API response

---

## Coding Standards Summary

See [CODING_STANDARDS.md](CODING_STANDARDS.md) for full details.

### Critical Rules

1. **NO emojis** in code, logs, or comments
2. **Explicit return types** for all public functions
3. **Strict TypeScript** - no `any` without lint-ignore comment
4. **Colocated tests** - `user.service.ts` next to `user.test.ts`
5. **Real database tests** - no mocking the database
6. **Structured logging** - use `[INFO]`, `[ERROR]`, `[SUCCESS]` prefixes

### Naming Conventions

| What       | Convention  | Example           |
| ---------- | ----------- | ----------------- |
| Files      | kebab-case  | `user-service.ts` |
| Classes    | PascalCase  | `UserService`     |
| Functions  | camelCase   | `createUser`      |
| Constants  | UPPER_SNAKE | `MAX_RETRIES`     |
| DB Tables  | snake_case  | `user_roles`      |
| API Routes | kebab-case  | `/user-profiles`  |

### Git Commits

```
<type>(<scope>): <subject>

Types: feat, fix, docs, refactor, test, chore
Examples:
  feat(auth): add password reset flow
  fix(articles): prevent duplicate slugs
  docs(readme): update installation steps
```

---

## Environment Variables

### API Starter

| Variable          | Required | Default                 | Description                         |
| ----------------- | -------- | ----------------------- | ----------------------------------- |
| `DATABASE_URL`    | Yes      | -                       | PostgreSQL connection string        |
| `JWT_SECRET`      | Prod     | `change-me...`          | JWT signing secret                  |
| `PORT`            | No       | `8000`                  | HTTP server port                    |
| `ENVIRONMENT`     | No       | `development`           | `development`, `test`, `production` |
| `ALLOWED_ORIGINS` | No       | `http://localhost:3000` | CORS origins                        |

### Admin UI Starter

| Variable       | Required | Default | Description     |
| -------------- | -------- | ------- | --------------- |
| `API_BASE_URL` | Yes      | -       | Backend API URL |

---

## Testing

See [TESTING.md](TESTING.md) for full details.

### Quick Commands

```bash
# Run all tests in a package
deno task test

# Run specific test file
deno test --allow-all src/entities/articles/article.test.ts

# Watch mode
deno task test:watch
```

### Test Databases

Each project uses separate test databases:

| Purpose     | Database Name    |
| ----------- | ---------------- |
| Development | `{project}_dev`  |
| Testing     | `{project}_test` |
| Production  | `{project}_prod` |

---

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL format
postgresql://user:password@localhost:5432/dbname
```

### Migration Error

```bash
# Reset and regenerate
rm -rf migrations/*
deno task migrate:generate
deno task migrate:run
```

### Authentication Issues

```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Verify token format
# Header: Authorization: Bearer <token>
```

### CORS Errors

```bash
# Add frontend URL to ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Deno Formatter Bug

Add to `.vscode/settings.json`:

```json
{
  "[typescript-test]": {
    "editor.formatOnSave": false
  }
}
```

---

## Version Information

| Component      | Version | Registry |
| -------------- | ------- | -------- |
| TStack Kit     | 1.3.2   | GitHub   |
| @tonystack/cli | 1.3.2   | JSR      |
| @tstack/admin  | 2.1.0   | JSR      |
| Deno           | 2.6+    | -        |
| PostgreSQL     | 16+     | -        |

---

## Getting Help

1. **Check this documentation** - LLMS.md and related files
2. **Search existing issues** - GitHub Issues
3. **Check test files** - They show expected behavior
4. **Read source code** - It's well-documented

---

## For AI Agents

When working with this codebase:

1. **Start with [LLMS-CLI.md](LLMS-CLI.md)** for project creation commands
2. **Use [LLMS-API.md](LLMS-API.md)** for backend patterns and base classes
3. **Use [LLMS-FRONTEND.md](LLMS-FRONTEND.md)** for admin UI entity configs
4. **Follow [CODING_STANDARDS.md](CODING_STANDARDS.md)** for code style
5. **Check existing entities** as examples (e.g., `articles`, `site_settings`)

### Common AI Tasks

| Task                 | Documentation                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Create new entity    | [LLMS-CLI.md#tstack-scaffold](LLMS-CLI.md#tstack-scaffold)                               |
| Add API endpoint     | [LLMS-API.md#entity-structure](LLMS-API.md#entity-structure)                             |
| Add admin page       | [LLMS-FRONTEND.md#entity-configuration](LLMS-FRONTEND.md#entity-configuration)           |
| Add authentication   | [LLMS-API.md#authentication-system](LLMS-API.md#authentication-system)                   |
| Add role restriction | [LLMS-API.md#rbac-role-based-access-control](LLMS-API.md#rbac-role-based-access-control) |
| Customize form field | [LLMS-FRONTEND.md#field-types-reference](LLMS-FRONTEND.md#field-types-reference)         |
| Add lifecycle hook   | [LLMS-API.md#baseservice](LLMS-API.md#baseservice)                                       |
