# Getting Started

## Prerequisites

- Deno 2.6+ (`curl -fsSL https://deno.land/install.sh | sh`)
- PostgreSQL 16+ (or Docker)
- Git

## Install CLI

```bash
git clone https://github.com/desingh-rajan/tstack-kit.git
cd tstack-kit/packages/cli
deno task install
```

## Create Your First Workspace

```bash
tstack create workspace my-app
cd my-app/my-app-api
```

This creates a workspace with product listing entities (brands, categories,
products, variants). For non-e-commerce projects:

```bash
tstack create workspace my-blog --skip-listing
```

## Setup Database

```bash
# Start PostgreSQL (if using Docker)
docker compose up -d

# Run migrations and seed
deno task migrate:generate
deno task migrate:run
deno task db:seed
```

## Start Development

```bash
deno task dev
```

Your API is running at `http://localhost:8000`

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
ENVIRONMENT=development
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/my_app_dev
JWT_SECRET=your-secret-key
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=your-password
```

## Project Tasks

Common tasks available in generated projects:

```bash
deno task dev              # Start dev server (with watch)
deno task test             # Run tests
deno task migrate:generate # Generate migrations
deno task migrate:run      # Run migrations
deno task db:seed          # Seed database
deno task db:studio        # Open Drizzle Studio
```

## Next Steps

Next: [CLI Reference](./cli-reference.md)

## Design Philosophy: Why TStack Works This Way

### The Problem We Solved

Every new backend project starts the same way: hours spent on folder structure,
CRUD boilerplate, database configuration, validation setup, error handling
patterns. You write the same code over and over, copy-pasting from previous
projects and fixing the inevitable drift.

If you use AI assistants to write this boilerplate, you burn through 50-100
prompts just to get a project started. Each entity adds another 15-30 prompts.
For a 10-entity project, that is 200-400 prompts before you write a single line
of business logic.

TStack eliminates this entirely. One command creates a production-ready project.
One command scaffolds a complete entity with tests.

### Why Deno Over Node.js

We chose Deno 2.6+ for specific technical reasons:

1. **Built-in TypeScript** - No transpilation step, no tsconfig complexity. Your
   code runs as-is.

2. **Secure by default** - Explicit permissions mean no package can secretly
   access your filesystem or network. This matters when you install dependencies
   from the internet.

3. **Standard library** - Testing, assertions, file operations are all built-in.
   No more choosing between Jest, Mocha, Vitest, or whatever is trending this
   week.

4. **JSR registry** - First-class TypeScript package registry. No more `@types/`
   packages or declaration file mismatches.

5. **Single executable** - Install Deno once. No nvm, no node_modules bloat, no
   version conflicts between projects.

The tradeoff: smaller ecosystem than Node.js. We accept this because the
packages that matter (Hono, Drizzle, Zod) all work perfectly on Deno.

### Why Hono Over Express/Fastify

Hono is designed for modern TypeScript from the ground up:

1. **Type inference** - Route handlers know their parameter types without manual
   annotation. Express requires extensive typing gymnastics.

2. **Edge-first** - Runs on Deno Deploy, Cloudflare Workers, Bun. Your API is
   portable across runtimes.

3. **Tiny footprint** - 14KB minified. Express is 200KB+. Matters when you
   deploy to edge functions with cold start penalties.

4. **Modern API** - Built on Web Standards (Request/Response). No proprietary
   abstractions that lock you into a framework.

### Why Drizzle Over Prisma/TypeORM

1. **SQL-first** - You write actual SQL patterns, not a new query language. Your
   database knowledge transfers directly.

2. **No code generation step** - Prisma requires `prisma generate` after every
   schema change. Drizzle schemas are just TypeScript files.

3. **Type inference** - Schema changes automatically update all query types. No
   manual syncing between schema and code.

4. **Migrations you control** - Generated migrations are readable SQL. You can
   edit them, understand them, and debug them.

### Why PostgreSQL Only

We do not support MySQL, SQLite, or MongoDB. This is intentional:

1. **Feature completeness** - PostgreSQL has JSON columns, array types,
   full-text search, and proper transaction isolation. We use these features.

2. **Consistency** - Supporting multiple databases means lowest-common-
   denominator features. We would rather give you one excellent database
   experience.

3. **Production proven** - PostgreSQL handles everything from hobby projects to
   enterprise scale. You will not outgrow it.

4. **Docker simplicity** - One database engine means one Docker image, one
   connection pattern, one set of debugging tools.

### The Three-Database Pattern

Every workspace creates three databases: `_dev`, `_test`, `_prod`. This is not
optional. Here is why:

**Without separate test database:**

- Tests modify your development data
- You cannot run tests while developing
- Test failures leave dirty state
- CI/CD cannot run tests reliably

**Without separate production database:**

- Development mistakes affect real users
- No staging environment for validation
- Database migrations are untested before production

The three-database pattern ensures complete isolation. Your tests never touch
development data. Your development never touches production. This pattern is
standard in Rails, Django, and every serious web framework.

### Why JWT Over Sessions

Sessions require server-side storage (Redis, database, memory). This adds:

- Infrastructure complexity
- State synchronization across multiple servers
- Session store as single point of failure

JWT tokens are stateless. The token contains all necessary claims. Any server
can validate any token without consulting external storage. This enables:

- Horizontal scaling without shared state
- Simpler deployment (no Redis dependency)
- Mobile app compatibility (no cookies needed)

The tradeoff: you cannot invalidate JWT tokens before expiry. We mitigate this
with short expiry times (1 hour default) and token refresh patterns.

### Why Generated Code Over Magic

Some frameworks hide complexity behind "conventions" that feel like magic. You
do not know what code runs until something breaks.

TStack generates actual TypeScript files you can read, understand, and modify.
When you run `tstack scaffold products`, you get 8 files with real code. No
hidden behavior, no runtime reflection, no framework internals to debug.

This means:

- **Debuggable** - Set breakpoints, add console.log, trace execution
- **Customizable** - Modify any generated file without fighting the framework
- **Educational** - New team members can read the code and understand it
- **Portable** - If you outgrow TStack, your code still works

### The Cost of Boilerplate

We measured time savings across real projects:

| Task                   | Manual Approach | TStack Approach | Savings    |
| ---------------------- | --------------- | --------------- | ---------- |
| Project setup          | 2-4 hours       | 2 minutes       | 98%        |
| Entity scaffold (each) | 30-60 minutes   | 30 seconds      | 99%        |
| 10-entity project      | 8-14 hours      | 10 minutes      | 98%        |
| Test infrastructure    | 2-3 hours       | Included        | 100%       |
| Admin panel            | Days            | Included        | Days saved |

If you value your time at any meaningful rate, the math is clear. Spend your
hours on business logic, not plumbing.
