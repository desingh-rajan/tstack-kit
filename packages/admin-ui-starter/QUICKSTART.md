# TStack UI Admin Kit - Quick Start Guide

## 📦 What You Get

A **Rails-like ActiveAdmin** system for Fresh + Deno:

- ✅ Generic CRUD components (DataTable, ShowPage, GenericForm)
- ✅ BaseService eliminates service boilerplate
- ✅ Type-safe entity configs
- ✅ 4 copy-paste routes per entity
- ✅ Auto-generated forms, tables, detail pages

## 🚀 Adding a New Entity (3 Steps)

### Step 1: Create Service (2 lines!)

**`entities/posts/post.service.ts`**:

```typescript
import { BaseService } from "@/lib/base-service.ts";
import type { Post } from "./post.types.ts";

export class PostService extends BaseService<Post> {
  constructor() {
    super("/ts-admin/posts"); // That's it!
  }
}

export const postService = new PostService();
```

**BaseService gives you:**

- `list(params)` - paginated list
- `getById(id)` - fetch by ID
- `getByKey(key)` - fetch by string key
- `create(data)` - create new
- `update(id, data)` - update existing
- `delete(id)` - delete
- `setClient(client)` - for auth tokens

**Need custom methods?** Just add them:

```typescript
export class PostService extends BaseService<Post> {
  constructor() {
    super("/ts-admin/posts");
  }

  publish(id: number) {
    return this.client.post(`${this.basePath}/${id}/publish`, {});
  }
}
```

### Step 2: Create Entity Config

**`config/entities/posts.config.tsx`**:

```typescript
import type { EntityConfig } from "@/lib/admin/types.ts";
import type { Post } from "@/entities/posts/post.types.ts";
import { postService } from "@/entities/posts/post.service.ts";

export const postConfig: EntityConfig<Post> = {
  name: "posts", // URL: /admin/posts
  singularName: "Post",
  pluralName: "Posts",
  apiPath: "/ts-admin/posts",
  idField: "id",
  service: postService,

  fields: [
    {
      name: "id",
      label: "ID",
      type: "number",
      showInList: true,
      showInShow: true,
      showInForm: false, // Auto-generated
    },
    {
      name: "title",
      label: "Title",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "Enter title",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
      render: (value) => (
        <span
          class={`badge ${
            value === "published" ? "badge-success" : "badge-warning"
          }`}
        >
          {String(value)}
        </span>
      ),
    },
  ],

  canCreate: true,
  canEdit: true,
  canDelete: true,
};
```

### Step 3: Copy-Paste 4 Routes

All routes are **nearly identical**. Just change the import!

**`routes/admin/posts/index.tsx`** (List):

```typescript
import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { DataTable } from "@/components/admin/DataTable.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { postConfig } from "@/config/entities/posts.config.tsx";

const handlers = createCRUDHandlers(postConfig);
export const handler = define.handlers({ GET: handlers.list });

export default define.page<typeof handler>(function ({ data }) {
  const { items, config } = data;
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      <DataTable config={config} data={items} />
    </AdminLayout>
  );
});
```

**`routes/admin/posts/[id].tsx`** (Show):

```typescript
import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { postConfig } from "@/config/entities/posts.config.tsx";

const handlers = createCRUDHandlers(postConfig);
export const handler = define.handlers({
  GET: handlers.show,
  POST: handlers.delete,
});

export default define.page<typeof handler>(function ({ data }) {
  const { item, config } = data;
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      <ShowPage config={config} item={item} />
    </AdminLayout>
  );
});
```

**`routes/admin/posts/new.tsx`** (Create):

```typescript
import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { GenericForm } from "@/components/admin/GenericForm.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { postConfig } from "@/config/entities/posts.config.tsx";

const handlers = createCRUDHandlers(postConfig);
export const handler = define.handlers({
  GET: handlers.createGet,
  POST: handlers.createPost,
});

export default define.page<typeof handler>(function ({ data }) {
  const { config, error, errors, values } = data;
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      <div class="space-y-6">
        <h1 class="text-3xl font-bold">Create New {config.singularName}</h1>
        {error && (
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <GenericForm
              config={config as any}
              item={values}
              errors={errors}
              isEdit={false}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
});
```

