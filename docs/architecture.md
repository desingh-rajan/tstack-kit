# Architecture

## Multi-Service Starter Kit (Not a Monorepo)

TStack Kit is a **starter kit** that generates independent services, not a
traditional monorepo.

### Key Distinction

| Monorepo                    | TStack Kit                        |
| --------------------------- | --------------------------------- |
| Packages share dependencies | Each project has own dependencies |
| Single lockfile             | Each project has own lockfile     |
| Packages import each other  | Projects are independent          |
| Deploy together             | Deploy separately                 |

### Repository Structure

```text
tstack-kit/                    # Starter kit repository
├── packages/
│   ├── cli/                   # CLI tool (future: JSR as @tonystack/cli)
│   ├── admin/                 # Published to JSR as @tstack/admin
│   ├── api-starter/           # Template (copied to user projects)
│   └── admin-ui-starter/      # Template (copied to user projects)
├── reference-kit/             # Example implementations
├── docs/                      # Documentation (you are here)
└── deno.json                  # Kit version (for releases)
```

### Generated Workspace Structure

When you run `tstack create workspace my-app`:

```text
my-app/
├── my-app-api/                # Independent API project
│   ├── .git/                  # Own git repo
│   ├── deno.json              # Own dependencies
│   ├── docker-compose.yml     # Own Docker config
│   └── src/
└── my-app-admin-ui/           # Independent UI project
    ├── .git/                  # Own git repo
    ├── deno.json              # Own dependencies
    └── routes/
```

Each project:

- Has its own `.git` directory
- Can be pushed to separate GitHub repos
- Has independent Docker deployment
- Manages own dependencies

## Tech Stack

| Layer         | Technology               |
| ------------- | ------------------------ |
| Runtime       | Deno 2.0+                |
| API Framework | Hono                     |
| ORM           | Drizzle                  |
| Database      | PostgreSQL 16+           |
| Validation    | Zod                      |
| Admin UI      | Fresh + Preact + DaisyUI |

## Data Flow

```text
Request -> Hono Router -> Controller -> Service -> Drizzle -> PostgreSQL
                              |
                              v
                          Response
```

## Authentication Flow

```text
Login Request
     |
     v
Validate Credentials (Service)
     |
     v
Generate JWT Token
     |
     v
Return Token to Client
     |
     v
Subsequent Requests include Authorization header
     |
     v
JWT Middleware validates token
     |
     v
Protected route handler executes
```

## Database Architecture

Each workspace gets 3 databases:

| Database      | Purpose           |
| ------------- | ----------------- |
| `my_app_dev`  | Development       |
| `my_app_test` | Automated testing |
| `my_app_prod` | Production        |

## Deployment Options

Since projects are independent:

- Deploy API to any Deno-compatible host
- Deploy Admin UI to Deno Deploy or similar
- Use provided `docker-compose.yml` for containerized deployment
- Scale services independently

---

## Design Philosophy: Why the Architecture Works This Way

### Multi-Service vs Monorepo: A Deliberate Choice

TStack is NOT a monorepo. This is intentional.

**What a monorepo looks like:**

```text
my-company/
├── packages/
│   ├── api/              # Imports from @my-company/shared
│   ├── admin-ui/         # Imports from @my-company/shared
│   ├── customer-ui/      # Imports from @my-company/shared
│   └── shared/           # Shared types, utils
├── package.json          # Root lockfile
└── turbo.json            # Turborepo config
```

**What TStack generates:**

```text
my-saas/
├── my-saas-api/          # Complete, independent project
│   ├── .git/
│   ├── deno.json
│   └── (everything needed to run)
└── my-saas-admin-ui/     # Complete, independent project
    ├── .git/
    ├── deno.json
    └── (everything needed to run)
```

**Why this matters:**

1. **Independent deployment** - Ship API fix without touching UI. Deploy UI
   redesign without API changes.

2. **Independent scaling** - 10 API instances, 2 UI instances. Scale to actual
   load patterns.

3. **Independent teams** - API team has full ownership. UI team has full
   ownership. No merge conflicts.

4. **Simpler mental model** - Each project is self-contained. No hunting for
   code across packages.

5. **Easier onboarding** - New developer? Clone one repo, not a massive
   monorepo.

**The tradeoff:**

Shared code must be published (like @tstack/admin) or duplicated. TStack accepts
this tradeoff because:

- True shared code is rare (types diverge, APIs evolve)
- Published packages have clear contracts
- Duplication is sometimes better than coupling

### Why Deno Over Node.js

