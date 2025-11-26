# TStack Fresh UI Scaffolding Guide

**Version**: 1.0\
**Date**: November 20, 2025\
**Status**: ✅ Production Ready

---

## 🎯 Purpose

Reference guide for `tstack scaffold` command to generate Rails
ActiveAdmin-style CRUD interfaces for Fresh UI.

---

## ✅ Scaffolding Ready Infrastructure

### 1. Import Path Alias (@/)

All imports must use `@/` prefix. This is configured in `deno.json`.

```typescript
// ✅ CORRECT - Always use this
import { define } from "@/utils.ts";
import { createApiClient } from "@/lib/api.ts";

// ❌ WRONG - Never use relative paths
import { define } from "../../../../utils.ts";
```

**Why**: Scaffold templates are path-independent and work in any directory.

---

### 2. Environment Variable Support

API base URL is configurable via `API_BASE_URL` environment variable.

```bash
# Development
API_BASE_URL=http://localhost:8000

# Production  
API_BASE_URL=https://api.yourapp.com
```

Already configured in `lib/api.ts`. No changes needed.

---

### 3. Authentication Error Handling (401 vs 403)

- **401 Unauthorized** = No valid token → Redirect to `/auth/login`
- **403 Forbidden** = Valid token but insufficient permissions → Show "Access
  Denied" component

Handled automatically by `createCRUDHandlers()`. No auth code needed in routes.

---

### 4. Generic Components Ready

**Pre-built reusable components** in `components/admin/`:

- `GenericForm.tsx` - Auto-generates forms from entity config
- `DataTable.tsx` - Renders lists with pagination
- `Pagination.tsx` - Pagination controls
- `ShowPage.tsx` - Detail view display
- `AdminLayout.tsx` - Admin wrapper with nav
- `AccessDenied.tsx` - 403 error page

**Example Usage**:

```typescript
import { GenericForm } from "@/components/admin/GenericForm.tsx";
import { articleConfig } from "@/config/entities/articles.config.tsx";

// Auto-generates form from config
<GenericForm config={articleConfig} item={article} isEdit={true} />;
```

---

### 5. CRUD Handlers Factory

`createCRUDHandlers()` generates all route handlers automatically.

```typescript
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";

const handlers = createCRUDHandlers(articleConfig);

// Provides:
// - handlers.list()
// - handlers.show()
// - handlers.createGet()
// - handlers.createPost()
// - handlers.editGet()
// - handlers.editPost()
// - handlers.delete()
```

---

## 📋 Scaffolding Template Variables

Map backend model fields to frontend config fields:

```typescript
Variable           Example
─────────────────────────────────
{entity}           order
{Entity}           Order
{entities}         orders
{Entities}         Orders
{entityPath}       /admin/orders
{apiPath}          /ts-admin/orders
{idField}          id
{displayField}     name
```

---

## 🔄 Field Type Mapping

Auto-detect from Drizzle schema and generate correct form field type:

| Backend Type                    | Frontend Field Type | Config Example                   |
| ------------------------------- | ------------------- | -------------------------------- |
| `text('...')` (< 255 chars)     | `"string"`          | `type: "string"`                 |
| `text('...')` (> 255 chars)     | `"text"`            | `type: "text", rows: 8`          |
| `integer(...)`                  | `"number"`          | `type: "number"`                 |
| `boolean(...)`                  | `"boolean"`         | `type: "boolean"`                |
| `timestamp(...)`                | `"datetime"`        | `type: "datetime"`               |
| `varchar(..., { enum: [...] })` | `"select"`          | `type: "select", options: [...]` |
| `jsonb(...)`                    | `"json"`            | `type: "json", rows: 8`          |

---

## 📁 Generated File Structure

```
blog-v1-ui/
├── config/entities/
│   └── {entities}.config.tsx       ← Entity configuration
├── entities/{entities}/
│   ├── {entity}.types.ts           ← TypeScript interfaces
│   └── {entity}.service.ts         ← API service client
└── routes/admin/{entities}/
    ├── index.tsx                   ← List page
    ├── new.tsx                     ← Create page
    ├── [{id}].tsx                  ← Detail/show page
    └── [{id}]/edit.tsx             ← Edit page
```

---

## 🔧 Entity Configuration Format

Template for `config/entities/{entities}.config.tsx`:

```typescript
import type { EntityConfig } from "@/lib/admin/types.ts";
import type { {Entity} } from "@/entities/{entities}/{entity}.types.ts";
import { {entity}Service } from "@/entities/{entities}/{entity}.service.ts";

export const {entity}Config: EntityConfig<{Entity}> = {
  name: "{entities}",
  singularName: "{Entity}",
  pluralName: "{Entities}",
  apiPath: "{apiPath}",
  idField: "{idField}",
  displayField: "{displayField}",
  service: {entity}Service,
  
  fields: [
    {
      name: "id",
      label: "ID",
      type: "number",
      showInList: true,
      showInShow: true,
      showInForm: false,
      sortable: true,
    },
    // ... field config for each model field ...
  ],
  
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canView: true,
};
```

---

## 🛣️ Route Template Structure

### List Page: `routes/admin/{entities}/index.tsx`

