# TStack API Starter: The Human Guide

This package is the "Backend" of your application. It is a high-performance REST
API built designed to scale from a weekend project to a production business.

## The Mental Model: A Restaurant Kitchen

The API follows a strict **Three-Tier Architecture**. The easiest way to
understand this is to imagine a restaurant.

### 1. The Controller ( The Waiter )

- **Role**: Customer Service.
- **What it does**:
  - Takes the order (receives the HTTP Request).
  - Checks if the customer is allowed to order (Authentication & Authorization).
  - Makes sure the order makes sense (Validation - e.g., "you can't order
    negative 5 burgers").
  - Examples: `ProductController`, `UserController`.
- **Rule**: The implementation details of how to cook the burger are _not_ here.
  It just passes the ticket to the kitchen.

### 2. The Service ( The Chef )

- **Role**: The Execution.
- **What it does**:
  - Receives the validated ticket from the Waiter.
  - Knows the recipes (Business Logic).
  - "If the customer ordered a combo, subtract items from inventory and apply
    the discount."
  - Examples: `ProductService`, `AuthService`.
- **Rule**: The Chef doesn't care who the customer is (HTTP context), they just
  care about the task.

### 3. The Model ( The Pantry )

- **Role**: Storage.
- **What it does**:
  - Defines exactly what ingredients exist and where they are kept.
  - Interaction with the database (Postgres).
  - Examples: `product.model.ts`, `users.table.ts`.

---

## Batteries Included

Most API starters give you an empty folder. TStack gives you a finished
foundation.

### Built-in Authentication

You don't need to write a login system. It is already built.

- **JWT Tokens**: Secure, standard, stateless login.
- **Role-Based Access**: The system knows the difference between a `User`, an
  `Admin`, and a `SuperAdmin`. You can protect any route by just saying
  "Requires Admin".

### Built-in Validation

We use a tool called **Zod** to ensure bad data never enters your database.

- If a user tries to send an email with no `@` symbol? **Rejected**.
- If a user tries to set a price to `-100`? **Rejected**. This happens
  automatically before your code even runs.

### One Command, Full CRUD

The "Base" classes (`BaseController`, `BaseService`) mean you don't have to
write boring code. If you create a standard entity (like a "Category"), you
automatically get:

- `GET /categories` (List with pagination)
- `GET /categories/:id` (Details)
- `POST /categories` (Create)
- `PUT /categories/:id` (Update)
- `DELETE /categories/:id` (Delete)

You only write code when you need to do something _unique_.

---

## Project Structure & Conventions

Where does the code live? TStack uses a "Feature-Based" structure. Everything
related to a specific feature (like "Products") lives in one folder, rather than
spreading files across `controllers/`, `models/`, and `services/` folders.

### Entity Scope Levels

Starting in v1.4.0, TStack organizes entities into three progressive scopes:

**Core Entities** (always included):

- `articles`: Blog posts, CMS content
- `site_settings`: Dynamic configuration
- `users`: Authentication/authorization

**Listing Entities** (product catalog):

- `brands`: Product brands
- `categories`: Product taxonomy
- `products`: Product entities
- `product_images`: Product galleries
- `product_variants`: SKU management
- `variant_options`: Variant values

**Commerce Entities** (shopping & checkout):

- `addresses`: Shipping/billing addresses
- `carts`: Shopping cart logic
- `orders`: Order management
- `payments`: Payment processing

When you run `tstack create api my-api --scope=core`, you get only the Core
entities. Use `--scope=listing` for product catalog support, or
`--scope=commerce` (default) for full e-commerce.

### The Anatomy of a Feature

If you look at `src/entities/products/`, you will see:

```text
src/entities/products/
├── product.model.ts       # Database Schema (Drizzle)
├── product.dto.ts         # Validation Rules (Zod)
├── product.service.ts     # Business Logic
├── product.controller.ts  # HTTP Handlers
├── product.route.ts       # Router Configuration
└── product.test.ts        # Automated Tests
```

### Naming Conventions

We stick to strict naming rules so you always know what a file does just by its
name.

- **`*.model.ts`**: Always the database table definition.
- **`*.dto.ts`** ("Data Transfer Object"): The shape of the data coming IN (like
  a form submission) or going OUT.
- **`*.service.ts`**: The logic layer. This class usually extends `BaseService`.
- **`*.controller.ts`**: The web layer. This class usually extends
  `BaseController`.
- **`*.route.ts`**: The Hono router definitions using `app.get()`, `app.post()`,
  etc.

This convention means that if you are looking for "How do we calculate the
price?", you know instantly to open `product.service.ts`. If you are looking for
"What URL do I call?", you open `product.route.ts`.

---

## How to Work With It

### Adding a New Feature

1. **Scaffold**: Run `tstack scaffold ticket`.
2. **Define**: Open `ticket.model.ts` and define what a "Ticket" looks like
   (title, priority, user_id).
3. **Run**: That's it. You have a working API.
4. **Refine**: Go into `ticket.service.ts` to add special rules (e.g., "High
   priority tickets trigger an email").

### Testing

We believe in "Co-location". Tests are not hidden in a dark `tests/` folder far
away.

- The test for products is right next to the code:
  `src/entities/products/product.test.ts`.
- **Real Database**: Our tests don't fake the database. They spin up a real,
  temporary Postgres database, run the test, and wipe it. This guarantees your
  code actually works in the real world.

### S3 Image Uploads

The API includes a ready-to-use S3 uploader for entity images.

**Setup**: Add AWS credentials to your `.env.development.local`:

```bash
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket
S3_PREFIX=my-project/dev
```

**How it works**:

- Images are stored at `{bucket}/{prefix}/{entity}/{entityId}/{imageId}.{ext}`
- Example: `my-bucket/sc/dev/products/abc-123/img-456.jpg`
- The `S3Uploader` class handles upload, delete, and URL generation
- Product images are managed via `/ts-admin/products/:id/images` endpoints
- Admin UI provides drag-drop upload via `ImageUploadPane` component

**Key files**:

- `src/lib/s3-uploader.ts` - S3 upload/delete utilities
- `src/entities/product_images/` - Product image entity
- `src/entities/products/product.controller.ts` - Upload endpoint handler

### Deployment

This API is built on **Hono**, which is a modern "standard" framework.

- It runs on standard Node.js servers (DigitalOcean, AWS EC2).
- It runs on Edge networks (Cloudflare Workers, Deno Deploy).
- It runs in Docker containers (we include the Dockerfile).

You are not locked into any specific cloud provider.
