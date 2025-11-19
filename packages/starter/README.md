# Project README

Replace the heading below with your actual project name (for example,
`MyBlog API`).

## Your Project Name

## 1. Overview

This is a lightweight REST API built on Deno + Hono + Drizzle (PostgreSQL) with:

- Modular, entity‑centric folder structure (`src/entities/<feature>`)
- Built‑in authentication (JWT, user roles)
- Seed scripts for users and site settings
- Typed database access via Drizzle ORM
- Clear environment & migration workflow
- Comprehensive test tasks (setup, migrate, seed, run, coverage)

## 2. Stack

- Runtime: Deno
- Web: Hono
- ORM: Drizzle + PostgreSQL
- Validation: Zod
- Auth: JWT (HS256) + role checks (user, superadmin)

## 3. Requirements

- Deno (latest 2.x)
- PostgreSQL 14+
- Bash / Docker (optional for local DB)

## 4. Environment Variables

Create one of: `.env.development.local` (preferred) or `.env`.

| Variable          | Required  | Default                   | Notes                                         |
| ----------------- | --------- | ------------------------- | --------------------------------------------- |
| `DATABASE_URL`    | ✅        | —                         | Postgres connection string (must exist)       |
| `PORT`            | ❌        | 8000                      | HTTP port                                     |
| `ENVIRONMENT`     | ❌        | development               | Allowed values: development, test, production |
| `ALLOWED_ORIGINS` | ❌        | <http://localhost:3000>   | Comma separated list                          |
| `JWT_SECRET`      | ✅ (prod) | `change-me-in-production` | Replace in production                         |
| `JWT_ISSUER`      | ❌        | tonystack                 | Token issuer name                             |
| `JWT_EXPIRY`      | ❌        | 1h                        | e.g. `1h`, `30m`, `7d`                        |

Load order (highest priority first): system env → `.env.<env>.local` → `.env`.

## 5. Project Structure

```text
src/
  main.ts                # App bootstrap (mount routes, middleware)
  config/                # env + database setup
  auth/                  # auth routes, services, models
  entities/              # feature domains (add your own here)
    articles/            # example content entity
    site_settings/       # dynamic configuration system
  shared/                # errors, jwt, validation, middleware helpers
migrations/              # Drizzle migration files (generated)
scripts/                 # Migration, seed, utility scripts
tests/                   # (If present) higher‑level or docs for tests
deno.json                # Tasks & dependency mapping
```

## 6. Core Tasks (deno.json)

| Task                           | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `deno task dev`                | Run with watch & all permissions         |
| `deno task start`              | Run once (no watch)                      |
| `deno task env:validate`       | Check required env vars                  |
| `deno task migrate:generate`   | Create migration from current schema     |
| `deno task migrate:run`        | Apply pending migrations                 |
| `deno task db:studio`          | Open Drizzle Studio (schema browser)     |
| `deno task db:seed`            | Seed all default data (users + settings) |
| `deno task db:seed:superadmin` | Seed only superadmin user                |
| `deno task db:seed:alpha`      | Seed demo regular user                   |
| `deno task db:seed:user`       | Seed generic regular user                |
| `deno task db:seed:site`       | Seed system site settings                |
| `deno task setup`              | Validate env → migrate → seed            |
| `deno task test:full`          | Full test DB setup then run tests        |
| `deno task test`               | Run tests + cleanup test DB              |
| `deno task test:setup`         | Create test DB + apply migrations        |
| `deno task test:migrate`       | Migrate test DB only                     |
| `deno task test:seed`          | Seed test data                           |
| `deno task test:reset`         | Recreate + migrate + seed test DB        |
| `deno task test:watch`         | Watch mode tests                         |
| `deno task test:coverage`      | Coverage report to `coverage/`           |
| `deno task test:check`         | Health check (DB + basic readiness)      |
| `deno task cleanup:test-db`    | Remove test database artifacts           |
| `deno task fmt`                | Format source                            |
| `deno task lint`               | Lint source                              |

## 7. First Run

