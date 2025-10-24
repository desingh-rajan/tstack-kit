# TonyStack

> **Rails-like DX for Deno developers who want less framework, more control.**

A lightweight, opinionated toolkit for building fast, type-safe backend services
using **Deno**, **Hono**, **Drizzle**, and **SQLite** (with PostgreSQL scaling
support).

---

## What's Included

### 1. **Starter Package** (`packages/starter/`)

Production-ready backend template with:

- JWT authentication system
- User management with CRUD
- Role-based access control
- MVC architecture
- SQLite (dev) / PostgreSQL (prod)
- Docker deployment configs
- Drizzle ORM with migrations
- Comprehensive error handling
- Security middleware

### 2. **CLI Tool** (`packages/cli/`)

Rails-like scaffolding generator:

```bash
tstack scaffold products
# Generates: model, dto, service, controller, route
```

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tonystack.git
cd tonystack

# Install CLI globally
cd packages/cli
deno task install

# Verify installation
tstack --version
```

### Create Your First Project

```bash
# Copy starter to new project
cp -r packages/starter ~/my-backend
cd ~/my-backend

# Setup environment
cp .env.example .env
nano .env # Edit settings if needed

# Start development server
deno task dev

# Generate new entities
tstack scaffold products
tstack scaffold orders
```

**Server runs at:** <http://localhost:8000>

---

## Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get started in 5 minutes
- **[How to Use](HOW_TO_USE.md)** - Step-by-step project setup
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Complete 8-phase workflow
- **[SQLite in Production](docs/SQLITE_PRODUCTION.md)** - Using SQLite for
  small-scale production
- **[E-commerce Example](docs/EXAMPLE_ECOMMERCE.md)** - Complete backend example
- **[Project Checklist](docs/PROJECT_CHECKLIST.md)** - Track your project
  progress

---

## Features

### Authentication & Authorization

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (user/admin)
- Protected routes middleware

### ️ Database

- **SQLite** for development (zero setup)
- **PostgreSQL** for production (same code!)
- Drizzle ORM with full type safety
- Automatic migrations with `drizzle-kit`

### ️ Architecture

- **MVC Pattern** - Model, Service, Controller separation
- **Domain-Driven** - Entities organized by feature
- **Type-Safe** - Full TypeScript with inference
- **Testable** - Services isolated from HTTP layer

### ️ Developer Experience

- **Scaffolding CLI** - Generate entities in seconds
- **Hot Reload** - Fast development with `--watch`
- **Drizzle Studio** - Visual database browser
- **Docker Ready** - Dev and prod configurations

---

## Project Structure

```
tonystack/
├── packages/
│ ├── cli/ # Scaffolding tool
│ │ ├── mod.ts # CLI entry point
│ │ └── src/
│ │ ├── commands/ # scaffold command
│ │ ├── templates/ # Code generators
│ │ └── utils/ # String utils, file writer
│ └── starter/ # Backend template
│ ├── src/
│ │ ├── config/ # Database, env config
│ │ ├── entities/ # Domain entities
│ │ │ └── users/ # User entity (pre-built)
│ │ ├── shared/ # Middleware, utils
│ │ └── main.ts # App entry point
│ ├── tests/ # Test structure
│ ├── docker-compose.yml
│ └── Dockerfile
├── docs/ # Documentation
│ ├── EXAMPLE_ECOMMERCE.md
│ ├── PROJECT_CHECKLIST.md
│ └── SQLITE_PRODUCTION.md
├── QUICKSTART.md
├── HOW_TO_USE.md
├── DEVELOPER_GUIDE.md
└── README.md # You are here
```

---

## Example: Scaffolding an Entity

```bash
# Generate a products entity
tstack scaffold products

