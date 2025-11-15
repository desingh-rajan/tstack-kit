# @tstack/admin - Integration Roadmap

**Created:** November 13, 2025  
**Status:** Phase 1 Complete [SUCCESS]

---

## Current Status

### [SUCCESS] Phase 1: Standalone Package (COMPLETE)

**What Works Now:**

- @tstack/admin is a fully functional standalone package
- Works with ANY Deno/Hono + Drizzle project
- 73/73 tests passing
- Production-ready
- Complete documentation

**How to Use in Existing Projects:**

1. Add `@tstack/admin` to `deno.json`
2. Create admin route files manually
3. Register routes in main app
4. Works immediately!

See [README.md - Using in Existing Projects](./README.md#using-in-existing-projects-without-tstack-kit)

---

## Future Phases

### 🚧 Phase 2: TStack CLI Integration (PLANNED)

**Goal:** Auto-generate admin routes when scaffolding

**CLI Enhancement:**

```bash
# Current (manual admin setup)
tstack scaffold products
# Then manually create product.admin.route.ts

# Future (automatic admin generation)
tstack scaffold products --with-admin
# Generates: product.model.ts, product.dto.ts, product.service.ts, 
#            product.controller.ts, product.route.ts, 
#            product.admin.route.ts ← NEW!

# Or add admin to existing entity
tstack admin products
# Generates: product.admin.route.ts for existing entity
```

**What Needs to Be Done:**

1. **Update CLI Templates**
   - Location: `packages/cli/src/templates/`
   - Add: `admin-route.ts` template
   - Template should generate:

     ```typescript
     // product.admin.route.ts (generated)
     import { Hono } from "hono";
     import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";
     import { db } from "../../config/database.ts";
     import { products } from "./product.model.ts";
     import { requireAdmin } from "../../shared/middleware/requireRole.ts";
     
     const productAdminRoutes = new Hono();
     productAdminRoutes.use("*", requireAdmin);
     
     const admin = new HonoAdminAdapter({
       ormAdapter: new DrizzleAdapter(products, { db }),
       entityName: "product",
       entityNamePlural: "products",
       columns: ["id", "name", "price", "createdAt"],
       searchable: ["name", "description"],
       sortable: ["id", "name", "price", "createdAt"],
       allowedRoles: ["superadmin", "admin"],
       baseUrl: "/admin/products",
     });
     
     // All CRUD routes
     productAdminRoutes.get("/", admin.list());
     productAdminRoutes.get("/new", admin.new());
     productAdminRoutes.post("/", admin.create());
     productAdminRoutes.get("/:id", admin.show());
     productAdminRoutes.get("/:id/edit", admin.edit());
     productAdminRoutes.put("/:id", admin.update());
     productAdminRoutes.patch("/:id", admin.update());
     productAdminRoutes.delete("/:id", admin.destroy());
     productAdminRoutes.post("/bulk-delete", admin.bulkDelete());
     
     export { productAdminRoutes };
     ```

2. **Update Scaffold Command**
   - Location: `packages/cli/src/commands/scaffold.ts`
   - Add: `--with-admin` flag
   - Generate admin route file when flag is present
   - Auto-register in main.ts (or document manual registration)

3. **Create Admin Command**
   - Location: `packages/cli/src/commands/admin.ts` (new file)
   - Command: `tstack admin <entity>`
   - Generates admin route for existing entity
   - Checks if entity exists before generating

4. **Update Starter Kit**
   - Location: `packages/starter/deno.json`
   - Add: `"@tstack/admin": "jsr:@tstack/admin@^1.0.0"` to imports
   - Update: `packages/starter/README.md` with admin examples

5. **Update CLI Documentation**
   - Location: `packages/cli/README.md`
   - Add: Admin generation examples
   - Document: `--with-admin` flag
   - Document: `tstack admin <entity>` command

**Files to Modify:**

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── scaffold.ts          ← Add --with-admin flag
│   │   └── admin.ts              ← NEW: Add admin command
│   └── templates/
│       └── admin-route.ts        ← NEW: Admin route template
└── README.md                     ← Document new features

packages/starter/
├── deno.json                     ← Add @tstack/admin import
└── README.md                     ← Add admin examples
```

**Estimated Time:** 4-6 hours

---

### 🚧 Phase 3: Starter Kit Built-in Admin (FUTURE)

**Goal:** Admin panel accessible out-of-the-box in new projects

**What This Means:**

- New TStack projects have `/admin` route ready
- Admin dashboard shows all scaffolded entities
- Click entity name → see admin panel
- Zero configuration needed

**Implementation:**

1. Create admin dashboard home page (`/admin`)
2. Auto-discover all entities with admin routes
3. Generate navigation menu dynamically
4. Ship with starter template

**Example User Experience:**

```bash
# Create new project
tstack create my-app

# Scaffold entities
tstack scaffold products --with-admin
tstack scaffold categories --with-admin

# Start server
cd my-app && deno task dev

# Visit http://localhost:8000/admin
# See dashboard with:
# - Products (link to /admin/products)
# - Categories (link to /admin/categories)
# Auto-discovered from routes!
```

**Estimated Time:** 8-10 hours

---

### 🚧 Phase 4: Express & Sequelize Support (FUTURE)

**Goal:** Support Node.js/Express projects with Sequelize

**What Needs to Be Done:**

1. **Create Express Adapter**
   - Location: `packages/admin/src/framework/express.ts`
   - Implement: All 8 CRUD methods for Express
   - Write: 25+ tests (same as Hono)
   - Pattern: Follow HonoAdapter exactly

2. **Create Sequelize Adapter**
   - Location: `packages/admin/src/orm/sequelize.ts`
   - Implement: IORMAdapter interface
   - Write: 26+ tests (same as Drizzle)
   - Pattern: Follow DrizzleAdapter exactly

3. **Update CLI for Node.js**
   - Add: `--runtime=node` flag to scaffold
   - Generate: Express routes instead of Hono
   - Generate: Sequelize models instead of Drizzle

See [COMPREHENSIVE_GUIDE.md - Section 8: Future Extensions](./COMPREHENSIVE_GUIDE.md#8-future-extensions--standards) for implementation details.

**Estimated Time:** 20-30 hours

---

## Priority Order

1. **Phase 2** (Next) - CLI Integration
   - Most valuable for TStack Kit users
   - Reduces manual work
   - Can be done in a few hours

2. **Phase 3** (Later) - Built-in Admin Dashboard
   - Nice-to-have improvement
   - Enhances user experience
   - Not blocking functionality

3. **Phase 4** (Future) - Express/Sequelize
   - Expands user base
   - More complex implementation
   - Requires careful testing

---

## Notes for Implementation

### Phase 2 Checklist

- [ ] Create `packages/cli/src/templates/admin-route.ts`
- [ ] Update `packages/cli/src/commands/scaffold.ts` with `--with-admin` flag
- [ ] Create `packages/cli/src/commands/admin.ts` command
- [ ] Add `@tstack/admin` to `packages/starter/deno.json`
- [ ] Update `packages/cli/README.md` with admin docs
- [ ] Update `packages/starter/README.md` with admin examples
- [ ] Test: `tstack scaffold products --with-admin`
- [ ] Test: `tstack admin existing-entity`
- [ ] Write tests for new CLI commands

### Questions to Answer

1. **Auto-register routes?**
   - Should CLI auto-add `app.route()` to main.ts?
   - Or just document manual registration?
   - Recommendation: Document first, auto-register later

2. **Default columns for admin?**
   - Use all model columns? Or only basic ones?
   - Recommendation: Use all columns, let user customize

3. **Admin route protection?**
   - Always require `requireAdmin`?
   - Make it configurable?
   - Recommendation: Always require, document how to change

---

## Summary

**Current State (Phase 1):**

- [SUCCESS] @tstack/admin package complete
- [SUCCESS] Works standalone in any project
- [SUCCESS] 73/73 tests passing
- [SUCCESS] Production-ready
- [SUCCESS] Complete documentation

**Next Step (Phase 2):**

- 🚧 CLI integration for auto-generation
- 🚧 `tstack scaffold --with-admin` command
- 🚧 `tstack admin <entity>` command
- 🚧 Starter kit ready out-of-the-box

**After PR Review:**

1. Merge Phase 1 (current work)
2. Plan Phase 2 implementation
3. Start CLI integration
4. Test with real projects

---

**Last Updated:** November 13, 2025  
**Package Version:** 1.0.0  
**Next Version:** 1.1.0 (with CLI integration)
