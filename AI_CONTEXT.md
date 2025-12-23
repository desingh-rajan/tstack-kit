# TStack Kit Context for AI Agents

> **Purpose**: This document provides a comprehensive overview of the
> `tstack-kit` repository for AI agents (and humans) to understand the
> architecture, standards, and workflows immediately.

## 1. Project Overview

**TStack Kit** is a monorepo toolkit for building type-safe SaaS applications.

- **Goal**: Ship products, not boilerplate.
- **Core Stack**:
  - **Runtime**: Deno 2.x
  - **Backend**: Hono (Web Framework)
  - **Database**: PostgreSQL 16+
  - **ORM**: Drizzle ORM
  - **Validation**: Zod
  - **Frontend/Admin**: Fresh + Preact + DaisyUI
  - **Auth**: JWT (with JOSE), RBAC (User/Admin/Superadmin)

## 2. Repository Structure

The project is a **monorepo** managed with Deno workspaces.

```text
tstack-kit/
├── packages/
│   ├── cli/                # The `tstack` CLI tool (entry point)
│   ├── admin/             # Shared Admin UI library/adapters
│   ├── api-starter/       # TEMPLATE for new API projects
│   ├── admin-ui-starter/  # TEMPLATE for new Admin UI projects
│   └── starter/           # (Legacy/Combined starter reference)
├── reference-kit/         # Example usage / reference implementation
├── docs/                  # Documentation
├── scripts/               # Global maintenance scripts
├── deno.json              # Workspace configuration
└── CODING_STANDARDS.md    # CRITICAL: Read this before writing code
```

### Key Packages

- **`packages/api-starter`**: The blueprint for the backend. Uses Hono +
  Drizzle.
  - `src/main.ts`: Entry point.
  - `src/entities/`: Domain logic (Service/Controller/Model/DTO).
  - `src/shared/`: Base classes (`BaseService`, `BaseController`).
- **`packages/admin-ui-starter`**: The blueprint for the admin panel. Uses
  Fresh.
  - `routes/`: Fresh file-based routing.
  - `islands/`: Interactive components (Preact).
  - `components/`: UI components (DaisyUI).
- **`packages/cli`**: The tool that scaffolds new projects by copying these
  starters.

## 3. Development Workflows

### Environment Setup

- **Database**: Requires PostgreSQL.
- **Env Vars**: `.env` files mimic `.env.example`.
- **Deno**: Uses `deno.json` tasks for everything.

### Common Commands

```bash
# Root
deno task fmt       # Format all
deno task lint      # Lint all
deno task test      # Run all tests

# Package Level (e.g., inside packages/api-starter)
deno task dev       # Start dev server
deno task migrate:generate # Create migrations based on schema changes
deno task migrate:run      # Apply migrations
deno task db:seed          # Seed data
```

## 4. CLI & Workspace Architecture

The `tstack` CLI (`packages/cli`) is the core tool for managing the monorepo.

### `tstack create workspace [name]`

Creates a new folder with independent microservices.

- **Components**:
  - `[name]-api`: Backend (Hono + Drizzle) - cloned from `packages/api-starter`.
  - `[name]-admin-ui`: Admin Panel (Fresh) - cloned from
    `packages/admin-ui-starter`.
  - _(Future)_ `[name]-store`: Storefront (Fresh) - cloned from
    `packages/storefront-starter` (Issue #68).
- **Flags**:
  - `--github-org=[org]`: Auto-creates private GitHub repos for each app.
  - `--skip-remote`: Skips git remote creation.
  - `--with-[component]`: Only create specific components (e.g., `--with-api`).

### `tstack scaffold [entity]`

Generates files in `src/entities/[entity]`:

- Model, DTO, Service, Controller, Routes, Tests.
- Automatically updates `deno.json` task names if needed.

## 5. Coding Standards (CRITICAL)

Refer to `CODING_STANDARDS.md` in the root for the full list. **Top Rules:**

1. **NO Emojis** in logs/comments/code.
2. **Explicit Return Types** for all public functions.
3. **Strict TypeScript**: No `any` without
   `// deno-lint-ignore no-explicit-any`.
4. **Colocated Tests**: `user.service.ts` lives next to `user.test.ts`.
5. **Real DB Tests**: Do NOT mock the database. Use the test DBs.
6. **Structured Logging**: Use `[INFO]`, `[ERROR]`, etc.

## 5. Architecture Patterns

### Backend (API)

- **MVC-ish**:
  - `start.ts` -> `main.ts` (App Setup) -> `*.route.ts` (Hono Routes) ->
    `*.controller.ts` -> `*.service.ts` -> `*.model.ts` (Drizzle).
- **Base Classes**:
  - `BaseService`: Handles common CRUD (create, findMany, etc.).
  - `BaseController`: Connects routes to service methods with standardized
    responses.
  - **Optimization**: Most entities just extend these and add overrides.

### Frontend (Fresh)

- **Islands Architecture**: Minimal JS setup.
- **Routing**: `routes/[name].tsx`.
- **Data Fetching**: Handlers in `routes/` fetch data via the API (or direct DB
  if applicable, but usually API).

## 6. Testing Strategy

- **CLI Tests**: `packages/cli`
- **Unit/Integration**: Run `deno task test` in respective packages.
- **Databases**:
  - `tonystack_dev` (Dev)
  - `tonystack_test` (Test - wiped/reset automatically)
  - `tonystack_prod` (Prod)
- **Pattern**: Setup DB -> Run Test -> Cleanup.

## 7. Current Objectives (Context for Agents)

- **Issue #67**: Reviewing this file (Complete!).
- **Issue #68**: Creating a `storefront-starter` package (Fresh + Preact) for
  public-facing e-commerce.
- **Project Structure Update**: Moving towards "Microservice-ready" structure
  where a workspace creates manageable independent apps.
