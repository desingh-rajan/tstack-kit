# TStack Kit - Admin UI Starter

## DRY, Config-Driven CRUD System for Fresh 2.2.0

This is the **admin-ui-starter** package for TStack Kit - a production-ready
admin panel framework built with:

- **Fresh 2.2.0** (Latest Deno framework)
- **DaisyUI 5.5.5** (Tailwind component library)
- **Preact 10.27.2** (Fast 3kb React alternative)
- **TypeScript** (Full type safety)

## Philosophy: Rails ActiveAdmin for Fresh

Define your entity **once** in a config file, get complete CRUD for free:

- List page with **all columns** (paginated, sortable)
- Show page with **all fields** (formatted by type)
- Create/Edit forms (auto-generated with validation)
- Delete with confirmation
- Auth checks built-in
- Error handling (404/500 via `_error.tsx`)

## Quick Start

```bash
# Install dependencies
deno install

# Start dev server
deno task dev

# Open http://localhost:5173
# Default admin credentials will be created when backend starts
```

## Architecture

### 1. Entity Configuration (`config/entities/*.config.ts`)

Define your entity once:

```typescript
export const articleConfig: EntityConfig<Article> = {
  name: "articles",
  singularName: "Article",
  pluralName: "Articles",
  apiPath: "/ts-admin/articles",
  idField: "id",
  service: articleService,

  fields: [
    {
      name: "title",
      label: "Title",
      type: "string",
      required: true,
      showInList: true, // Show in table
      showInShow: true, // Show in detail page
      showInForm: true, // Show in create/edit form
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
      render: (value) => {
        const isDraft = value === "draft";
        return (
          <span class={`badge ${isDraft ? "badge-warning" : "badge-success"}`}>
            {String(value)}
          </span>
        );
      },
    },
    // ... more fields
  ],
};
```

### 2. Generic Components (Reusable for ALL entities)

- **DataTable** - Shows ALL columns dynamically
- **ShowPage** - Displays ALL fields in grid
- **GenericForm** - Generates forms from config
- **Pagination** - Smart pagination with page sizes

### 3. CRUD Routes (Copy-paste template)

Each entity needs 4 files:

```plaintext
routes/admin/{entity}/
├── index.tsx        # List page
├── [id].tsx         # Show page
├── new.tsx          # Create page
└── [id]/edit.tsx    # Edit page
```

All files are almost identical - just import different config:

```typescript
// routes/admin/articles/index.tsx
import { articleConfig } from "@/config/entities/articles.config.ts";
const handlers = createCRUDHandlers(articleConfig);
export const handler = define.handlers({ GET: handlers.list });
export default define.page<typeof handler>(function ListPage({ data }) {
  return (
    <AdminLayout>
      <DataTable config={articleConfig} data={data.items.data} />
      <Pagination pagination={data.items.pagination} />
    </AdminLayout>
  );
});
```

## Adding a New Entity

**3 steps:**

### Step 1: Create config file

```typescript
// config/entities/posts.config.ts
export const postConfig: EntityConfig<Post> = {
  name: "posts",
  singularName: "Post",
  pluralName: "Posts",
  apiPath: "/ts-admin/posts",
  idField: "id",
  service: postService,
  fields: [/* define fields */],
};
```

### Step 2: Copy 4 route files

Copy from `routes/admin/articles/` → `routes/admin/posts/`

Change one line:

```typescript
import { postConfig } from "@/config/entities/posts.config.ts";
const handlers = createCRUDHandlers(postConfig);
```

### Step 3: Done

## Supported Field Types

| Type           | UI Output           | Form Input                    |
| -------------- | ------------------- | ----------------------------- |
| `string`       | Text                | `<input type="text">`         |
| `text`         | Truncated/formatted | `<textarea>`                  |
| `textarea`     | Multi-line text     | `<textarea>` (explicit)       |
| `number`       | Number              | `<input type="number">`       |
| `boolean`      | Badge (Yes/No)      | `<checkbox>`                  |
| `date`         | Formatted date      | `<input type="date">`         |
| `datetime`     | Formatted datetime  | DatePicker component          |
| `email`        | Link                | `<input type="email">`        |
| `select`       | Badge/text          | `<select>` with options       |
| `json`         | Pretty JSON         | `<textarea>`                  |
| `image`        | Image gallery       | `ImageUploadPane` component   |
| `relationship` | Link to related     | `RelationshipSelect` dropdown |
| `custom`       | Custom render fn    | Custom form component         |

