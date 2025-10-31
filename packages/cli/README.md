# TonyStack CLI

> Rails-like scaffolding for Deno backend development

The official CLI tool for **TonyStack** - generate complete MVC entities with a
single command.

## Features

- **Smart Scaffolding** - Generate complete entities with model, DTO, service,
  controller, and routes
- **Intelligent Naming** - Automatic pluralization and case conversion
- **Type-Safe Templates** - Pre-configured with TypeScript and Drizzle ORM
- **Fast** - Zero-dependency Deno native tool
- **Clean Architecture** - Follows MVC best practices

## Installation

### Global Installation (Recommended)

```bash
deno install --allow-read --allow-write --allow-env -n tstack jsr:@tonystack/cli
```

### Direct Usage (No Installation)

```bash
deno run --allow-read --allow-write --allow-env jsr:@tonystack/cli scaffold products
```

### Local Development

```bash
cd packages/cli
deno task install
```

## Quick Start

### Generate a New Entity

```bash
tstack scaffold products
```

This creates:

```text
src/entities/products/
├── product.model.ts # Drizzle database schema
├── product.dto.ts # Data transfer objects + validation
├── product.service.ts # Business logic
├── product.controller.ts # HTTP handlers
└── product.route.ts # Route definitions
```

### Examples

```bash
# Generate a simple entity
tstack scaffold users

# Generate entity with kebab-case name
tstack scaffold blog-posts

# Force overwrite existing entity
tstack scaffold products --force

# Generate in a specific directory
tstack scaffold orders --dir ./my-project
```

## Commands

### `scaffold <entity-name>`

Generate a new entity with all MVC files.

**Options:**

- `--force, -f` - Overwrite existing files
- `--dir <path>, -d` - Target directory (default: current directory)

**Example:**

```bash
tstack scaffold products --force --dir ./backend
```

### `--help, -h`

Show help information.

```bash
tstack --help
```

### `--version, -v`

Show version number.

```bash
tstack --version
```

## What Gets Generated?

### 1. **Model** (`{entity}.model.ts`)

```typescript
// Drizzle schema with type inference
export const products = sqliteTable("products", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  // ...
});
```

### 2. **DTO** (`{entity}.dto.ts`)

```typescript
// Zod validation schemas
export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
```

### 3. **Service** (`{entity}.service.ts`)

```typescript
// Business logic layer
export class ProductService {
  static async getAll() {/* ... */}
  static async getById(id: number) {/* ... */}
  static async create(data) {/* ... */}
  // ...
}
```

### 4. **Controller** (`{entity}.controller.ts`)

```typescript
// HTTP handlers
export class ProductController {
  static async getAll(c: Context) {/* ... */}
  static async create(c: Context) {/* ... */}
  // ...
}
```

### 5. **Routes** (`{entity}.route.ts`)

```typescript
// Route definitions
const productRoutes = new Hono();
productRoutes.get("/products", ProductController.getAll);
productRoutes.post("/products", ProductController.create);
// ...
```

## Name Transformations

The CLI automatically handles different naming conventions:

| Input       | Singular   | Plural       | PascalCase | Table Name   |
| ----------- | ---------- | ------------ | ---------- | ------------ |
| `user`      | `user`     | `users`      | `User`     | `users`      |
| `blog-post` | `blogPost` | `blogPosts`  | `BlogPost` | `blog_posts` |
| `product`   | `product`  | `products`   | `Product`  | `products`   |
| `category`  | `category` | `categories` | `Category` | `categories` |

## Post-Scaffold Steps

After generating an entity, you need to:

### 1. Register Routes in `main.ts`

```typescript
import productRoutes from "./entities/products/product.route.ts";

app.route("/api", productRoutes);
```

### 2. Customize Generated Files

- **Model**: Add your custom fields and relations
- **DTO**: Update validation rules
- **Service**: Add custom business logic
- **Controller**: Modify response formats
- **Routes**: Add middleware (auth, validation)

### 3. Run Database Migrations

```bash
deno task migrate:generate
deno task migrate:run
```

### 4. Start Development Server

```bash
deno task dev
```

## Customizing Templates

You can customize the generated templates by modifying the files in:

```text
packages/cli/src/templates/
├── model.ts # Database schema template
├── dto.ts # DTO template
├── service.ts # Service template
├── controller.ts # Controller template
└── route.ts # Route template
```

## Advanced Usage

### Environment Variables

- `DEBUG=1` - Show detailed error messages

```bash
DEBUG=1 tstack scaffold products
```

### Integration with TonyStack Starter

The CLI is designed to work seamlessly with the TonyStack starter kit:

```bash
# Clone starter
git clone https://github.com/yourusername/tonystack-starter my-project
cd my-project

# Generate entities
tstack scaffold products
tstack scaffold orders
tstack scaffold customers

# Start development
deno task dev
```

## Testing

Run tests:

```bash
deno task test
```

## Documentation

- [TonyStack Documentation](https://github.com/yourusername/tonystack)
- [Starter Kit](https://github.com/yourusername/tonystack/tree/main/packages/starter)
- [Examples](https://github.com/yourusername/tonystack/tree/main/examples)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## ‍♂️ Support

- Email: <support@tonystack.dev>
- GitHub Issues:
  [Create an issue](https://github.com/yourusername/tonystack/issues)
- Discord: [Join our community](https://discord.gg/tonystack)

---

Made with ️ for the Deno community

> TonyStack CLI - Because scaffolding should be this easy.
