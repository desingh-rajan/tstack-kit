# TStack Frontend - Complete Reference

> **For AI Agents, LLMs, and Developers**: This is the exhaustive reference for
> the Admin UI Starter, Storefront Starter, and the @tstack/admin package.
> Everything about entity configuration, components, and patterns is documented
> here.

**Source Code**:

- Admin UI: [packages/admin-ui-starter/](packages/admin-ui-starter/)
- Storefront: [packages/storefront-starter/](packages/storefront-starter/)
- Admin Package: [packages/admin/](packages/admin/)

---

## Table of Contents

- [Overview](#overview)
- [Admin UI Starter](#admin-ui-starter)
  - [Project Structure](#admin-ui-project-structure)
  - [Entity Configuration](#entity-configuration)
  - [Field Types Reference](#field-types-reference)
  - [Generic Components](#generic-components)
  - [CRUD Handlers](#crud-handlers)
  - [Routes Structure](#routes-structure)
  - [Base Service (Frontend)](#base-service-frontend)
- [@tstack/admin Package](#tstackadmin-package)
  - [DrizzleAdapter](#drizzleadapter)
  - [HonoAdminAdapter](#honoadminadapter)
  - [Pagination Utilities](#pagination-utilities)
- [Storefront Starter](#storefront-starter)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Technology Stack

| Component     | Admin UI             | Storefront      |
| ------------- | -------------------- | --------------- |
| Framework     | Fresh 2.2.0          | Fresh 2.2.0     |
| UI Library    | Preact 10.27.2       | Preact 10.27.2  |
| CSS Framework | DaisyUI 5.5.5        | Tailwind CSS 4  |
| CSS Bundler   | Tailwind + Vite      | Tailwind + Vite |
| Icons         | Lucide (via DaisyUI) | Heroicons       |

### Architecture Pattern

Both frontends use Fresh's **Islands Architecture**:

- **Routes** (`routes/`): Server-rendered pages with handlers
- **Components** (`components/`): Static, server-rendered components
- **Islands** (`islands/`): Interactive client-side components (minimal JS)

---

## Admin UI Starter

### Admin UI Project Structure

```
admin-ui-starter/
├── deno.json                    # Deno configuration
├── main.ts                      # Fresh app entry point
├── client.ts                    # Client-side entry
├── utils.ts                     # Fresh utilities
├── vite.config.ts               # Vite bundler config
├── tailwind.config.ts           # Tailwind + DaisyUI config
├── .env                         # Environment variables
├── assets/
│   └── styles.css               # Global styles
├── static/
│   └── styles.css               # Compiled CSS
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── Header.tsx           # Top header with user menu
│   │   └── Footer.tsx           # Footer
│   ├── admin/
│   │   ├── DataTable.tsx        # Generic data table
│   │   ├── ShowPage.tsx         # Generic detail page
│   │   ├── GenericForm.tsx      # Generic form component
│   │   └── Pagination.tsx       # Pagination controls
│   └── ui/
│       └── ... (UI primitives)
├── config/
│   └── entities/
│       ├── articles.ts          # Article entity config
│       ├── users.ts             # User entity config
│       ├── site-settings.ts     # Site settings config
│       └── ... (other entities)
├── entities/
│   └── articles/
│       ├── article.service.ts   # API service
│       └── article.types.ts     # TypeScript types
├── islands/
│   ├── ThemeSwitcher.tsx        # Dark/light mode toggle
│   ├── DataTableActions.tsx     # Table row actions
│   └── ... (other interactive components)
├── lib/
│   ├── api.ts                   # HTTP client setup
│   ├── auth.ts                  # Auth utilities
│   ├── base-service.ts          # Base service class
│   └── admin/
│       ├── types.ts             # Entity config types
│       └── crud-handlers.ts     # CRUD route handlers
└── routes/
    ├── _app.tsx                 # App layout wrapper
    ├── index.tsx                # Dashboard home
    ├── auth/
    │   └── login.tsx            # Login page
    └── admin/
        └── articles/
            ├── index.tsx        # List page
            ├── [id].tsx         # Show page
            ├── new.tsx          # Create page
            └── [id]/
                └── edit.tsx     # Edit page
```

---

## Entity Configuration

The Admin UI uses a **config-driven approach** - define an entity once, get
complete CRUD for free.

**Source**:
[packages/admin-ui-starter/lib/admin/types.ts](packages/admin-ui-starter/lib/admin/types.ts)

### EntityConfig Interface

```typescript
// Source: packages/admin-ui-starter/lib/admin/types.ts
export interface EntityConfig<T = Record<string, unknown>> {
  // Required identifiers
  name: string; // URL path: "articles"
  singularName: string; // Display: "Article"
  pluralName: string; // Display: "Articles"
  apiPath: string; // API endpoint: "/ts-admin/articles"
  idField: string; // Primary key field: "id"

  // Field definitions
  fields: FieldConfig[];

  // Service instance
  service: EntityService<T>;

  // Optional display configuration
  displayField?: string; // Main display field (e.g., "title")
  descriptionField?: string; // Secondary field (e.g., "slug")

  // Page titles
  listTitle?: string; // "Articles" (defaults to pluralName)
  createTitle?: string; // "Create Article"
  editTitle?: string; // "Edit Article"
  showTitle?: string; // "Article Details"

  // Permission flags
  canCreate?: boolean; // Show create button (default: true)
  canEdit?: boolean; // Show edit button (default: true)
  canDelete?: boolean; // Show delete button (default: true)
  canView?: boolean; // Show view button (default: true)

  // Advanced configuration
  isSystemRecord?: (record: T) => boolean; // Prevent editing system records
  getRouteParam?: (record: T) => string | number; // Custom route param
}

// Service interface that entities must implement
export interface EntityService<T> {
  list(params?: ListParams): Promise<ListResponse<T>>;
  getById?(id: string | number): Promise<T>;
  getByKey?(key: string): Promise<T>; // For slug-based entities
  create(data: Partial<T>): Promise<T>;
  update(id: string | number, data: Partial<T>): Promise<T>;
  delete(id: string | number): Promise<void>;
  setClient(client: HttpClient): void;
}
```

### FieldConfig Interface

```typescript
// Source: packages/admin-ui-starter/lib/admin/types.ts
export interface FieldConfig {
  // Required
  name: string; // Field name (matches API response)
  label: string; // Display label
  type: FieldType; // Field type (see below)

  // Display options
  sortable?: boolean; // Enable column sorting
  searchable?: boolean; // Include in search
  showInList?: boolean; // Show in data table
  showInShow?: boolean; // Show on detail page
  showInForm?: boolean; // Show in create/edit form

  // Form options
  required?: boolean; // Mark as required
  placeholder?: string; // Input placeholder
  helpText?: string; // Help text below input

  // Select/enum options
  options?: Array<{
    value: string | number;
    label: string;
  }>;

  // Text area options
  rows?: number; // Number of rows for textarea

  // Custom rendering
  render?: (
    value: unknown,
    record: Record<string, unknown>,
  ) => string | JSX.Element | null;

  // Validation
  validate?: (value: unknown) => string | undefined; // Return error message

  // Formatting
  format?: (value: unknown) => string; // Format for display
}
```

### Complete Example

```typescript
// Source: packages/admin-ui-starter/config/entities/articles.ts
import { EntityConfig, FieldConfig } from "../../lib/admin/types.ts";
import { articleService } from "../../entities/articles/article.service.ts";

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export const articleConfig: EntityConfig<Article> = {
  // Identifiers
  name: "articles",
  singularName: "Article",
  pluralName: "Articles",
  apiPath: "/ts-admin/articles",
  idField: "id",
  displayField: "title",
  descriptionField: "slug",

  // Service
  service: articleService,

  // Fields
  fields: [
    {
      name: "id",
      label: "ID",
      type: "number",
      sortable: true,
      showInList: true,
      showInShow: true,
      showInForm: false, // Auto-generated
    },
    {
      name: "title",
      label: "Title",
      type: "string",
      required: true,
      sortable: true,
      searchable: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "Enter article title",
    },
    {
      name: "slug",
      label: "Slug",
      type: "string",
      sortable: true,
      searchable: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "auto-generated-from-title",
      helpText: "URL-friendly identifier. Leave blank to auto-generate.",
    },
    {
      name: "content",
      label: "Content",
      type: "text",
      showInList: false, // Too long for table
      showInShow: true,
      showInForm: true,
      rows: 15,
      placeholder: "Write your article content here...",
    },
    {
      name: "excerpt",
      label: "Excerpt",
      type: "text",
      showInList: false,
      showInShow: true,
      showInForm: true,
      rows: 3,
      placeholder: "Brief summary of the article",
      helpText: "Shown in article listings and meta descriptions.",
    },
    {
      name: "isPublished",
      label: "Status",
      type: "boolean",
      sortable: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      // Custom render for list view
      render: (value) => (
        <span class={`badge ${value ? "badge-success" : "badge-warning"}`}>
          {value ? "Published" : "Draft"}
        </span>
      ),
    },
    {
      name: "publishedAt",
      label: "Published At",
      type: "datetime",
      sortable: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
    },
    {
      name: "authorId",
      label: "Author ID",
      type: "number",
      showInList: false,
      showInShow: true,
      showInForm: false, // Set automatically
    },
    {
      name: "createdAt",
      label: "Created",
      type: "datetime",
      sortable: true,
      showInList: true,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "updatedAt",
      label: "Updated",
      type: "datetime",
      sortable: true,
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
  ],

  // Permissions
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canView: true,
};
```

---

## Field Types Reference

**Source**:
[packages/admin-ui-starter/lib/admin/types.ts](packages/admin-ui-starter/lib/admin/types.ts)

```typescript
export type FieldType =
  | "string" // Single-line text input
  | "number" // Numeric input
  | "boolean" // Checkbox
  | "date" // Date picker
  | "datetime" // Datetime picker
  | "text" // Multi-line textarea
  | "email" // Email input with validation
  | "password" // Password input (masked)
  | "select" // Dropdown select
  | "json" // JSON textarea with formatting
  | "status" // Status badge (alias for select)
  | "badge"; // Display as badge
```

### Field Type Behaviors

| Type       | List Display       | Form Input                      | Notes                  |
| ---------- | ------------------ | ------------------------------- | ---------------------- |
| `string`   | Text (truncated)   | `<input type="text">`           | Max 50 chars in list   |
| `number`   | Formatted number   | `<input type="number">`         |                        |
| `boolean`  | Badge (Yes/No)     | `<input type="checkbox">`       |                        |
| `date`     | Formatted date     | `<input type="date">`           | Uses locale formatting |
| `datetime` | Formatted datetime | `<input type="datetime-local">` |                        |
| `text`     | Truncated (100ch)  | `<textarea>`                    | Uses `rows` prop       |
| `email`    | Clickable link     | `<input type="email">`          | mailto: link in list   |
| `password` | Hidden (*****)     | `<input type="password">`       | Never shown in list    |
| `select`   | Badge with label   | `<select>`                      | Uses `options` array   |
| `json`     | Formatted preview  | `<textarea>`                    | Pretty-printed         |
| `status`   | Colored badge      | `<select>`                      | Alias for select       |
| `badge`    | Styled badge       | `<input type="text">`           | Display-only styling   |

### Custom Render Examples

```typescript
// Boolean as colored badge
{
  name: "isActive",
  label: "Status",
  type: "boolean",
  render: (value) => (
    <span class={`badge ${value ? "badge-success" : "badge-error"}`}>
      {value ? "Active" : "Inactive"}
    </span>
  ),
}

// Enum as colored badge
{
  name: "role",
  label: "Role",
  type: "select",
  options: [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
    { value: "superadmin", label: "Super Admin" },
  ],
  render: (value) => {
    const colors: Record<string, string> = {
      user: "badge-ghost",
      admin: "badge-primary",
      superadmin: "badge-secondary",
    };
    return <span class={`badge ${colors[value as string]}`}>{value}</span>;
  },
}

// Price with currency formatting
{
  name: "price",
  label: "Price",
  type: "number",
  render: (value) => `$${(value as number).toFixed(2)}`,
  format: (value) => `$${(value as number).toFixed(2)}`,
}

// Image preview
{
  name: "imageUrl",
  label: "Image",
  type: "string",
  showInList: true,
  render: (value) => value ? (
    <img src={value as string} alt="" class="w-10 h-10 rounded object-cover" />
  ) : null,
}

// Related entity link
{
  name: "authorId",
  label: "Author",
  type: "number",
  render: (value, record) => (
    <a href={`/admin/users/${value}`} class="link link-primary">
      {record.authorName || `User #${value}`}
    </a>
  ),
}
```

---

## Generic Components

### DataTable

**Source**:
[packages/admin-ui-starter/components/admin/DataTable.tsx](packages/admin-ui-starter/components/admin/DataTable.tsx)

Renders a dynamic data table based on entity configuration.

```typescript
interface DataTableProps<T = Record<string, unknown>> {
  config: EntityConfig<T>;
  data: T[];
  currentSort?: string;
  currentSortOrder?: "asc" | "desc";
  onSort?: (column: string) => void;
}

// Usage in route
export default function ArticleListPage(props: PageProps) {
  const { data, pagination } = props.data;

  return (
    <div class="p-6">
      <DataTable
        config={articleConfig}
        data={data}
        currentSort="createdAt"
        currentSortOrder="desc"
      />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/admin/articles"
      />
    </div>
  );
}
```

**Features**:

- Dynamic columns from `fields` where `showInList: true`
- Custom rendering via `render` function
- Sortable columns (clickable headers)
- Action buttons (view, edit, delete)
- Responsive design

### ShowPage

**Source**:
[packages/admin-ui-starter/components/admin/ShowPage.tsx](packages/admin-ui-starter/components/admin/ShowPage.tsx)

Renders a detail view page for a single record.

```typescript
interface ShowPageProps<T = Record<string, unknown>> {
  config: EntityConfig<T>;
  item: T;
}

// Usage
export default function ArticleShowPage(props: PageProps) {
  const { item } = props.data;

  return <ShowPage config={articleConfig} item={item} />;
}
```

**Features**:

- Grid layout of all fields where `showInShow: true`
- Custom rendering via `render` function
- Edit/Delete action buttons
- Back navigation

### GenericForm

**Source**:
[packages/admin-ui-starter/components/admin/GenericForm.tsx](packages/admin-ui-starter/components/admin/GenericForm.tsx)

Renders a form for creating or editing records.

```typescript
interface GenericFormProps<T = Record<string, unknown>> {
  config: EntityConfig<T>;
  item?: T; // Existing record (for edit)
  errors?: Record<string, string>; // Validation errors
  isEdit?: boolean; // Edit mode flag
}

// Usage
export default function ArticleEditPage(props: PageProps) {
  const { item, errors } = props.data;

  return (
    <GenericForm
      config={articleConfig}
      item={item}
      errors={errors}
      isEdit={true}
    />
  );
}
```

**Features**:

- Dynamic fields from `fields` where `showInForm: true`
- Correct input types per field type
- Required field indicators
- Error message display
- Help text display
- Select options for select/status fields
- JSON formatting for json fields

### Pagination

**Source**:
[packages/admin-ui-starter/components/admin/Pagination.tsx](packages/admin-ui-starter/components/admin/Pagination.tsx)

Renders pagination controls.

```typescript
interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

// Usage
<Pagination
  page={2}
  totalPages={10}
  basePath="/admin/articles"
  searchParams={{ search: "typescript" }}
/>;
```

**Features**:

- Previous/Next buttons
- Page number links
- Ellipsis for large page counts
- Preserves search params

---

## CRUD Handlers

**Source**:
[packages/admin-ui-starter/lib/admin/crud-handlers.ts](packages/admin-ui-starter/lib/admin/crud-handlers.ts)

Factory function that creates Fresh route handlers for CRUD operations.

```typescript
export function createCRUDHandlers<T = Record<string, unknown>>(
  config: EntityConfig<T>,
): CRUDHandlers<T> {
  return {
    // GET handler for list page
    async list(ctx: FreshContext): Promise<Response | ListPageData<T>> {
      const url = new URL(ctx.req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const search = url.searchParams.get("search") || "";
      const sortBy = url.searchParams.get("sortBy") || "";
      const sortOrder = url.searchParams.get("sortOrder") || "asc";

      const result = await config.service.list({
        page,
        search,
        sortBy,
        sortOrder,
      });
      return { data: result.data, pagination: result.pagination };
    },

    // GET handler for show page
    async show(ctx: FreshContext): Promise<Response | ShowPageData<T>> {
      const id = ctx.params.id;
      const item = config.service.getByKey
        ? await config.service.getByKey(id)
        : await config.service.getById!(id);

      if (!item) {
        return new Response(null, { status: 404 });
      }
      return { data: item };
    },

    // GET handler for create page
    createGet(ctx: FreshContext): CreatePageData {
      return { data: {} };
    },

    // POST handler for create form
    async createPost(ctx: FreshContext): Promise<Response | CreatePageData> {
      const formData = await ctx.req.formData();
      const data = Object.fromEntries(formData);

      try {
        const created = await config.service.create(data as Partial<T>);
        return Response.redirect(
          `${ctx.url.origin}/admin/${config.name}/${created[config.idField]}`,
          303,
        );
      } catch (error) {
        return { data: data, errors: parseError(error) };
      }
    },

    // GET handler for edit page
    async editGet(ctx: FreshContext): Promise<EditPageData<T>> {
      const id = ctx.params.id;
      const item = await config.service.getById!(id);
      return { data: item };
    },

    // POST handler for edit form
    async editPost(ctx: FreshContext): Promise<Response | EditPageData<T>> {
      const id = ctx.params.id;
      const formData = await ctx.req.formData();
      const data = Object.fromEntries(formData);

      try {
        await config.service.update(id, data as Partial<T>);
        return Response.redirect(
          `${ctx.url.origin}/admin/${config.name}/${id}`,
          303,
        );
      } catch (error) {
        const item = await config.service.getById!(id);
        return { data: item, errors: parseError(error) };
      }
    },

    // POST handler for delete
    async delete(ctx: FreshContext): Promise<Response> {
      const id = ctx.params.id;
      await config.service.delete(id);
      return Response.redirect(
        `${ctx.url.origin}/admin/${config.name}`,
        303,
      );
    },
  };
}
```

### Usage in Routes

```typescript
// routes/admin/articles/index.tsx
import { define } from "../../../utils.ts";
import { createCRUDHandlers } from "../../../lib/admin/crud-handlers.ts";
import { articleConfig } from "../../../config/entities/articles.ts";
import DataTable from "../../../components/admin/DataTable.tsx";
import Pagination from "../../../components/admin/Pagination.tsx";

const handlers = createCRUDHandlers(articleConfig);

export const handler = define.handlers({
  GET: handlers.list,
});

export default define.page(function ArticleListPage(props) {
  const { data, pagination } = props.data;

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">{articleConfig.pluralName}</h1>
        {articleConfig.canCreate && (
          <a href={`/admin/${articleConfig.name}/new`} class="btn btn-primary">
            Create {articleConfig.singularName}
          </a>
        )}
      </div>

      <DataTable config={articleConfig} data={data} />
      <Pagination {...pagination} basePath={`/admin/${articleConfig.name}`} />
    </div>
  );
});
```

---

## Routes Structure

### Standard CRUD Routes

For each entity, create these route files:

```
routes/admin/{entity}/
├── index.tsx        # GET  /admin/{entity}       - List page
├── [id].tsx         # GET  /admin/{entity}/:id   - Show page
├── new.tsx          # GET  /admin/{entity}/new   - Create form
│                    # POST /admin/{entity}/new   - Create action
└── [id]/
    └── edit.tsx     # GET  /admin/{entity}/:id/edit  - Edit form
                     # POST /admin/{entity}/:id/edit  - Update action
```

### List Page (index.tsx)

```typescript
// routes/admin/articles/index.tsx
import { define } from "../../../utils.ts";
import { createCRUDHandlers } from "../../../lib/admin/crud-handlers.ts";
import { articleConfig } from "../../../config/entities/articles.ts";
import DataTable from "../../../components/admin/DataTable.tsx";
import Pagination from "../../../components/admin/Pagination.tsx";

const handlers = createCRUDHandlers(articleConfig);

export const handler = define.handlers({
  GET: handlers.list,
});

export default define.page(function ArticleListPage(props) {
  const { data, pagination } = props.data;

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">{articleConfig.pluralName}</h1>
        <a href="/admin/articles/new" class="btn btn-primary">
          Create Article
        </a>
      </div>

      <DataTable config={articleConfig} data={data} />

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          basePath="/admin/articles"
        />
      )}
    </div>
  );
});
```

### Show Page ([id].tsx)

```typescript
// routes/admin/articles/[id].tsx
import { define } from "../../../utils.ts";
import { createCRUDHandlers } from "../../../lib/admin/crud-handlers.ts";
import { articleConfig } from "../../../config/entities/articles.ts";
import ShowPage from "../../../components/admin/ShowPage.tsx";

const handlers = createCRUDHandlers(articleConfig);

export const handler = define.handlers({
  GET: handlers.show,
  POST: handlers.delete, // Delete action
});

export default define.page(function ArticleShowPage(props) {
  const item = props.data;

  if (!item) {
    return <div class="p-6">Article not found</div>;
  }

  return (
    <div class="p-6">
      <ShowPage config={articleConfig} item={item} />
    </div>
  );
});
```

### Create Page (new.tsx)

```typescript
// routes/admin/articles/new.tsx
import { define } from "../../../utils.ts";
import { createCRUDHandlers } from "../../../lib/admin/crud-handlers.ts";
import { articleConfig } from "../../../config/entities/articles.ts";
import GenericForm from "../../../components/admin/GenericForm.tsx";

const handlers = createCRUDHandlers(articleConfig);

export const handler = define.handlers({
  GET: handlers.createGet,
  POST: handlers.createPost,
});

export default define.page(function ArticleCreatePage(props) {
  const { data, errors } = props.data || {};

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">
        Create {articleConfig.singularName}
      </h1>
      <GenericForm
        config={articleConfig}
        item={data}
        errors={errors}
        isEdit={false}
      />
    </div>
  );
});
```

### Edit Page ([id]/edit.tsx)

```typescript
// routes/admin/articles/[id]/edit.tsx
import { define } from "../../../../utils.ts";
import { createCRUDHandlers } from "../../../../lib/admin/crud-handlers.ts";
import { articleConfig } from "../../../../config/entities/articles.ts";
import GenericForm from "../../../../components/admin/GenericForm.tsx";

const handlers = createCRUDHandlers(articleConfig);

export const handler = define.handlers({
  GET: handlers.editGet,
  POST: handlers.editPost,
});

export default define.page(function ArticleEditPage(props) {
  const { data, errors } = props.data || {};

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Edit {articleConfig.singularName}</h1>
      <GenericForm
        config={articleConfig}
        item={data}
        errors={errors}
        isEdit={true}
      />
    </div>
  );
});
```

---

## Base Service (Frontend)

**Source**:
[packages/admin-ui-starter/lib/base-service.ts](packages/admin-ui-starter/lib/base-service.ts)

Base class for API communication from the frontend.

```typescript
// Source: packages/admin-ui-starter/lib/base-service.ts
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class BaseService<T> {
  protected client: HttpClient = apiClient;

  constructor(protected readonly basePath: string) {}

  // Set custom HTTP client (for SSR)
  setClient(client: HttpClient): void {
    this.client = client;
  }

  // List with pagination
  async list(params: ListParams = {}): Promise<ListResponse<T>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const query = searchParams.toString();
    const url = query ? `${this.basePath}?${query}` : this.basePath;

    return await this.client.get<ListResponse<T>>(url);
  }

  // Get by numeric ID
  async getById(id: string | number): Promise<T> {
    return await this.client.get<T>(`${this.basePath}/${id}`);
  }

  // Get by string key (for slug-based entities)
  async getByKey(key: string): Promise<T> {
    return await this.client.get<T>(`${this.basePath}/${key}`);
  }

  // Create new record
  async create(data: Partial<T>): Promise<T> {
    return await this.client.post<T>(this.basePath, data);
  }

  // Update existing record
  async update(id: string | number, data: Partial<T>): Promise<T> {
    return await this.client.put<T>(`${this.basePath}/${id}`, data);
  }

  // Delete record
  async delete(id: string | number): Promise<void> {
    await this.client.delete<void>(`${this.basePath}/${id}`);
  }
}
```

### Creating Entity Services

```typescript
// entities/articles/article.service.ts
import { BaseService } from "../../lib/base-service.ts";
import type { Article } from "./article.types.ts";

class ArticleService extends BaseService<Article> {
  constructor() {
    super("/ts-admin/articles");
  }

  // Custom methods
  async getPublished(): Promise<Article[]> {
    const response = await this.client.get<{ data: Article[] }>(
      `${this.basePath}?isPublished=true`,
    );
    return response.data;
  }
}

export const articleService = new ArticleService();
```

---

## @tstack/admin Package

The `@tstack/admin` package provides framework-agnostic adapters for building
admin interfaces.

**Source**: [packages/admin/](packages/admin/)

### Package Exports

```typescript
// packages/admin/mod.ts
export type {
  AuthUser,
  EntityId,
  PaginationParams,
  PaginationResult,
  SearchableColumn,
  SortableColumn,
  UserRole,
} from "./src/core/types.ts";

export {
  calculatePagination,
  type PaginationMeta,
} from "./src/core/pagination.ts";

export type { IORMAdapter } from "./src/orm/base.ts";
export { DrizzleAdapter } from "./src/orm/drizzle.ts";

export { type AdminConfig, HonoAdminAdapter } from "./src/framework/hono.ts";
```

### Core Types

```typescript
// Source: packages/admin/src/core/types.ts
export type EntityId = number | string;
export type SearchableColumn = string;
export type SortableColumn = string;
export type SortDirection = "asc" | "desc";

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  searchColumns?: SearchableColumn[];
  orderBy?: string;
  orderDir?: SortDirection;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export type UserRole = "superadmin" | "admin" | "moderator" | "user";

export interface AuthUser {
  id: EntityId;
  email: string;
  username?: string;
  role: UserRole;
}
```

---

### DrizzleAdapter

**Source**:
[packages/admin/src/orm/drizzle.ts](packages/admin/src/orm/drizzle.ts)

ORM adapter for Drizzle that provides standardized CRUD operations.

```typescript
export interface DrizzleAdapterConfig {
  db: DrizzleDB;
  idColumn?: string; // Default: "id"
  idType?: "number" | "string"; // Default: "number"
}

export class DrizzleAdapter<T> implements IORMAdapter<T> {
  constructor(
    private table: PgTable,
    private config: DrizzleAdapterConfig,
  ) {}

  // List with pagination, search, and sorting
  async findMany(params: PaginationParams): Promise<PaginationResult<T>> {
    // 1. Build base query
    // 2. Apply search filter (ILIKE on searchColumns)
    // 3. Apply sorting
    // 4. Apply pagination (offset/limit)
    // 5. Get total count
    // 6. Return paginated result
  }

  // Get single record by ID
  async findById(id: EntityId): Promise<T | null> {
    const [result] = await this.config.db
      .select()
      .from(this.table)
      .where(eq(this.table[this.config.idColumn || "id"], id));
    return result || null;
  }

  // Create with auto-features
  async create(data: Partial<T>): Promise<T> {
    // Auto-features:
    // 1. Generate slug from "name" field if exists
    // 2. Ensure slug uniqueness (add -1, -2 suffix)
    // 3. Auto-increment displayOrder if exists
    // 4. Clean empty values
    // 5. Call beforeCreate hook

    const [result] = await this.config.db
      .insert(this.table)
      .values(processedData)
      .returning();
    return result;
  }

  // Update with hooks
  async update(id: EntityId, data: Partial<T>): Promise<T | null> {
    // Auto-features:
    // 1. Update slug if name changed
    // 2. Shift displayOrder if changed (Rails acts_as_list style)
    // 3. Call beforeUpdate hook

    const [result] = await this.config.db
      .update(this.table)
      .set(data)
      .where(eq(this.table[this.idColumn], id))
      .returning();
    return result || null;
  }

  // Delete single record
  async delete(id: EntityId): Promise<boolean> {
    const result = await this.config.db
      .delete(this.table)
      .where(eq(this.table[this.idColumn], id));
    return result.rowCount > 0;
  }

  // Bulk delete
  async deleteMany(ids: EntityId[]): Promise<number> {
    const result = await this.config.db
      .delete(this.table)
      .where(inArray(this.table[this.idColumn], ids));
    return result.rowCount;
  }

  // Count records
  async count(search?: string, searchColumns?: string[]): Promise<number> {
    // Apply same search filter as findMany
    const [{ count }] = await this.config.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(searchCondition);
    return count;
  }
}
```

### Auto-Features (v2.1.0+)

The DrizzleAdapter automatically handles:

1. **Slug Generation**: If table has `name` and `slug` columns, slug is
   auto-generated from name
2. **Unique Slugs**: If slug exists, adds `-1`, `-2` suffix until unique
3. **Display Order**: If table has `displayOrder`, auto-increments on create
4. **Display Order Shifting**: On update, shifts other records (like Rails
   acts_as_list)
5. **Empty Value Cleanup**: Removes empty strings before insert

---

### HonoAdminAdapter

**Source**:
[packages/admin/src/framework/hono.ts](packages/admin/src/framework/hono.ts)

HTTP handler adapter for Hono that provides standardized admin endpoints.

```typescript
export interface AdminConfig<T> {
  ormAdapter: IORMAdapter<T>;
  entityName: string; // "article"
  entityNamePlural?: string; // "articles" (auto-pluralized)
  columns: string[]; // Columns to return
  searchable?: string[]; // Columns to search
  sortable?: string[]; // Columns that can be sorted
  allowedRoles?: UserRole[]; // Roles that can access
  baseUrl?: string; // Base URL for links

  // Lifecycle hooks
  beforeCreate?: (data: Partial<T>) => Partial<T> | Promise<Partial<T>>;
  beforeUpdate?: (data: Partial<T>) => Partial<T> | Promise<Partial<T>>;
}

export class HonoAdminAdapter<T> {
  constructor(private config: AdminConfig<T>) {}

  // GET / - List with pagination
  list(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      const page = parseInt(c.req.query("page") || "1");
      const limit = parseInt(c.req.query("limit") || "20");
      const search = c.req.query("search") || "";
      const sortBy = c.req.query("sortBy") || "";
      const sortOrder = c.req.query("sortOrder") || "asc";

      const result = await this.config.ormAdapter.findMany({
        page,
        limit,
        search,
        searchColumns: this.config.searchable,
        orderBy: sortBy,
        orderDir: sortOrder as SortDirection,
      });

      return c.json(result);
    };
  }

  // GET /:id - Single record
  show(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      const id = c.req.param("id");
      const record = await this.config.ormAdapter.findById(id);

      if (!record) {
        return c.json({ error: `${this.config.entityName} not found` }, 404);
      }

      return c.json({ data: record });
    };
  }

  // GET /new - Form metadata
  new(): (c: Context) => Response {
    return (c: Context) => {
      return c.json({
        columns: this.config.columns,
        entityName: this.config.entityName,
      });
    };
  }

  // POST / - Create record
  create(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      let data = await c.req.json();

      if (this.config.beforeCreate) {
        data = await this.config.beforeCreate(data);
      }

      const record = await this.config.ormAdapter.create(data);
      return c.json({ data: record }, 201);
    };
  }

  // GET /:id/edit - Record for editing
  edit(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      const id = c.req.param("id");
      const record = await this.config.ormAdapter.findById(id);

      if (!record) {
        return c.json({ error: `${this.config.entityName} not found` }, 404);
      }

      return c.json({
        data: record,
        columns: this.config.columns,
      });
    };
  }

  // PUT /:id - Update record
  update(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      const id = c.req.param("id");
      let data = await c.req.json();

      if (this.config.beforeUpdate) {
        data = await this.config.beforeUpdate(data);
      }

      const record = await this.config.ormAdapter.update(id, data);

      if (!record) {
        return c.json({ error: `${this.config.entityName} not found` }, 404);
      }

      return c.json({ data: record });
    };
  }

  // DELETE /:id - Delete record
  destroy(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      const id = c.req.param("id");
      const deleted = await this.config.ormAdapter.delete(id);

      if (!deleted) {
        return c.json({ error: `${this.config.entityName} not found` }, 404);
      }

      return c.json({ message: `${this.config.entityName} deleted` });
    };
  }

  // POST /bulk-delete - Bulk delete
  bulkDelete(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      const { ids } = await c.req.json();

      if (!Array.isArray(ids) || ids.length === 0) {
        return c.json({ error: "No IDs provided" }, 400);
      }

      const count = await this.config.ormAdapter.deleteMany(ids);
      return c.json({ message: `Deleted ${count} records` });
    };
  }
}
```

### Usage Example

```typescript
// Source: packages/api-starter/src/entities/articles/article.admin.route.ts
import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { requireAdmin } from "../../shared/middleware/requireRole.ts";

