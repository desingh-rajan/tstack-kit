# Admin Panel

TStack Admin provides a config-driven CRUD interface for entity management.

## Entity Registration

Entities are auto-discovered when scaffolded. Manual registration:

```typescript
// src/main.ts
import { createAdminRoutes } from "@tstack/admin";
import { productAdminConfig } from "./entities/products/product.admin.route.ts";

app.route("/ts-admin", createAdminRoutes([productAdminConfig]));
```

## Entity Configuration

```typescript
// product.admin.route.ts
export const productAdminConfig = {
  entity: "products",
  displayName: "Products",
  table: products,
  columns: [
    { key: "id", label: "ID", type: "number", sortable: true },
    { key: "name", label: "Name", type: "text", searchable: true },
    { key: "price", label: "Price", type: "number" },
    { key: "inStock", label: "In Stock", type: "boolean" },
    { key: "createdAt", label: "Created", type: "datetime" },
  ],
  createSchema: createProductSchema,
  updateSchema: updateProductSchema,
};
```

## Column Types

| Type           | Renders As            |
| -------------- | --------------------- |
| `text`         | Text input            |
| `number`       | Number input          |
| `boolean`      | Toggle switch         |
| `datetime`     | Date picker           |
| `select`       | Dropdown              |
| `textarea`     | Multi-line text       |
| `json`         | JSON editor           |
| `image`        | Image upload pane     |
| `relationship` | Related entity select |

## Column Options

```typescript
{
  key: "status",
  label: "Status",
  type: "select",
  options: [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
  ],
  sortable: true,
  searchable: false,
  hidden: false,        // Hide from list view
  hiddenInForm: false,  // Hide from create/edit forms
}
```

## Admin API Endpoints

For entity `products`:

| Method | Endpoint                         | Description              |
| ------ | -------------------------------- | ------------------------ |
| GET    | `/ts-admin/products`             | List with pagination     |
| GET    | `/ts-admin/products/:id`         | Get single record        |
| GET    | `/ts-admin/products/new`         | Get create form metadata |
| GET    | `/ts-admin/products/:id/edit`    | Get edit form metadata   |
| POST   | `/ts-admin/products`             | Create record            |
| PUT    | `/ts-admin/products/:id`         | Update record            |
| DELETE | `/ts-admin/products/:id`         | Delete record            |
| POST   | `/ts-admin/products/bulk-delete` | Bulk delete              |

## Image Upload Endpoints

For entities with image support (e.g., products):

| Method | Endpoint                                   | Description              |
| ------ | ------------------------------------------ | ------------------------ |
| GET    | `/ts-admin/products/:id/images`            | List images for entity   |
| POST   | `/ts-admin/products/:id/images`            | Upload image (multipart) |
| DELETE | `/ts-admin/product-images/:id`             | Delete image (and S3)    |
| POST   | `/ts-admin/product-images/:id/set-primary` | Set primary image        |

## Query Parameters

```text
GET /ts-admin/products?page=1&limit=20&search=widget&sortBy=name&sortOrder=asc
```

| Param       | Description                  |
| ----------- | ---------------------------- |
| `page`      | Page number (default: 1)     |
| `limit`     | Items per page (default: 20) |
| `search`    | Search term                  |
| `sortBy`    | Column to sort by            |
| `sortOrder` | `asc` or `desc`              |

---

## Design Philosophy: Why Admin Works This Way

### Config-Driven vs Code-Driven

Many admin frameworks generate code:

```bash
# Rails approach
rails generate scaffold Product name:string price:decimal
# Creates views, controllers, forms, etc.
```

TStack Admin uses configuration:

```typescript
export const productAdminConfig = {
  entity: "products",
  columns: [...],
  createSchema: createProductSchema,
};
```

**Why configuration over code generation:**

1. **Single source of truth** - One config file defines the entire admin
   interface. No scattered views to maintain.

2. **Runtime flexibility** - Config can be modified without regeneration. Add a
   column? Update the array.

3. **Type safety** - Config is TypeScript. Your editor catches mistakes. Zod
   schemas validate at runtime.

4. **No drift** - Generated code drifts from generators over time. Config stays
   in sync because it is the source.

5. **Smaller codebase** - No generated view files. The admin UI interprets
   config at runtime.

**The tradeoff:**

Less customization flexibility. A generated Rails admin view can be edited to
any design. TStack Admin looks like TStack Admin. For most internal tools, this
is fine.

### The JSON API Decision

Admin Panel communicates via JSON API:

```text
Admin UI (Fresh) <--JSON--> Admin API (Hono) <--SQL--> PostgreSQL
```

**Why not server-rendered HTML?**

1. **Decoupled deployment** - API and UI deploy independently. API can scale
   separately from UI.

2. **Multiple clients** - Same API serves web admin, mobile admin, CLI tools.

3. **Testability** - JSON responses are trivial to test. HTML responses require
   parsing.

4. **Type generation** - OpenAPI specs generate TypeScript clients
   automatically.

**Why not GraphQL?**

1. **Complexity** - Admin CRUD does not benefit from GraphQL's flexibility. REST
   endpoints are simpler.

2. **Caching** - REST responses cache naturally. GraphQL requires cache
   configuration.

3. **Tooling** - REST clients are simpler. Every HTTP client works. GraphQL
   needs specialized clients.

4. **Learning curve** - Developers know REST. GraphQL adds onboarding time.

For admin panels, REST is the pragmatic choice.

### Frontend-Agnostic API