```typescript
import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { DataTable } from "@/components/admin/DataTable.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { {entity}Config } from "@/config/entities/{entities}.config.tsx";

const handlers = createCRUDHandlers({entity}Config);

export const handler = define.handlers({
  GET: handlers.list,
});

export default define.page<typeof handler>(function ListPage({ data }) {
  const { items, config, error } = data;
  
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      {/* Header with Create button */}
      {/* DataTable with items */}
    </AdminLayout>
  );
});
```

### Create Page: `routes/admin/{entities}/new.tsx`

```typescript
import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { GenericForm } from "@/components/admin/GenericForm.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { {entity}Config } from "@/config/entities/{entities}.config.tsx";

const handlers = createCRUDHandlers({entity}Config);

export const handler = define.handlers({
  GET: handlers.createGet,
  POST: handlers.createPost,
});

export default define.page<typeof handler>(function NewPage({ data }) {
  const { config, error, values } = data;
  
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      {/* Page header */}
      {/* GenericForm */}
    </AdminLayout>
  );
});
```

### Detail Page: `routes/admin/{entities}/[{id}].tsx`

```typescript
import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { {entity}Config } from "@/config/entities/{entities}.config.tsx";

const handlers = createCRUDHandlers({entity}Config);

export const handler = define.handlers({
  GET: handlers.show,
});

export default define.page<typeof handler>(function ShowPage({ data }) {
  const { item, config, error } = data;
  
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      {/* Item details display */}
    </AdminLayout>
  );
});
```

### Edit Page: `routes/admin/{entities}/[{id}]/edit.tsx`

```typescript
import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { GenericForm } from "@/components/admin/GenericForm.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { {entity}Config } from "@/config/entities/{entities}.config.tsx";

const handlers = createCRUDHandlers({entity}Config);

export const handler = define.handlers({
  GET: handlers.editGet,
  POST: handlers.editPost,
});

export default define.page<typeof handler>(function EditPage({ data }) {
  const { item, config, error } = data;
  
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      {/* GenericForm with item data */}
    </AdminLayout>
  );
});
```

---

## 📦 Entity Service Template

Template for `entities/{entities}/{entity}.service.ts`:

```typescript
import type { {Entity} } from "@/entities/{entities}/{entity}.types.ts";
import type { CreateCRUDService } from "@/lib/admin/types.ts";
import type { ApiClient } from "@/lib/api.ts";

export const {entity}Service: CreateCRUDService<{Entity}> = {
  client: null as ApiClient | null,
  
  setClient(client: ApiClient) {
    this.client = client;
  },
  
  async list(params: { page: number; pageSize: number }) {
    const res = await this.client!.get(
      `{apiPath}?page=${params.page}&pageSize=${params.pageSize}`
    );
    return res.data || [];
  },
  
  async getById(id: number) {
    const res = await this.client!.get(`{apiPath}/${id}`);
    return res.data;
  },
  
  async create(data: Partial<{Entity}>) {
    const res = await this.client!.post(`{apiPath}`, data);
    return res.data;
  },
  
  async update(id: number, data: Partial<{Entity}>) {
    const res = await this.client!.put(`{apiPath}/${id}`, data);
    return res.data;
  },
  
  async delete(id: number) {
    await this.client!.delete(`{apiPath}/${id}`);
  },
};
```

---

## ✅ Schema Synchronization Rule

**CRITICAL**: Frontend types MUST match backend schema exactly.

**Before scaffolding**:

1. Check backend model in Drizzle schema
2. Verify all field names match exactly (camelCase)
3. Verify field types are correct
4. Generate frontend types with identical field structure
5. Update config with correct field names

**Example - Articles**:

```typescript
// Backend (blog-v1/src/entities/articles/article.model.ts)
isPublished: boolean("is_published")  // ✅ Field name in backend

// Frontend must use
isPublished: boolean;  // ✅ Match exactly (camelCase)

// Config must reference
{ name: "isPublished", label: "Status", type: "boolean" }  // ✅ Same name
```

---

## 🧪 Post-Scaffold Testing Checklist

After generating new entity, verify:

- [ ] All imports use `@/` alias
- [ ] Config fields match backend schema exactly
- [ ] 401 errors redirect to login (not error pages)
- [ ] 403 errors show AccessDenied component
- [ ] Create form submits correctly
- [ ] Edit form loads and saves data
- [ ] Delete works and confirms deletion
- [ ] List page shows data with pagination
- [ ] Detail page displays all fields correctly
- [ ] Form validation works (required fields, data types)
- [ ] JSON fields parse and display correctly
- [ ] DateTime fields format properly
- [ ] Select/enum fields show correct options

---

## 🔗 Reference Files

Core implementation files to reference:

- `lib/admin/types.ts` - EntityConfig TypeScript interface
- `lib/admin/crud-handlers.ts` - CRUD handler factory implementation
- `components/admin/GenericForm.tsx` - Dynamic form component
- `config/entities/articles.config.tsx` - Example entity config
- `routes/admin/articles/*.tsx` - Reference route implementations
- `lib/api.ts` - API client factory

---

## 📝 Notes

- **Field names**: Always use camelCase (backend uses snake_case in DB, but code
  uses camelCase)
- **API responses**: Always return snake_case from backend, frontend
  automatically handles conversion
- **Required fields**: Mark as `required: true` in config, backend validates
  with Zod
- **Type mapping**: Frontend form types (string, text, number, etc.) must match
  backend field types
- **Auth**: All routes protected automatically by CRUD handlers - no manual
  checks needed
