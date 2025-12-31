# TStack-Kit Fresh UI Conventions

## 🎯 Mission

Adapt tstack-kit's backend entity conventions to Fresh framework for consistent
full-stack Deno development.

## 📁 Backend Entity Structure (Current - tstack-kit)

```
src/entities/articles/
├── article.model.ts          # Drizzle ORM schema
├── article.dto.ts            # Zod validation schemas
├── article.service.ts        # Business logic layer
├── article.controller.ts     # HTTP handlers
├── article.route.ts          # Public API routes
├── article.admin.route.ts    # Admin API routes (/ts-admin/articles)
├── article.test.ts           # Public route tests
├── article.admin.test.ts     # Admin route tests
└── article.interface.ts      # TypeScript interfaces
```

**Key Principles:**

- ✅ Entity-centric folder organization
- ✅ All related files in one folder
- ✅ Singular file naming (article.*)
- ✅ Clear separation of concerns (model/dto/service/controller/route)
- ✅ Public vs Admin route separation

---

## 🎨 Fresh Framework Structure (Default)

```
<project-root>/
├── routes/                   # File-based routing
│   ├── index.tsx            # GET /
│   ├── about.tsx            # GET /about
│   ├── api/
│   │   └── joke.ts          # API route
│   └── _app.tsx             # App wrapper
├── islands/                  # Interactive components
│   └── Counter.tsx
├── components/               # Static components
│   └── Button.tsx
├── static/                   # Static assets
├── main.ts                   # Server entry
└── deno.json
```

**Fresh Characteristics:**

- ✅ File-based routing (`routes/` folder)
- ✅ Islands for interactivity
- ✅ Components for static parts
- ❌ No built-in entity folder structure
- ❌ Scattered files by type (not by feature)

---

## 💡 Proposed: TStack Fresh UI Conventions

### Option 1: Hybrid Approach (RECOMMENDED)

Combine Fresh's file-based routing with tstack entity organization:

```
<project-root>/
├── routes/
│   ├── index.tsx                    # Landing page
│   ├── auth/
│   │   ├── login.tsx               # GET/POST /auth/login
│   │   └── register.tsx            # GET/POST /auth/register
│   ├── dashboard/
│   │   └── index.tsx               # GET /dashboard (protected)
│   └── admin/
│       ├── articles/
│       │   ├── index.tsx           # GET /admin/articles (list)
│       │   ├── [id].tsx            # GET /admin/articles/:id (view)
│       │   ├── [id]/edit.tsx       # GET /admin/articles/:id/edit
│       │   └── new.tsx             # GET /admin/articles/new (create)
│       └── site-settings/
│           ├── index.tsx           # GET /admin/site-settings
│           └── [id]/edit.tsx       # GET /admin/site-settings/:id/edit
├── entities/                        # Entity logic (tstack style!)
│   ├── articles/
│   │   ├── article.service.ts      # API client for /ts-admin/articles
│   │   ├── article.types.ts        # TypeScript types (from backend DTOs)
│   │   ├── ArticleList.tsx         # List component
│   │   ├── ArticleForm.tsx         # Create/Edit form component
│   │   ├── ArticleCard.tsx         # Display component
│   │   └── article.utils.ts        # Entity-specific utilities
│   └── site-settings/
│       ├── site-setting.service.ts
│       ├── site-setting.types.ts
│       ├── SiteSettingList.tsx
│       └── SiteSettingForm.tsx
├── islands/                         # Interactive islands
│   ├── ArticleFormIsland.tsx       # Form with validation
│   ├── DeleteConfirmIsland.tsx     # Confirmation modal
│   └── SearchIsland.tsx            # Search with debounce
├── components/                      # Shared UI components
│   ├── layout/
│   │   ├── AdminLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
├── lib/                            # Core utilities
│   ├── api.ts                      # API client (fetch wrapper)
│   ├── auth.ts                     # Auth utilities
│   └── config.ts                   # App configuration
├── static/
│   ├── styles.css                  # Global styles (with DaisyUI)
│   └── logo.svg
├── main.ts
└── deno.json
```

### File Naming Conventions

**Routes:** `kebab-case.tsx` or `[param].tsx`

- `routes/admin/articles/index.tsx`
- `routes/admin/articles/[id]/edit.tsx`

**Entity Files:** `entity.purpose.ts` (singular entity name)

- `entities/articles/article.service.ts`
- `entities/articles/article.types.ts`
- `entities/articles/ArticleForm.tsx` (PascalCase for components)

**Components:** `PascalCase.tsx`