The Admin API at `/ts-admin/*` returns structured JSON:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "columns": [
    { "key": "name", "label": "Name", "type": "text", "sortable": true }
  ]
}
```

**Why include column metadata?**

The API tells the UI how to render. This enables:

1. **Dynamic forms** - UI builds forms from column definitions, not hardcoded
   templates.

2. **Validation sync** - Zod schemas validate on server. UI shows matching field
   types.

3. **Multiple UIs** - A React admin, a Vue admin, and a CLI can all read the
   same metadata.

4. **Runtime changes** - Add a column to config, UI shows it. No frontend
   deployment needed.

### Why Fresh for Admin UI

TStack Admin UI uses Fresh (Deno's web framework):

```text
packages/admin-ui-starter/
├── routes/            # Fresh file-based routing
├── islands/           # Interactive Preact components
├── components/        # Server-rendered components
└── config/entities/   # Admin entity configs
```

**Why Fresh over Next.js or Vite SPA?**

1. **Deno ecosystem** - Same runtime as API. One toolchain, one deploy process.

2. **Islands architecture** - Ship minimal JavaScript. Most admin pages are
   mostly static.

3. **No build step** - Fresh compiles on demand. Fast iteration during
   development.

4. **TypeScript native** - No tsconfig tweaking. Types work immediately.

**Why not the same Hono server?**

Separation of concerns:

- API server handles data and business logic
- UI server handles rendering and user interaction

This lets you:

- Scale API independently (more API instances, fewer UI instances)
- Deploy API changes without touching UI
- Use different authentication flows (API uses JWT, UI uses cookies)

### Entity Auto-Discovery

When you scaffold an entity, it appears in the admin sidebar automatically. This
works through file-based configuration:

```text
config/entities/
├── articles.ts      # Article admin config
├── products.ts      # Product admin config
└── index.ts         # Aggregates all configs
```

**The index.ts pattern:**

```typescript
// config/entities/index.ts
export { articleAdminConfig } from "./articles.ts";
export { productAdminConfig } from "./products.ts";

// Auto-export array for registration
export const entities = [articleAdminConfig, productAdminConfig];
```

**Why file-based over database-driven?**

1. **Version controlled** - Git tracks entity configuration changes
2. **Type safe** - Configs are TypeScript, not database rows
3. **No admin for admin** - You don't need UI to configure the UI
4. **Deploy-time validation** - Misconfigurations fail at deploy, not runtime

### Validation Schema Reuse

Admin uses the same Zod schemas as your API:

```typescript
// product.dto.ts - Shared schemas
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
});

// product.admin.route.ts - Reuses schema
export const productAdminConfig = {
  createSchema: createProductSchema,
  // ...
};
```

**Why share schemas?**

1. **Single source of truth** - Validation rules defined once
2. **Consistency** - API and admin enforce same rules
3. **DRY** - No duplicate validation logic
4. **Type inference** - One schema, types everywhere

### The Form Metadata Pattern

Admin API returns form metadata for create/edit:

```json
GET /ts-admin/products/new
{
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "text",
      "required": true,
      "validation": { "min": 1, "max": 255 }
    },
    {
      "key": "price",
      "label": "Price",
      "type": "number",
      "required": true,
      "validation": { "positive": true }
    }
  ]
}
```

**Why not just POST and see what fails?**

1. **Better UX** - Show required fields before submit
2. **Client validation** - Catch errors before network round-trip
3. **Accessibility** - Forms can be properly labeled
4. **Documentation** - API describes itself

### Bulk Operations

Admin supports bulk delete:

```text
POST /ts-admin/products/bulk-delete
{ "ids": [1, 2, 3, 4, 5] }
```

**Why a dedicated endpoint?**

```text
// Alternative: Loop single deletes
DELETE /ts-admin/products/1
DELETE /ts-admin/products/2
DELETE /ts-admin/products/3
// ... N network requests
```

Bulk operations are:

1. **Faster** - One network request instead of N
2. **Transactional** - All or nothing (no partial deletes)
3. **Auditable** - One log entry for bulk action

### Future: Custom Actions

The admin config pattern enables future extension:

```typescript
// Potential future API (not yet implemented)
export const orderAdminConfig = {
  entity: "orders",
  columns: [...],
  actions: [
    { key: "fulfill", label: "Mark Fulfilled", method: "POST" },
    { key: "refund", label: "Issue Refund", method: "POST" },
    { key: "export", label: "Export CSV", method: "GET" },
  ],
};
```

The config-driven approach means new features add config options, not new code
patterns. This extensibility was a design goal from day one.

---

## Image Upload with ImageUploadPane

The Admin UI includes a reusable `ImageUploadPane` island for S3 image uploads.

### Adding Image Support to an Entity

1. Add an `image` type field to your entity config:

```typescript
// config/entities/posts.config.tsx
{
  name: "images",
  label: "Images",
  type: "image",
  showInList: false,
  showInShow: true,
  showInForm: false,
  imageConfig: {
    entityType: "posts",
    allowMultiple: true,
    maxFiles: 10,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 5,
  },
}
```

2. Use in your show/edit page:

```typescript
import ImageUploadPane from "@/islands/ImageUploadPane.tsx";

<ShowPage config={config} item={item}>
  <ImageUploadPane entityType="posts" entityId={item.id} />
</ShowPage>;
```

### Features

- **Drag & Drop**: Drop files directly onto the upload zone
- **Preview**: See images before uploading
- **Progress**: Visual upload progress indicators
- **Primary Selection**: Click star icon to set primary image
- **Delete**: Remove images (also deletes from S3)
- **Queue Mode**: On create pages, queues uploads until entity is saved
- **Immediate Mode**: On edit pages, uploads instantly

### S3 Configuration

Configure in your API's `.env.development.local`:

```bash
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket
S3_PREFIX=my-project/dev
```

Images are stored at: `{bucket}/{prefix}/{entity}/{entityId}/{imageId}.{ext}`

Next: [Testing Guide](./testing-guide.md)
