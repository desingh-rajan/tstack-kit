# TStack UI Admin Kit - Conventions Guide

## 📁 Project Structure

```plaintext
blog-v1-ui/
├── config/entities/          # Entity configurations (START HERE for new entities)
│   ├── articles.config.tsx
│   ├── users.config.tsx
│   └── site-settings.config.tsx
│
├── entities/                 # Backend API integration
│   ├── articles/
│   │   ├── article.service.ts    # API client for articles
│   │   └── article.types.ts      # TypeScript types from backend
│   ├── users/
│   └── site_settings/
│
├── routes/admin/             # Fresh routes (auto-generated from configs)
│   ├── articles/
│   │   ├── index.tsx         # List page
│   │   ├── [id].tsx          # Show page
│   │   ├── new.tsx           # Create page
│   │   └── [id]/edit.tsx     # Edit page
│   ├── users/
│   └── site-settings/
│
├── components/admin/         # Generic reusable components (DON'T MODIFY)
│   ├── DataTable.tsx
│   ├── GenericForm.tsx
│   ├── ShowPage.tsx
│   └── Pagination.tsx
│
└── lib/admin/               # Core framework (DON'T MODIFY)
    ├── types.ts             # Type definitions
    └── crud-handlers.ts     # Generic CRUD logic
```

## 🚀 Adding a New Entity (5 Simple Steps)

### Step 1: Copy Backend Types

From your TStack backend `blog-v1/src/entities/YOUR_ENTITY/`:

```bash
# Copy the types from backend
cp ../blog-v1/src/entities/posts/post.model.ts entities/posts/post.types.ts
```

Edit `entities/posts/post.types.ts` and export the main type:

```typescript
export interface Post {
  id: number;
  title: string;
  content: string;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

export interface PostListResponse {
  success: boolean;
  data: Post[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

### Step 2: Create Service

Create `entities/posts/post.service.ts`:

```typescript
import { apiClient } from "@/lib/api.ts";
import type { HttpClient } from "@/lib/admin/types.ts";
import type { Post, PostListResponse } from "./post.types.ts";

export class PostService {
  private readonly basePath = "/ts-admin/posts"; // Match your backend route
  private client: HttpClient = apiClient;

  setClient(client: HttpClient): void {
    this.client = client;
  }

  list(
    params?: { page?: number; pageSize?: number },
  ): Promise<PostListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.pageSize) {
      searchParams.set("pageSize", params.pageSize.toString());
    }

    const query = searchParams.toString();
    const path = query ? `${this.basePath}?${query}` : this.basePath;
    return this.client.get<PostListResponse>(path);
  }

  getById(id: string | number): Promise<Post> {
    return this.client.get<Post>(`${this.basePath}/${id}`);
  }

  create(input: Partial<Post>): Promise<Post> {
    return this.client.post<Post>(this.basePath, input);
  }

  update(id: string | number, input: Partial<Post>): Promise<Post> {
    return this.client.put<Post>(`${this.basePath}/${id}`, input);
  }

  delete(id: string | number): Promise<void> {
    return this.client.delete(`${this.basePath}/${id}`).then(() => undefined);
  }
}

export const postService = new PostService();
```

### Step 3: Create Entity Config

Create `config/entities/posts.config.tsx`:

```typescript
import type { EntityConfig } from "@/lib/admin/types.ts";
import type { Post } from "@/entities/posts/post.types.ts";
import { postService } from "@/entities/posts/post.service.ts";