- `components/ui/Button.tsx`
- `components/layout/AdminLayout.tsx`

---

## 🔄 Entity-Centric Workflow

### 1. Backend Scaffolds Entity

```bash
# In blog-v1 API project
tstack scaffold articles
```

Generates:

- Backend API at `/ts-admin/articles`
- Model, DTO, Service, Controller, Routes
- Tests

### 2. Frontend Auto-Generates UI (Future)

```bash
# Will be part of tstack scaffold or separate command
tstack ui:scaffold articles
```

Generates in Fresh UI project:

```
entities/articles/
├── article.service.ts       # API client
├── article.types.ts         # Copied from backend DTOs
├── ArticleList.tsx          # List view
├── ArticleForm.tsx          # Create/Edit form
└── ArticleCard.tsx          # Display component

routes/admin/articles/
├── index.tsx                # List page
├── [id].tsx                 # View page
├── [id]/edit.tsx            # Edit page
└── new.tsx                  # Create page
```

---

## 📦 Entity Service Pattern

Each entity has a service that talks to the backend API:

```typescript
// entities/articles/article.service.ts
import { apiClient } from "@/lib/api.ts";
import type {
  Article,
  CreateArticleDTO,
  UpdateArticleDTO,
} from "./article.types.ts";

export class ArticleService {
  private static baseUrl = "/ts-admin/articles";

  static async list(
    params?: { page?: number; limit?: number; search?: string },
  ) {
    return apiClient.get<{ data: Article[]; total: number }>(this.baseUrl, {
      params,
    });
  }

  static async getById(id: number) {
    return apiClient.get<Article>(`${this.baseUrl}/${id}`);
  }

  static async create(data: CreateArticleDTO) {
    return apiClient.post<Article>(this.baseUrl, data);
  }

  static async update(id: number, data: UpdateArticleDTO) {
    return apiClient.put<Article>(`${this.baseUrl}/${id}`, data);
  }

  static async delete(id: number) {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  static async bulkDelete(ids: number[]) {
    return apiClient.post(`${this.baseUrl}/bulk-delete`, { ids });
  }
}
```

---

## 🎨 Component Organization

### Entity-Specific Components

Live in `entities/<entity>/` folder:

- `ArticleList.tsx` - List/table view
- `ArticleForm.tsx` - Create/edit form
- `ArticleCard.tsx` - Single item display
- `ArticleFilters.tsx` - Filter UI

### Shared UI Components

Live in `components/ui/`:

- `Button.tsx`
- `Input.tsx`
- `Table.tsx`
- `Modal.tsx`
- `Pagination.tsx`

### Layout Components

Live in `components/layout/`:

- `AdminLayout.tsx` - Dashboard wrapper
- `Sidebar.tsx` - Navigation
- `Header.tsx` - Top bar
- `Footer.tsx`

---

## 🌊 Fresh Routes Pattern

### Admin CRUD Routes

```typescript
// routes/admin/articles/index.tsx - LIST
import { define } from "@/utils.ts";
import { ArticleService } from "@/entities/articles/article.service.ts";
import { ArticleList } from "@/entities/articles/ArticleList.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const articles = await ArticleService.list();
    return ctx.render({ articles });
  },
});

export default define.page<typeof handler>(({ data }) => {
  return (
    <AdminLayout>
      <ArticleList articles={data.articles} />
    </AdminLayout>
  );
});
```

```typescript
// routes/admin/articles/[id]/edit.tsx - EDIT
import { define } from "@/utils.ts";
import { ArticleService } from "@/entities/articles/article.service.ts";
import { ArticleForm } from "@/entities/articles/ArticleForm.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const id = parseInt(ctx.params.id);
    const article = await ArticleService.getById(id);
    return ctx.render({ article });
  },

  async POST(ctx) {
    const id = parseInt(ctx.params.id);
    const formData = await ctx.req.formData();
    const data = Object.fromEntries(formData);

    await ArticleService.update(id, data);
    return ctx.redirect("/admin/articles");
  },
});

export default define.page<typeof handler>(({ data }) => {
  return (
    <AdminLayout>
      <h1>Edit Article</h1>
      <ArticleForm article={data.article} mode="edit" />
    </AdminLayout>
  );
});
```

---

## 🎯 Benefits of This Approach

### ✅ Maintains tstack-kit Philosophy

- Entity-centric organization
- All article-related code in one place
- Clear separation of concerns
- Easy to find and modify

### ✅ Works with Fresh