```bash
# 1. Create environment file
cp .env.example .env  # (If provided) then edit values

# 2. Start PostgreSQL (Docker optional)
docker compose up -d postgres

# 3. Generate initial schema (after editing models)
deno task migrate:generate -- --name initial_schema
deno task migrate:run

# 4. Seed core data
deno task db:seed

# 5. Start app
deno task dev
```

Visit: `http://localhost:8000`.

## 8. Entities & Conventions

Each scaffolded entity consists of five files:

```
<entity>.model.ts       # Drizzle table definition
<entity>.dto.ts         # Zod schemas (create/update/query)
<entity>.service.ts     # Business logic / data access
<entity>.controller.ts  # HTTP handlers (thin)
<entity>.route.ts       # Route registration
```

Naming: plural directory (e.g. `products`), table plural, route plural. Add new
fields before generating migrations to keep history clean.

## 9. Database & Migrations

- Edit models in `src/entities/**/<name>.model.ts`.
- Generate migration AFTER changes: `deno task migrate:generate`.
- Apply: `deno task migrate:run`.
- Inspect: `deno task db:studio`.

Never hand‑edit generated SQL unless absolutely necessary; prefer evolving the
model then regenerating a new migration.

## 10. Seeding

Full seed (users + settings): `deno task db:seed`.

Users created:

- Superadmin: `superadmin@tstack.in` (full privileges)
- Alpha user: `alpha@tstack.in` (regular)
- Regular user (script) for additional testing.

System site settings auto‑seed & self‑heal on access (see settings section).

## 11. Authentication

- Login / Register endpoints under `auth/` routes.
- JWT header: `Authorization: Bearer <token>`.
- Token payload includes `userId` + `email`.
- Change `JWT_SECRET` before production; rotate by updating env and forcing
  logout (delete tokens table rows).

## 12. Site Settings System

Dynamic configuration with protected “system” keys:

- Auto‑seed on first read
- Zod validated (cannot store invalid JSON)
- Reset endpoints: `/site-settings/<key>/reset` & `/site-settings/reset-all`
- Public vs private settings (frontend can fetch only public)

Add new system setting:

1. Add schema in `site_settings/schemas/*.schemas.ts`
2. Register in `site_settings/schemas/index.ts`
3. (Re)start server – seeding happens automatically

## 13. Articles Example Entity

Demonstrates protected write operations vs public read. Use it as a pattern for
ownership + role checks.

## 14. Testing Workflow

Recommended full cycle for CI/local:

```bash
deno task test:full        # Build test DB + run tests
deno task test:coverage    # Optional coverage
```

Fast inner loop while coding:

```bash
deno task test:watch
```

Health check (DB + basic readiness):

```bash
deno task test:check
```

## 15. Error Handling

Central error utilities live under `shared/utils/errors.ts`. Throw typed errors
(`BadRequestError`, `UnauthorizedError`, etc.) from services/controllers – the
global handler converts them to structured JSON responses.

## 16. Formatting & Linting

```bash
deno task fmt
deno task lint
```

Run before commits to maintain consistency and catch drift early.

## 17. Deployment (Docker Compose)

```bash
export ENVIRONMENT=production
cp .env .env.production.local  # or create fresh
# Edit secrets (JWT_SECRET, DATABASE_URL)
docker compose up --build -d
docker compose exec app deno task migrate:run
docker compose exec app deno task db:seed
```

External database build:

```bash
docker build -t my-api .
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="replace-with-strong-secret" \
  --name my-api \
  my-api
```

## 18. Maintenance Tips

- Always modify models BEFORE first migration generation.
- Keep seed scripts idempotent (current scripts are safe to re‑run).
- Avoid leaking secrets: never mark sensitive settings `isPublic`.
- Rotate JWT secret → revoke existing tokens (truncate `auth_tokens`).

## 19. Customizing Further

- Add new middleware under `shared/`.
- Introduce caching layer (e.g., Redis) behind services.
- Generate additional entities via CLI (from the toolkit) or manually following
  the pattern.

## 20. License

MIT – see root `LICENSE`.

## 21. Support

Toolkit issues / discussions: upstream repository. For this project, manage via
your own issue tracker.

---

Happy building! Replace placeholder names above and start shipping.