export const postConfig: EntityConfig<Post> = {
  name: "posts", // URL path: /admin/posts
  singularName: "Post", // Displayed in UI
  pluralName: "Posts", // Displayed in UI
  apiPath: "/ts-admin/posts", // Backend API path
  idField: "id", // Primary key field

  service: postService, // Link to service

  displayField: "title", // Main field to display

  fields: [
    {
      name: "id",
      label: "ID",
      type: "number",
      showInList: true,
      showInShow: true,
      showInForm: false, // Don't show in create/edit forms
    },
    {
      name: "title",
      label: "Title",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "Enter post title",
    },
    {
      name: "content",
      label: "Content",
      type: "text", // textarea
      required: true,
      showInList: false,
      showInShow: true,
      showInForm: true,
      rows: 10,
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
    {
      name: "createdAt",
      label: "Created At",
      type: "datetime",
      showInList: true,
      showInShow: true,
      showInForm: false,
    },
  ],

  canCreate: true,
  canEdit: true,
  canDelete: true,
  canView: true,
};
```

### Step 4: Create Routes

Copy and paste these 4 route files:

**`routes/admin/posts/index.tsx`** (List):

```typescript
import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { DataTable } from "@/components/admin/DataTable.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { postConfig } from "@/config/entities/posts.config.tsx";

const handlers = createCRUDHandlers(postConfig);

export const handler = define.handlers({ GET: handlers.list });

export default define.page<typeof handler>(function PostListPage({ data }) {
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

export default define.page<typeof handler>(function PostShowPage({ data }) {
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

export default define.page<typeof handler>(function PostCreatePage({ data }) {
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
              config={postConfig as any}
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

export default define.page<typeof handler>(function PostEditPage({ data }) {
  const { item, config, error, errors } = data;
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      <div class="space-y-6">
        <h1 class="text-3xl font-bold">Edit {config.singularName}</h1>
        {error && (
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <GenericForm
              config={postConfig as any}
              item={item}
              errors={errors}
              isEdit={true}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
});
```

### Step 5: Done

Visit `http://localhost:8000/admin/posts` and your CRUD is ready!

## 🎨 Field Types Reference

| Type       | Description | Form Input                      | Example              |
| ---------- | ----------- | ------------------------------- | -------------------- |
| `string`   | Short text  | `<input type="text">`           | Name, email          |
| `text`     | Long text   | `<textarea>`                    | Description, content |
| `number`   | Integer     | `<input type="number">`         | Age, count           |
| `boolean`  | True/false  | `<input type="checkbox">`       | Is active            |
| `select`   | Dropdown    | `<select>`                      | Status, category     |
| `date`     | Date only   | `<input type="date">`           | Birth date           |
| `datetime` | Date & time | `<input type="datetime-local">` | Created at           |
| `email`    | Email       | `<input type="email">`          | User email           |
| `json`     | JSON object | `<textarea>`                    | Settings, metadata   |

## 🎯 Common Patterns

### Custom Rendering

```typescript
{
  name: "status",
  label: "Status",
  type: "string",
  render: (value) => {
    const colors = { active: "success", inactive: "error" };
    return <span class={`badge badge-${colors[value as string]}`}>{String(value)}</span>;
  },
}
```

### Validation

```typescript
{
  name: "email",
  label: "Email",
  type: "email",
  required: true,
  validate: (value) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      return "Invalid email format";
    }
  },
}
```

### Prevent Deletion of System Records

```typescript
export const userConfig: EntityConfig<User> = {
  // ... other config
  isSystemRecord: (record) => record.role === "superadmin",
};
```

## 🔧 Backend Integration Checklist

- [ ] Backend API endpoint exists (e.g., `/ts-admin/posts`)
- [ ] Endpoint returns `{ success, data, pagination }` for list
- [ ] Endpoint returns single object for show/create/update
- [ ] API uses JWT Bearer token authentication
- [ ] CORS is enabled for frontend origin
- [ ] Types match between frontend and backend

## ❌ Common Mistakes to Avoid

1. **Wrong API path** - Make sure `apiPath` in config matches your backend route
2. **Missing service methods** - All services need: list, getById, create,
   update, delete
3. **Type mismatches** - Backend and frontend types must match
4. **Forgetting `as any` in GenericForm** - Use `config={postConfig as any}` to
   avoid type issues
5. **Not exporting singleton** - Always export
   `export const postService = new PostService()`

## 🆘 Troubleshooting

**"401 Unauthorized"** → Check if auth_token cookie is set **"403 Forbidden"** →
User doesn't have RBAC permissions **"Type error in config"** → Add `as any` to
GenericForm config prop **"Cannot read property"** → Check if service is
properly initialized **"Route not found"** → Restart dev server after adding new
routes

## 📚 Learn More

- See `config/entities/articles.config.tsx` for full example
- See `lib/admin/types.ts` for all available options
- TStack Backend API Kit: [Link to your backend repo]