- Uses Fresh's file-based routing
- Routes in `routes/` for URL mapping
- Logic in `entities/` for reusability
- Components in `islands/` for interactivity

### ✅ Scalability

- Easy to add new entities
- Copy-paste folder structure
- Consistent patterns
- Auto-generation ready

### ✅ Developer Experience

- Familiar to tstack-kit users
- Clear where to put new code
- Easy to navigate
- Consistent naming

---

## 🚀 Migration Strategy

### Phase 1: Manual Experimentation (Current)

Create `blog-v1-ui` project manually with:

- Login page
- Dashboard layout
- Articles CRUD pages
- Validate the convention works

### Phase 2: Package Creation

Create `packages/tstack-ui` in tstack-kit with:

- Fresh project templates
- Entity UI generators
- Component library
- Styling with DaisyUI

### Phase 3: CLI Integration

Update `tstack scaffold` command:

```bash
tstack scaffold articles --with-ui
```

Generates both backend API AND frontend UI

### Phase 4: Standalone UI Scaffold

```bash
tstack ui:scaffold articles
```

Only generates UI for existing backend entity

---

## 📚 Type Sharing Strategy

### Option A: Copy Types from Backend (Simple)

```bash
# Copy DTOs from backend to frontend
cp blog-v1/src/entities/articles/article.dto.ts \
   blog-v1-ui/entities/articles/article.types.ts
```

### Option B: Shared Package (Advanced)

```
packages/
├── shared-types/
│   └── entities/
│       ├── article.types.ts
│       └── site-setting.types.ts
```

Both projects import from shared package.

### Option C: Auto-Generate from OpenAPI (Future)

Generate TypeScript types from backend API schema.

---

## 🎨 DaisyUI Integration

DaisyUI classes in components:

```tsx
// components/ui/Button.tsx
export function Button({ children, variant = "primary" }) {
  return (
    <button class={`btn btn-${variant}`}>
      {children}
    </button>
  );
}

// Usage
<Button variant="primary">Save</Button>
<Button variant="ghost">Cancel</Button>
```

Admin layout with DaisyUI:

```tsx
// components/layout/AdminLayout.tsx
export function AdminLayout({ children }) {
  return (
    <div class="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content">
        <Header />
        <main class="p-6">{children}</main>
      </div>
      <div class="drawer-side">
        <Sidebar />
      </div>
    </div>
  );
}
```

---

## ✅ Validation: Is This Viable with Fresh?

### ✅ YES - Fully Compatible

**Fresh Supports:**

1. ✅ Custom folder structures (not just routes/)
2. ✅ Import from anywhere using `@/` alias
3. ✅ Multiple components per route
4. ✅ Shared logic across routes
5. ✅ Islands can live anywhere
6. ✅ No restrictions on file organization

**Fresh Does NOT Require:**

- ❌ All components in `/components`
- ❌ All islands in `/islands`
- ❌ Specific naming conventions
- ❌ Single component per file

**Conclusion:** Our entity-centric organization works perfectly with Fresh! 🎉

---

## 📋 Next Steps

1. ✅ Research Fresh framework ← DONE
2. ✅ Validate conventions compatibility ← DONE
3. ⏭️ Create `blog-v1-ui` project manually
4. ⏭️ Build login page
5. ⏭️ Build dashboard layout with DaisyUI
6. ⏭️ Build articles CRUD (following conventions)
7. ⏭️ Test full workflow
8. ⏭️ Document learnings
9. ⏭️ Create `tstack-ui` package
10. ⏭️ Integrate with CLI

---

## 🎯 Example: Complete Article Entity

### Backend (blog-v1)

```
src/entities/articles/
├── article.model.ts
├── article.dto.ts
├── article.service.ts
├── article.controller.ts
├── article.route.ts
├── article.admin.route.ts
├── article.test.ts
└── article.admin.test.ts
```

### Frontend (blog-v1-ui)

```
entities/articles/
├── article.service.ts       # API client
├── article.types.ts         # TypeScript types
├── ArticleList.tsx          # List component
├── ArticleForm.tsx          # Form component
├── ArticleCard.tsx          # Card component
└── article.utils.ts         # Utilities

routes/admin/articles/
├── index.tsx                # /admin/articles (list)
├── [id].tsx                 # /admin/articles/:id (view)
├── [id]/edit.tsx            # /admin/articles/:id/edit
└── new.tsx                  # /admin/articles/new

islands/
└── ArticleFormIsland.tsx    # Interactive form with validation
```

**Result:** Clear, organized, entity-centric full-stack structure! 🚀
