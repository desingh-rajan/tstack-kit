# DRY Admin CRUD System - Architecture Documentation

## Overview

This is a **configuration-driven, Rails ActiveAdmin-style** CRUD system for
Fresh 2.2.0. Define your entity once, get full CRUD for free.

## Core Philosophy

1. **DRY** - Don't Repeat Yourself
2. **Config-driven** - One config file per entity
3. **Convention over Configuration** - Sensible defaults
4. **Type-safe** - Full TypeScript support
5. **Reusable** - Same components for all entities

## Architecture

### 1. Entity Configuration (`config/entities/*.config.tsx`)

Each entity has ONE config file that defines:

- All fields and their types
- Display/form/validation rules
- Service methods (list, create, update, delete)
- Permissions (canCreate, canEdit, canDelete)
- Special logic (isSystemRecord, getRouteParam)

**Example:**

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
      showInList: true,
      showInShow: true,
      showInForm: true,
    },
    // ... more fields
  ],
};
```

### 2. Generic Components (`components/admin/`)

Reusable UI components that work for ANY entity:

#### `DataTable.tsx`

- Shows **ALL columns** dynamically
- Handles pagination
- Smart type rendering (boolean → badges, dates → formatted, etc.)
- View/Edit/Delete actions

#### `ShowPage.tsx`

- Displays ALL fields in grid layout
- Auto-formats based on field type
- Responsive 2-column layout
- Back/Edit navigation

#### `GenericForm.tsx`

- Generates forms from config
- Supports all field types: string, text, number, boolean, date, select, json
- Client-side validation
- Error display
- Help text

#### `Pagination.tsx`

- Smart pagination with "..." ellipsis
- Page size selector (10/20/50/100)
- Shows "X to Y of Z results"

### 3. CRUD Handlers (`lib/admin/crud-handlers.ts`)

**One handler factory** that creates all CRUD operations:

```typescript
export function createCRUDHandlers<T>(config: EntityConfig<T>) {
  return {
    list: async (ctx) => {/* fetch paginated list */},
    show: async (ctx) => {/* fetch single record */},
    createGet: async (ctx) => {/* show create form */},
    createPost: async (ctx) => {/* handle create submission */},
    editGet: async (ctx) => {/* show edit form */},
    editPost: async (ctx) => {/* handle update */},
  };
}
```

### 4. Routes (`routes/admin/{entity}/`)

Each entity needs **4 files** (but they're almost identical):

#### `index.tsx` - List page

```typescript
const handlers = createCRUDHandlers(articleConfig);
export const handler = define.handlers({ GET: handlers.list });
export default define.page<typeof handler>(function ListPage({ data }) {
  return (
    <AdminLayout>
      <DataTable config={config} data={data.items.data} />
      <Pagination pagination={data.items.pagination} />
    </AdminLayout>
  );
});
```

#### `[id].tsx` - Show page

```typescript
const handlers = createCRUDHandlers(articleConfig);
export const handler = define.handlers({ GET: handlers.show });
export default define.page<typeof handler>(function ShowPageRoute({ data }) {
  return <ShowPage config={data.config} item={data.item} />;
});
```

#### `new.tsx` - Create page

```typescript
const handlers = createCRUDHandlers(articleConfig);
export const handler = define.handlers({
  GET: handlers.createGet,
  POST: handlers.createPost,
});
export default define.page<typeof handler>(function CreatePage({ data }) {
  return (
    <AdminLayout>
      <GenericForm
        config={data.config}
        item={data.values}
        errors={data.errors}
      />
    </AdminLayout>
  );
});
```

#### `[id]/edit.tsx` - Edit page

```typescript
const handlers = createCRUDHandlers(articleConfig);
export const handler = define.handlers({
  GET: handlers.editGet,
  POST: handlers.editPost,
});
export default define.page<typeof handler>(function EditPage({ data }) {
  return (
    <AdminLayout>
      <GenericForm
        config={data.config}
        item={data.item}
        errors={data.errors}
        isEdit
      />
    </AdminLayout>
  );
});
```

## Field Types

All field types are handled automatically:

| Type       | List View          | Show View          | Form Input                      |
| ---------- | ------------------ | ------------------ | ------------------------------- |
| `string`   | Text               | Text               | `<input type="text">`           |
| `text`     | Truncated          | Pre-formatted      | `<textarea>`                    |
| `number`   | Number             | Number             | `<input type="number">`         |
| `boolean`  | Badge (Yes/No)     | Badge              | `<checkbox>`                    |
| `date`     | Formatted date     | Formatted date     | `<input type="date">`           |
| `datetime` | Formatted datetime | Formatted datetime | `<input type="datetime-local">` |
| `email`    | Text               | Link               | `<input type="email">`          |
| `select`   | Value              | Value              | `<select>` with options         |
| `json`     | Truncated JSON     | Pretty JSON        | `<textarea>` with JSON          |
| `status`   | Colored badge      | Colored badge      | `<select>`                      |
| `badge`    | Outlined badge     | Outlined badge     | `<input>`                       |

## Custom Rendering

Override default rendering with custom functions:

```typescript
{
  name: "status",
  label: "Status",
  type: "select",
  render: (value) => {
    const isDraft = value === "draft";
    return (
      <span class={`badge ${isDraft ? "badge-warning" : "badge-success"}`}>
        {String(value)}
      </span>
    );
  },
}
```

## Pagination

**Automatic** on all list pages:

- Query params: `?page=1&pageSize=20`
- Smart page buttons with ellipsis
- Configurable page sizes
- Result counter

## Authentication

Built into all handlers:

```typescript
const authToken = cookies.match(/auth_token=([^;]+)/)?.[1];
if (!authToken) {
  return new Response(null, {
    status: 303,
    headers: { Location: "/auth/login" },
  });
}
```

## Adding a New Entity

**3 steps total:**

### Step 1: Create config file

```typescript
// config/entities/posts.config.tsx
export const postConfig: EntityConfig<Post> = {
  name: "posts",
  singularName: "Post",
  pluralName: "Posts",
  apiPath: "/ts-admin/posts",
  idField: "id",
  service: postService,
  fields: [/* ... */],
};
```

### Step 2: Create 4 route files

Copy from any existing entity (articles), change import:

```typescript
import { postConfig } from "@/config/entities/posts.config.tsx";
const handlers = createCRUDHandlers(postConfig);
```

### Step 3: Done! ✅

You now have:

- ✅ Paginated list with ALL columns
- ✅ Show page with ALL fields
- ✅ Create form with validation
- ✅ Edit form pre-populated
- ✅ Delete with confirmation
- ✅ Auth checks
- ✅ Error handling
- ✅ Responsive UI

## tstack-kit Scaffolding

Command:

```bash
tstack ui-scaffold posts
```

Generates:

```
config/entities/posts.config.ts      # Entity configuration
routes/admin/posts/index.tsx         # List page
routes/admin/posts/[id].tsx          # Show page
routes/admin/posts/new.tsx           # Create page
routes/admin/posts/[id]/edit.tsx     # Edit page
```

## Fresh 2.2.0 Patterns

**✅ CORRECT (Current):**

```typescript
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {/* ... */},
  async POST(ctx) {/* ... */},
});