**`routes/admin/posts/[id]/edit.tsx`** (Edit):

```typescript
import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { GenericForm } from "@/components/admin/GenericForm.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { postConfig } from "@/config/entities/posts.config.tsx";

const handlers = createCRUDHandlers(postConfig);
export const handler = define.handlers({
  GET: handlers.editGet,
  POST: handlers.editPost,
});

export default define.page<typeof handler>(function ({ data }) {
  const { config, item, error, errors } = data;
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      <div class="space-y-6">
        <h1 class="text-3xl font-bold">Edit {config.singularName}</h1>
        {error && (
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        {item && (
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <GenericForm
                config={config as any}
                item={item}
                errors={errors}
                isEdit
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
});
```

**✅ Done!** Visit `/admin/posts`

## 🎨 Field Types

| Type       | Input           | Use For            |
| ---------- | --------------- | ------------------ |
| `string`   | text            | Short text         |
| `text`     | textarea        | Long text          |
| `number`   | number          | IDs, counts        |
| `boolean`  | checkbox        | True/false         |
| `select`   | dropdown        | Status, categories |
| `date`     | date picker     | Birth dates        |
| `datetime` | datetime picker | Timestamps         |
| `email`    | email input     | Emails             |
| `json`     | textarea        | Settings           |

## 🔧 TStack Backend Integration

**Backend Requirements:**

- API endpoint: `/ts-admin/{entity}`
- List returns: `{ success, data: [], pagination: {...} }`
- Show/Create/Update returns: single object
- JWT Bearer authentication
- CORS enabled

**Entity Types:** Copy from backend or create:

```typescript
// entities/posts/post.types.ts
export interface Post {
  id: number;
  title: string;
  status: "draft" | "published";
  createdAt: Date;
}
```

## 📊 What We Eliminated

**Before refactor:**

- ❌ 90 lines per service (repeated 90%)
- ❌ 80 lines per route file
- ❌ Type casting everywhere
- ❌ Duplicate error handling

**After refactor:**

- ✅ 7 lines per service (extends BaseService)
- ✅ 20 lines per route (copy-paste template)
- ✅ One type cast: `config as any`
- ✅ Framework handles errors

**Reduction: 85% less boilerplate!**

## 🎯 For Scaffold Generators

Generate 3 files per entity:

1. **Service** (7 lines):

```typescript
export class ${Entity}Service extends BaseService<${Entity}> {
  constructor() { super("/ts-admin/${entities}"); }
}
export const ${entity}Service = new ${Entity}Service();
```

2. **Config** (use template + field definitions)

3. **Routes** (copy-paste 4 files, replace config import)

Done!

## ❓ Common Questions

**Q: How do I add custom API methods?**\
A: Extend in your service:

```typescript
export class PostService extends BaseService<Post> {
  constructor() {
    super("/ts-admin/posts");
  }

  publish(id: number) {
    return this.client.post(`${this.basePath}/${id}/publish`, {});
  }
}
```

**Q: Can I customize the UI?**\
A: Yes! Use `render` in field config or modify the route file.

**Q: What if my API returns different format?**\
A: Override methods in your service.

**Q: Do I need to restart the server?**\
A: Yes, Fresh uses file-based routing.

## 🏆 Why This is Industry Standard

1. **DRY** - BaseService, shared handlers, copy-paste routes
2. **SOLID** - Single responsibility, open/closed principle
3. **Convention > Configuration** - Follow the pattern, it just works
4. **Type-Safe** - Full TypeScript support
5. **Scaf foldable** - Easy to generate from templates

This is how modern frameworks should work. Simple, powerful, maintainable.