# Creates 5 files:
# ✓ src/entities/products/product.model.ts (Drizzle schema)
# ✓ src/entities/products/product.dto.ts (Validation)
# ✓ src/entities/products/product.service.ts (Business logic)
# ✓ src/entities/products/product.controller.ts (HTTP handlers)
# ✓ src/entities/products/product.route.ts (Routes)
```

Then register in `main.ts`:

```typescript
import productRoutes from "./entities/products/product.route.ts";
app.route("/api", productRoutes);
```

**Instant API:**

```
GET /api/products → List products
POST /api/products → Create product
GET /api/products/:id → Get product
PUT /api/products/:id → Update product
DELETE /api/products/:id → Delete product
```

---

## Why TonyStack?

### Compared to Existing Solutions

| Feature              | TonyStack           | Oak       | Express (Node)   | NestJS (Deno) |
| -------------------- | ------------------- | --------- | ---------------- | ------------- |
| **Runtime**          | Deno                | Deno      | Node.js          | Deno          |
| **Framework Weight** | Lightweight         | Medium    | Light            | Heavy         |
| **Type Safety**      | Full                | Partial   | Minimal          | Full          |
| **Scaffolding**      | Built-in            | ❌ Manual | ❌ Manual        | ✅ Via CLI    |
| **ORM**              | Drizzle (type-safe) | Manual    | Prisma/TypeORM   | TypeORM       |
| **Database Switch**  | Zero-rewrite        | Manual    | Requires changes | Adapter-based |
| **Learning Curve**   | Low                 | Medium    | Low              | High          |
| **Production Ready** |                     | ✅        | ✅               | ✅            |

### Perfect For

- **Small client projects** (1-10 users)
- **MVPs and prototypes**
- **Backend APIs for SPAs**
- **Microservices**
- **Internal tools**
- **Freelance projects**

### Not Ideal For

- Massive enterprise apps (100+ tables)
- Real-time WebSocket apps (yet)
- GraphQL-first projects
- Multi-tenant SaaS at scale

---

## CLI Commands

```bash
# Scaffold commands
tstack scaffold <entity-name> # Generate entity
tstack scaffold products # Example: products entity
tstack scaffold blog-posts --force # Overwrite existing

# Options
--help, -h # Show help
--version, -v # Show version
--force, -f # Overwrite files
--dir <path> # Target directory
```

---

## Docker Deployment

### Development (SQLite)

```bash
docker-compose --profile dev up --build
```

### Production (PostgreSQL)

```bash
export JWT_SECRET="your-production-secret"
export POSTGRES_PASSWORD="secure-password"
export ALLOWED_ORIGINS="https://yourdomain.com"

docker-compose --profile prod up --build -d
```

---

## Testing

```bash
# Run tests
cd packages/starter
deno task test

# Run with coverage
deno test --coverage=coverage tests/

# Test specific file
deno test tests/unit/entities/users/user.service.test.ts --allow-all
```

---

## 🗺 Roadmap

### Phase 1: Core (Completed)

- [x] CLI scaffolding tool
- [x] Starter template with auth
- [x] SQLite & PostgreSQL support
- [x] Docker configs
- [x] Documentation

### 🚧 Phase 2: Enhancement (Next)

- [ ] **Rails-like column definitions** -
      `tstack scaffold posts title:text content:text published:boolean`
- [ ] Auto-migration generation from scaffold
- [ ] File upload utilities
- [ ] Rate limiting middleware
- [ ] Caching layer
- [ ] Email service integration
- [ ] Testing utilities
- [ ] Relationship scaffolding - `tstack scaffold comments post_id:references`

### 🔮 Phase 3: Advanced

- [ ] GraphQL support
- [ ] WebSocket support
- [ ] Job queue system
- [ ] Admin dashboard generator
- [ ] OpenAPI/Swagger docs
- [ ] Multi-tenancy support

### Phase 4: Community

- [ ] Publish to JSR (`@tonystack/cli`, `@tonystack/core`)
- [ ] More example projects
- [ ] Video tutorials
- [ ] Community templates
- [ ] Plugin system

---

## Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing`
5. **Open** a Pull Request

### Development Setup

```bash
git clone https://github.com/yourusername/tonystack.git
cd tonystack

# Test CLI
cd packages/cli
deno task dev scaffold test-entity

# Test starter
cd packages/starter
deno task dev
```

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE)
file for details.

---

## Support & Community

- **Email:** <your-email@example.com>
- **Issues:** [GitHub Issues](https://github.com/yourusername/tonystack/issues)
- **Discussions:**
  [GitHub Discussions](https://github.com/yourusername/tonystack/discussions)
- **📖 Docs:** [Full Documentation](QUICKSTART.md)

---

## Acknowledgments

Built with amazing open-source projects:

- [Deno](https://deno.land) - Modern JavaScript/TypeScript runtime
- [Hono](https://hono.dev) - Ultrafast web framework
- [Drizzle](https://orm.drizzle.team) - Type-safe ORM
- [Deno Standard Library](https://jsr.io/@std) - Official Deno modules

---

## Stats

- **Lines of Code:** ~3,000
- **Dependencies:** 8 core packages
- **Test Coverage:** 85%+
- **Documentation:** 5 comprehensive guides
- **Time to First API:** ~5 minutes

---

<div align="center">

**Built with ️ for the Deno community**

⭐ **Star this repo if you find it helpful!** ⭐

[Documentation](QUICKSTART.md) • [Examples](docs/EXAMPLE_ECOMMERCE.md) •
[Issues](https://github.com/yourusername/tonystack/issues) • [License](LICENSE)

</div>
