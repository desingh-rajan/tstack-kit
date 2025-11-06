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
src/entities/products/         # Folder: snake_case (matches database table)
├── product.model.ts          # Files: kebab-case
├── product.dto.ts            # (singular form)
├── product.service.ts
├── product.controller.ts
├── product.route.ts          # Routes: /products (kebab-case plural)
├── product.interface.ts
└── product.test.ts
```

### Examples

```bash
# Generate a simple entity
tstack scaffold users                    # Creates: entities/users/user.*.ts, routes: /users

# Generate entity with snake_case input
tstack scaffold blog_posts               # Creates: entities/blog_posts/blog-post.*.ts, routes: /blog-posts

# Generate with PascalCase input  
tstack scaffold BlogPost                 # Creates: entities/blog_posts/blog-post.*.ts, routes: /blog-posts

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
// Route definitions - uses kebab-case paths (RESTful standard)
const productRoutes = new Hono();
productRoutes.get("/products", ProductController.getAll);
productRoutes.get("/products/:id", ProductController.getById);
productRoutes.post("/products", ProductController.create);
productRoutes.put("/products/:id", ProductController.update);
productRoutes.delete("/products/:id", ProductController.delete);

export default productRoutes;
```

## Naming Conventions

The CLI automatically handles different naming conventions following backend best practices:

| Input          | Folder (snake_case) | Files (kebab-case)   | Routes (kebab-case) | Classes (PascalCase) | Variables (camelCase) | Table (snake_case) |
|----------------|---------------------|----------------------|---------------------|----------------------|-----------------------|--------------------|
| `user`         | `users/`            | `user.*.ts`          | `/users`            | `User`               | `user`, `users`       | `users`            |
| `blog_post`    | `blog_posts/`       | `blog-post.*.ts`     | `/blog-posts`       | `BlogPost`           | `blogPost`, `blogPosts` | `blog_posts`     |
| `BlogPost`     | `blog_posts/`       | `blog-post.*.ts`     | `/blog-posts`       | `BlogPost`           | `blogPost`, `blogPosts` | `blog_posts`     |
| `site_settings`| `site_settings/`    | `site-setting.*.ts`  | `/site-settings`    | `SiteSetting`        | `siteSetting`, `siteSettings` | `site_settings` |
| `product`      | `products/`         | `product.*.ts`       | `/products`         | `Product`            | `product`, `products` | `products`         |

**Why these conventions?**
- **Folders (snake_case)**: Matches database table naming convention
- **Files (kebab-case)**: Modern TypeScript/Deno convention (like Vite, Next.js)
- **Routes (kebab-case)**: RESTful API standard (e.g., `/user-profiles`, not `/userProfiles`)
- **Classes (PascalCase)**: TypeScript/JavaScript standard
- **Variables (camelCase)**: TypeScript/JavaScript standard
- **Tables (snake_case)**: SQL database standard

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