| Aspect          | Node.js                        | Deno                      |
| --------------- | ------------------------------ | ------------------------- |
| TypeScript      | Requires transpilation         | Native support            |
| Package manager | npm/yarn/pnpm (choice fatigue) | Built-in (URLs or JSR)    |
| Security        | Full filesystem/network access | Explicit permissions      |
| Standard lib    | Minimal, needs npm packages    | Comprehensive std library |
| Top-level await | Requires ESM config            | Just works                |
| Test runner     | Jest/Vitest/Mocha (choice)     | Built-in                  |
| Formatter       | Prettier (config needed)       | Built-in                  |
| Linter          | ESLint (config needed)         | Built-in                  |

**Deno eliminates decisions.**

Starting a Node.js project:

```bash
npm init
# TypeScript? Install ts-node, tsconfig.json
# Linting? Install ESLint, .eslintrc.json
# Formatting? Install Prettier, .prettierrc
# Testing? Install Jest or Vitest, config file
# 50 lines of config before first line of code
```

Starting a Deno project:

```bash
deno init
# TypeScript: built-in
# Linting: deno lint
# Formatting: deno fmt
# Testing: deno test
# Zero config, start coding
```

**The Deno 2.0 inflection point:**

Deno 2.0 added npm compatibility, making Node.js packages usable. This removed
the main objection ("but my npm packages won't work"). TStack adopted Deno 2.0
as minimum version because:

1. Full npm compatibility when needed
2. Mature standard library
3. Stable APIs after 2.0 milestone

### Why Hono Over Express/Fastify

Express is the default choice for Node.js APIs. TStack chose Hono instead.

**Express issues:**

```typescript
// Express: req and res are loosely typed
app.get("/users/:id", (req, res) => {
  const id = req.params.id; // string | undefined
  res.json({ user }); // No type checking on response
});
```

**Hono advantages:**

```typescript
// Hono: Full type inference
app.get("/users/:id", (c) => {
  const id = c.req.param("id"); // Typed path param
  return c.json({ user }); // Typed response
});
```

| Feature          | Express            | Hono              |
| ---------------- | ------------------ | ----------------- |
| Bundle size      | 2MB+ with deps     | 14KB              |
| TypeScript       | Requires @types    | Native            |
| Type inference   | Manual types       | Automatic         |
| Edge runtime     | Node.js only       | Works everywhere  |
| Response helpers | Manual res.json()  | Typed c.json()    |
| Middleware       | Function signature | Type-safe context |

**Why not Fastify?**

Fastify is excellent and fast. But:

1. Heavier than Hono (still Node.js focused)
2. Schema system different from Zod (TStack uses Zod)
3. Hono's Deno support is first-class

### Why Drizzle Over Prisma/TypeORM

**Prisma issues:**

```typescript
// Prisma: Generates code, requires build step
// prisma/schema.prisma defines models
// npx prisma generate creates client
// Types come from generated code, not your code
```

**TypeORM issues:**

```typescript
// TypeORM: Decorators and class-based
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
// Decorators have TypeScript issues, reflect-metadata needed
```

**Drizzle advantages:**

```typescript
// Drizzle: Plain TypeScript, no generation
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

// Types inferred directly from schema
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
```

| Feature         | Prisma          | TypeORM       | Drizzle          |
| --------------- | --------------- | ------------- | ---------------- |
| Code generation | Required        | No            | No               |
| Build step      | Required        | No            | No               |
| Type source     | Generated files | Decorators    | Schema inference |
| Query style     | Custom DSL      | Query builder | SQL-like         |
| SQL control     | Limited         | Moderate      | Full             |
| Bundle size     | 2MB+            | 500KB+        | 50KB             |

**"SQL-first" philosophy:**

Drizzle queries look like SQL:

```typescript
// Drizzle
await db
  .select()
  .from(users)
  .where(eq(users.role, "admin"))
  .orderBy(desc(users.createdAt))
  .limit(10);

// Equivalent SQL
SELECT * FROM users WHERE role = 'admin' ORDER BY created_at DESC LIMIT 10;
```

If you know SQL, you know Drizzle. No new query language to learn.

### Why PostgreSQL Only

TStack supports only PostgreSQL. Not MySQL, not SQLite, not MongoDB.

**Why limit choice?**

1. **PostgreSQL is enough** - JSON columns, full-text search, arrays, enums,
   CTEs. PostgreSQL handles 99% of use cases.

2. **Testing reality** - Supporting multiple databases means testing multiple
   databases. TStack tests against PostgreSQL, so PostgreSQL is supported.

3. **Drizzle specificity** - Drizzle's PostgreSQL driver uses PostgreSQL-
   specific features. Multi-database support means lowest common denominator.

4. **Operational simplicity** - One database to learn, one database to tune, one
   database to backup.

"But I need MySQL for..." - Probably not. MySQL's advantages (replication, some
edge cases) rarely matter for new projects. PostgreSQL's advantages (JSONB,
arrays, better SQL compliance) matter often.