export default define.page<typeof handler>(function MyPage({ data }) {
  return <div>{data.value}</div>;
});
```

**❌ DEPRECATED (Old Fresh 1.x):**

```typescript
import { Handlers, PageProps } from "$fresh/server.ts";

export const handler: Handlers<Data> = {
  async GET(req, ctx) {/* ... */},
};

export default function MyPage(props: PageProps<Data>) {
  return <div>{props.data.value}</div>;
}
```

## Benefits

1. **Less Code** - 90% reduction in boilerplate
2. **Consistency** - All entities look and behave the same
3. **Maintainability** - Change once, applies everywhere
4. **Type Safety** - Full TypeScript inference
5. **Scalability** - Add 100 entities with same effort as 1
6. **Testability** - Test generic components once

## File Structure

```
blog-v1-ui/
├── config/
│   └── entities/
│       ├── articles.config.tsx      # Article configuration
│       ├── users.config.tsx         # User configuration
│       └── site-settings.config.tsx # Settings configuration
├── lib/
│   └── admin/
│       ├── types.ts                # Type definitions
│       └── crud-handlers.ts        # Generic handlers
├── components/
│   └── admin/
│       ├── DataTable.tsx           # Generic table
│       ├── ShowPage.tsx            # Generic show page
│       ├── GenericForm.tsx         # Generic form
│       └── Pagination.tsx          # Pagination component
└── routes/
    └── admin/
        ├── articles/
        │   ├── index.tsx           # List
        │   ├── [id].tsx            # Show
        │   ├── new.tsx             # Create
        │   └── [id]/edit.tsx       # Edit
        ├── users/
        │   └── ... (same structure)
        └── site-settings/
            └── ... (same structure)
```

## Comparison

### Before (Old System)

- ❌ 400+ lines per entity
- ❌ Repeated table logic
- ❌ Repeated form logic
- ❌ Repeated pagination code
- ❌ Inconsistent UI
- ❌ Hard to maintain

### After (New System)

- ✅ ~150 lines per entity (config + 4 simple routes)
- ✅ One DataTable component
- ✅ One GenericForm component
- ✅ One Pagination component
- ✅ Consistent UI everywhere
- ✅ Easy to maintain and extend