## Image Upload Support

The admin UI includes a powerful `ImageUploadPane` island for S3 image uploads.

### Adding Images to an Entity

1. **Add image field to entity config**:

```typescript
// config/entities/products.config.tsx
{
  name: "images",
  label: "Product Images",
  type: "image",
  showInList: false,
  showInShow: true,
  showInForm: false,  // Handled separately
  imageConfig: {
    entityType: "products",
    allowMultiple: true,
    maxFiles: 10,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 5,
  },
}
```

2. **Use in Show/Edit pages**:

```typescript
// routes/admin/products/[id].tsx
import ImageUploadPane from "@/islands/ImageUploadPane.tsx";

<ShowPage config={data.config} item={data.item}>
  <ImageUploadPane
    entityType="products"
    entityId={data.item.id}
    readOnly={false}
  />
</ShowPage>;
```

### ImageUploadPane Features

- Drag-and-drop file upload
- Image preview before upload
- Progress indicators
- Set primary image
- Delete images (removes from S3)
- Responsive grid layout
- Queue uploads on create (uploads after entity save)
- Immediate uploads on edit

### Props

| Prop             | Type     | Description                                |
| ---------------- | -------- | ------------------------------------------ |
| `entityType`     | string   | Entity name for S3 path (e.g., "products") |
| `entityId`       | string?  | If provided, uploads immediately           |
| `readOnly`       | boolean  | Disable upload/delete actions              |
| `maxFiles`       | number   | Maximum files allowed (default: 10)        |
| `acceptedTypes`  | string[] | MIME types (default: image/*)              |
| `maxSizeMB`      | number   | Max file size in MB (default: 5)           |
| `onImagesChange` | function | Callback when images change                |

## Features

- **Pagination** - Query params `?page=1&pageSize=20`
- **Auth** - JWT token in HttpOnly cookies
- **Validation** - Client & server-side
- **Error Handling** - Graceful fallbacks
- **Responsive** - Mobile-friendly
- **Theme Switching** - Dark/light mode
- **Type-safe** - Full TypeScript inference
- **Health Check** - `/health` endpoint for container orchestration
- **Error Pages** - Custom `_error.tsx` for 404 and 500 handling
- **SSR API Routing** - `SSR_API_URL` (Docker internal URL) for server-side
  requests, falls back to `API_BASE_URL`
- **Test Attributes** - `data-testid` on login form for E2E testing

## Environment Variables

| Variable           | Required | Description                                        |
| :----------------- | :------- | :------------------------------------------------- |
| `API_BASE_URL`     | Yes      | Public API URL (e.g., `http://localhost:8000/api`) |
| `API_INTERNAL_URL` | No       | Docker internal URL (e.g., `http://api:8000/api`)  |

When running in Docker, set `API_INTERNAL_URL` so server-side rendering calls
the API over the internal network instead of going through the public URL.

## Guest Order Management

The admin panel fully supports orders placed by guest (non-registered) users:

- **Customer Type Filter** - Filter orders by All / Guest Orders / Registered
  Users
- **Guest Badge** - Orders from guests show a "Guest" badge with their email and
  phone in the order list
- **Customer Info Card** - Order detail page shows guest contact info or
  registered user details
- **Manual Refund** - Admin can process manual refunds with a transaction
  reference for orders where automated refund is not available

## Feature Flags

Backend `site_settings` feature flags are loaded and available in entity
configs:

- `enableRazorpay` / `enableCOD` / `enableSelfPickup` - Payment method toggles
- `OrderNotifications` - Order email notification toggle

## Entity Config Options

| Option          | Type       | Description                                    |
| --------------- | ---------- | ---------------------------------------------- |
| `canEditRecord` | `function` | Per-record control over edit button visibility |
| `limit`         | `number`   | Custom page size for list queries              |
| `filters`       | `array`    | Filterable fields with options                 |

## Project Structure

```plaintext
admin-ui-starter/
├── config/
│   └── entities/          # Entity configs (1 file per entity)
│       ├── articles.config.ts
│       ├── orders.config.tsx
│       ├── users.config.ts
│       └── site-settings.config.ts
├── lib/
│   ├── admin/
│   │   ├── types.ts       # TypeScript definitions
│   │   └── crud-handlers.ts  # Generic CRUD handlers
│   ├── api.ts             # HTTP client
│   └── auth.ts            # Auth helpers
├── components/
│   ├── admin/             # Generic CRUD components
│   │   ├── DataTable.tsx
│   │   ├── ShowPage.tsx
│   │   └── GenericForm.tsx
│   └── layout/
│       └── AdminLayout.tsx
├── routes/
│   ├── _error.tsx         # 404/500 error pages
│   ├── admin/
│   │   ├── articles/      # Article CRUD (4 files)
│   │   ├── orders/        # Order CRUD + guest management
│   │   ├── users/         # User CRUD (4 files)
│   │   └── site-settings/ # Settings CRUD (4 files)
│   ├── auth/
│   │   ├── login.tsx
│   │   └── logout.tsx
│   └── index.tsx          # Home/redirect
├── islands/
│   ├── DataTableActions.tsx   # Row action buttons
│   ├── DatePicker.tsx         # Date/datetime picker
│   ├── FilterableDataTable.tsx # Table with filters
│   ├── ImageUploadPane.tsx    # S3 image uploads
│   ├── Pagination.tsx         # Page navigation
│   ├── RelationshipSelect.tsx # Foreign key dropdowns
│   └── ThemeSwitcher.tsx      # Dark/light mode toggle
├── entities/              # API service layer
│   ├── articles/
│   ├── orders/
│   ├── payments/
│   ├── users/
│   └── site_settings/
└── static/                # Static assets
```

## Fresh 2.2.0 Patterns (Latest)

**CORRECT (Fresh 2.x):**

```typescript
import { define } from "./utils.ts";

export const handler = define.handlers({
  async GET(ctx) {/* ... */},
  async POST(ctx) {/* ... */},
});