"But SQLite for development..." - PostgreSQL in Docker is nearly as simple:

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
```

And your dev environment matches production. No "works in SQLite, fails in
PostgreSQL" bugs.

### The Three-Database Pattern

Every TStack project creates three databases:

```text
my_app_dev    # Your daily development
my_app_test   # Automated tests
my_app_prod   # Production deployment
```

**Why not one database with schemas?**

PostgreSQL supports schemas (namespaces within a database). We could do:

```sql
my_app.dev.*
my_app.test.*
my_app.prod.*
```

Separate databases are better because:

1. **Complete isolation** - Runaway query in dev can't affect test
2. **Independent permissions** - Production user can't access dev
3. **Separate backups** - Backup production without dev data
4. **Clear boundaries** - No accidental cross-environment queries

**Why not environment variables only?**

Some frameworks use:

```bash
DATABASE_URL=postgres://...dev   # .env
DATABASE_URL=postgres://...test  # .env.test
DATABASE_URL=postgres://...prod  # .env.prod
```

TStack does this AND creates the databases:

```bash
tstack create my-app
# Creates my_app_dev, my_app_test, my_app_prod
# Sets up .env files with correct URLs
```

No manual database creation. No forgetting to create test database before
running tests.

### Why JWT Over Sessions

**Session-based auth:**

```text
Login -> Server creates session -> Session ID in cookie
Request -> Cookie sent -> Server looks up session -> User identified
```

**JWT auth:**

```text
Login -> Server creates JWT -> Token returned
Request -> Token in header -> Server verifies signature -> User identified
```

**Why JWT for TStack:**

1. **Stateless** - No session storage needed. Server verifies signature, done.

2. **Horizontal scaling** - Any server instance can verify any token. No shared
   session store needed.

3. **API-first** - Tokens work for mobile apps, CLI tools, third-party
   integrations. Cookies are web-only.

4. **Microservice ready** - Token can be passed between services. Sessions
   require shared storage.

**The refresh token pattern:**

TStack uses short-lived access tokens (1 hour) with longer-lived refresh tokens
(7 days):

```text
Login -> Access token (1h) + Refresh token (7d)
Request -> Access token in header
Token expires -> POST /auth/refresh with refresh token -> New access token
```

This balances security (short access token window) with UX (don't re-login every
hour).

### Why Generated Code Over Magic

Rails and similar frameworks use "magic" - code that runs through conventions:

```ruby
# Rails: This "just works" through naming conventions
class UsersController < ApplicationController
  # GET /users routes here by convention
  # user_params helper exists by convention
  # @user instance variable passed to view by convention
end
```

TStack generates explicit code:

```typescript
// TStack: Everything is explicit
app.get("/users", userController.findAll);
app.post("/users", userController.create);
// No convention magic, just code
```

**Why explicit over magic:**

1. **Debuggable** - Stack traces show actual code paths, not framework internals

2. **Searchable** - "Where is /users handled?" Grep finds it.

3. **Learnable** - Read the code to understand behavior. No framework docs
   needed.

4. **Modifiable** - Change the code, change the behavior. No fighting
   conventions.

**The cost:**

More code to read. More files in the project. TStack accepts this because:

- Code is generated (you don't type it)
- Explicit code is maintainable code
- Magic becomes tech debt

### Independent Deployment Strategy

Each generated project includes deployment configuration:

```text
my-app-api/
├── Dockerfile
├── docker-compose.yml
└── docker-compose.dev.yml
```

**Why Docker Compose?**

1. **Universal** - Works on any machine with Docker
2. **Reproducible** - Same environment dev to prod
3. **Simple** - `docker compose up` starts everything
4. **Complete** - App + database + any dependencies

**Why not Kubernetes configs?**

K8s adds complexity most projects don't need initially. When you need K8s, the
Docker image still works - you write K8s manifests for it.

TStack provides the 80% solution. K8s is the 20% you add when scale demands.

### Future-Proofing Through Simplicity

TStack's architecture makes specific bets:

| Bet                 | Why                                  |
| ------------------- | ------------------------------------ |
| Deno over Node      | TypeScript-first is the future       |
| Hono over Express   | Edge runtime support matters         |
| Drizzle over Prisma | SQL knowledge > proprietary DSL      |
| PostgreSQL only     | One thing done well                  |
| Generated code      | Explicit > magic for maintainability |
| Multi-service       | Independent deployment is mandatory  |

These bets could be wrong. But they're coherent - each reinforces the others. A
stack that tries to support everything supports nothing well.

If your needs diverge from TStack's bets, fork it. The code is explicit and
modifiable. That's the point.

Next: [Docs Index](./README.md)