// Create ORM adapter
const ormAdapter = new DrizzleAdapter(articles, {
  db,
  idColumn: "id",
  idType: "number",
});

// Create admin adapter
const admin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "article",
  entityNamePlural: "articles",
  columns: [
    "id",
    "title",
    "slug",
    "isPublished",
    "authorId",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["title", "slug", "content"],
  sortable: ["id", "title", "createdAt", "updatedAt"],
  allowedRoles: ["superadmin", "admin"],

  // Optional hooks
  beforeCreate: async (data) => {
    // Add current user as author
    return { ...data, authorId: getCurrentUserId() };
  },
});

// Create routes
export const articleAdminRoutes = new Hono();

// Apply auth middleware
articleAdminRoutes.use("*", requireAuth, requireAdmin);

// Mount handlers
articleAdminRoutes.get("/", admin.list());
articleAdminRoutes.get("/new", admin.new());
articleAdminRoutes.get("/:id", admin.show());
articleAdminRoutes.get("/:id/edit", admin.edit());
articleAdminRoutes.post("/", admin.create());
articleAdminRoutes.put("/:id", admin.update());
articleAdminRoutes.delete("/:id", admin.destroy());
articleAdminRoutes.post("/bulk-delete", admin.bulkDelete());
```

---

### Pagination Utilities

**Source**:
[packages/admin/src/core/pagination.ts](packages/admin/src/core/pagination.ts)

```typescript
export interface PaginationMeta {
  offset: number;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// Calculate pagination metadata
export function calculatePagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  return {
    offset,
    page,
    limit,
    total,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}

// Build paginated response
export function buildPaginationResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginationResult<T> {
  const meta = calculatePagination(page, limit, total);

  return {
    data,
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
    hasPrevious: meta.hasPrevious,
    hasNext: meta.hasNext,
  };
}

// Generate page numbers for pagination UI
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7,
): (number | "...")[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const half = Math.floor((maxVisible - 2) / 2);

  if (currentPage <= half + 1) {
    // Near start
    for (let i = 1; i <= maxVisible - 2; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - half) {
    // Near end
    pages.push(1);
    pages.push("...");
    for (let i = totalPages - maxVisible + 3; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Middle
    pages.push(1);
    pages.push("...");
    for (let i = currentPage - half + 1; i <= currentPage + half - 1; i++) {
      pages.push(i);
    }
    pages.push("...");
    pages.push(totalPages);
  }

  return pages;
}
```

---

## Storefront Starter

**Source**: [packages/storefront-starter/](packages/storefront-starter/)

### Project Structure

```
storefront-starter/
├── deno.json                    # Deno configuration
├── main.ts                      # Fresh app entry point
├── client.ts                    # Client-side entry
├── utils.ts                     # Fresh utilities
├── vite.config.ts               # Vite bundler config
├── assets/
│   └── styles.css               # Tailwind CSS
├── static/
│   └── styles.css               # Compiled CSS
├── components/
│   ├── Navbar.tsx               # Navigation bar
│   ├── Footer.tsx               # Site footer
│   ├── Hero.tsx                 # Hero section
│   ├── Features.tsx             # Features grid
│   └── ... (other components)
├── islands/
│   └── ... (interactive components)
└── routes/
    ├── _app.tsx                 # App layout
    ├── index.tsx                # Landing page
    └── api/
        └── ... (API routes)
```

### Key Components

**Navbar** - Responsive navigation with mobile menu:

```typescript
// components/Navbar.tsx
export default function Navbar() {
  return (
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" class="flex items-center">
            <span class="text-xl font-bold">Store</span>
          </a>

          {/* Desktop Navigation */}
          <div class="hidden md:flex space-x-8">
            <a href="/products">Products</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </div>

          {/* Mobile menu button */}
          <button class="md:hidden">
            {/* Menu icon */}
          </button>
        </div>
      </div>
    </nav>
  );
}
```

**Hero Section** - Landing page hero:

```typescript
// components/Hero.tsx
export default function Hero() {
  return (
    <section class="relative pt-20 pb-32 bg-gradient-to-br from-indigo-50 to-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-5xl font-bold tracking-tight text-gray-900">
            Welcome to Our Store
          </h1>
          <p class="mt-6 text-lg text-gray-600">
            Discover amazing products at great prices.
          </p>
          <div class="mt-10 flex justify-center gap-4">
            <a href="/products" class="btn btn-primary">
              Shop Now
            </a>
            <a href="/about" class="btn btn-outline">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## Troubleshooting

### Common Issues

#### 1. Entity Config Not Loading

**Symptom**: DataTable shows no columns or empty data

**Cause**: Entity config import path is wrong or service not initialized

**Solution**:

```typescript
// Check config import
import { articleConfig } from "../../../config/entities/articles.ts";

// Verify service has setClient called (for SSR)
articleConfig.service.setClient(createApiClient(ctx.req.headers));
```

#### 2. Form Validation Errors Not Showing

**Symptom**: Form submits but errors don't display

**Cause**: Errors not passed to GenericForm component

**Solution**:

```typescript
export default define.page(function CreatePage(props) {
  const { data, errors } = props.data || {};

  return (
    <GenericForm
      config={config}
      item={data}
      errors={errors} // Make sure this is passed
    />
  );
});
```

#### 3. Pagination Not Working

**Symptom**: Always shows page 1

**Cause**: Query params not preserved in pagination links

**Solution**:

```typescript
<Pagination
  page={pagination.page}
  totalPages={pagination.totalPages}
  basePath="/admin/articles"
  searchParams={{ search: searchTerm }} // Preserve search
/>;
```

#### 4. Custom Render Function Error

**Symptom**: "Cannot read property of undefined" in render function

**Cause**: Value might be null/undefined

**Solution**:

```typescript
{
  name: "imageUrl",
  render: (value) => {
    if (!value) return null;  // Handle null case
    return <img src={value as string} alt="" />;
  },
}
```

#### 5. API Request Fails (CORS)

**Symptom**: Network error when calling API from admin-ui

**Cause**: API doesn't have admin-ui origin in CORS

**Solution**: Add admin-ui URL to API's `ALLOWED_ORIGINS`:

```bash
# In API .env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

#### 6. Authentication Token Lost

**Symptom**: Logged out after navigation

**Cause**: Token not passed in SSR requests

**Solution**: Ensure token is in cookies and passed to API client:

```typescript
// In route handler
export const handler = define.handlers({
  async GET(ctx) {
    const token = ctx.req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const client = createApiClient(token);
    config.service.setClient(client);
    // ...
  },
});
```

### Deno Formatter Bug

**Issue**: VS Code's Deno formatter corrupts multi-line assertions in test
files.

**Symptoms**:

- Orphaned commas on separate lines
- `assertEquals()` calls split incorrectly
- "Expression expected" syntax errors

**Workaround**: Add to `.vscode/settings.json`:

```json
{
  "files.associations": {
    "*.test.ts": "typescript-test"
  },
  "[typescript-test]": {
    "editor.formatOnSave": false
  }
}
```

---

## Related Documentation

- **CLI Reference**: [LLMS-CLI.md](LLMS-CLI.md)
- **API Reference**: [LLMS-API.md](LLMS-API.md)
- **Main Index**: [LLMS.md](LLMS.md)
- **Coding Standards**: [CODING_STANDARDS.md](CODING_STANDARDS.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