export default define.page<typeof handler>(function Page({ data }) {
  return <div>{data.value}</div>;
});
```

**DEPRECATED (Old Fresh 1.x):**

```typescript
// Don't use these!
import { Handlers, PageProps } from "$fresh/server.ts";
export const handler: Handlers<Data> = {/* ... */};
export default function Page(props: PageProps<Data>) {/* ... */}
```

## TStack Kit CLI Integration

This UI framework is designed for easy scaffolding with the TStack CLI:

```bash
# Scaffold complete entity (backend + admin UI)
tstack scaffold posts

# Or scaffold admin UI only (if backend exists)
tstack ui-scaffold posts
```

Generates:

- `config/entities/posts.config.tsx`
- `routes/admin/posts/index.tsx` (List page)
- `routes/admin/posts/[id].tsx` (Show page)
- `routes/admin/posts/new.tsx` (Create page)
- `routes/admin/posts/[id]/edit.tsx` (Edit page)

## Backend API Requirements

Expected response format:

```json
{
  "status": "success",
  "message": "...",
  "data": {},
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Development

```bash
# Dev server with hot reload
deno task dev

# Type check
deno check

# Lint
deno lint

# Format
deno fmt

# Build for production
deno task build
```

## Documentation

- **DRY_ADMIN_ARCHITECTURE.md** - Detailed architecture guide
- **FRESH_UI_SCAFFOLD_PATTERN.md** - Scaffolding templates

## Tech Stack

- **Framework**: Fresh 2.2.0 (Deno web framework)
- **Runtime**: Deno 2.x
- **UI Library**: Preact 10.27.2
- **CSS Framework**: Tailwind CSS 3.4.1
- **Component Library**: DaisyUI 5.5.5
- **Build Tool**: Vite 7.1.3
- **Language**: TypeScript

## License

MIT
