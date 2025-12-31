# Role-Based Access Control (RBAC)

TonyStack includes a built-in role-based access control system to manage user
permissions.

## Available Roles

### 1. **superadmin** (System-Defined)

- **Created**: Only via seed script (cannot be created via API)
- **Count**: Exactly one per system
- **Privileges**: Full system access, can create/manage all users
- **Protected**: Cannot be deleted or have role changed
- **Email**: `superadmin@tstack.in` (default)

### 2. **admin**

- **Created**: By superadmin only
- **Privileges**: Administrative access (can be customized per feature)
- **Use Case**: Department heads, team leads

### 3. **moderator**

- **Created**: By superadmin only
- **Privileges**: Content moderation, user management (can be customized)
- **Use Case**: Community moderators, content reviewers

### 4. **user** (Default)

- **Created**: Via public registration or by admins
- **Privileges**: Standard user access
- **Use Case**: Regular application users

## Usage

### Protect Routes by Role

```typescript
import { requireAuth } from "../shared/middleware/requireAuth.ts";
import {
  requireAdmin,
  requireModerator,
  requireSuperadmin,
} from "../shared/middleware/requireRole.ts";

// Superadmin only
app.post(
  "/admin/users",
  requireAuth,
  requireSuperadmin,
  AdminController.createAdmin,
);

// Admin and above (superadmin + admin)
app.get("/admin/reports", requireAuth, requireAdmin, ReportController.getAll);

// Moderator and above (superadmin + admin + moderator)
app.delete("/posts/:id", requireAuth, requireModerator, PostController.delete);

// Any authenticated user
app.get("/profile", requireAuth, ProfileController.get);
```

### Custom Role Checks

```typescript
import { requireRole } from "../shared/middleware/requireRole.ts";

// Specific roles only
app.post("/special", requireAuth, requireRole(["admin", "moderator"]), handler);
```

### Check Role in Controller

```typescript
export class ArticleController {
  static async update(c: Context) {
    const user = c.get("user");

    // Check if superadmin
    const isSuperadmin = user.role === "superadmin";

    // Check if author
    const isAuthor = article.authorId === user.id;

    if (!isAuthor && !isSuperadmin) {
      throw new ForbiddenError("You don't have permission");
    }
  }
}
```

## Creating Users

### Regular User (Public Registration)

```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "John Doe"
}
# Automatically assigned role: "user"
```

### Admin/Moderator (Superadmin Only)

```bash
POST /api/admin/users
Authorization: Bearer <superadmin-token>
{
  "email": "admin@example.com",
  "password": "AdminPass123!",
  "username": "Admin User",
  "role": "admin"  # or "moderator"
}
```

### Superadmin (Seed Script Only)

```bash
# Run once during setup
deno task db:seed:superadmin

# Creates:
# Email: superadmin@tstack.in
# Password: set via SUPERADMIN_PASSWORD environment variable
# Role: superadmin (system-defined, protected)
```

## Security Rules

1. **Superadmin Protection**
   - Cannot be deleted via API
   - Cannot have role changed
   - Only one can exist in the system
   - Created only via seed script

2. **Role Assignment**
   - Regular users always get "user" role on signup
   - Only superadmin can create admin/moderator users
   - Users cannot change their own roles
   - Roles are immutable via user-facing APIs

3. **Authorization Pattern**

   ```text
   superadmin > admin > moderator > user
   ```

   Higher roles inherit lower role permissions (when using convenience
   middlewares)

## Database Schema

```typescript
// user.model.ts
export const users = pgTable("users", {
  ...commonColumns,
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(), // superadmin | admin | moderator | user
  // ... other fields
});
```

## Testing

Two test users are created for development:

````typescript
Two test users are created for development:

```text
// Superadmin
Email: superadmin@tstack.in
Password: set via SUPERADMIN_PASSWORD environment variable
Role: superadmin

// Regular User
Email: alpha@tstack.in
Password: set via ALPHA_PASSWORD environment variable
Role: user
````

## Best Practices

1. **Always Use Middleware**

   ```typescript
   // [SUCCESS] Good
   app.post("/admin/users", requireAuth, requireSuperadmin, handler);

   // [ERROR] Bad - checking in controller
   app.post("/admin/users", requireAuth, async (c) => {
     if (c.get("user").role !== "superadmin") throw new Error("...");
   });
   ```

2. **Layer Security Checks**

   ```typescript
   // Middleware checks authentication + role
   app.put("/articles/:id", requireAuth, ArticleController.update);

   // Controller checks resource ownership
   static async update(c: Context) {
     const user = c.get("user");
     const article = await ArticleService.getById(id);
     
     // Users can update their own, superadmin can update any
     if (article.authorId !== user.id && user.role !== "superadmin") {
       throw new ForbiddenError("Not authorized");
     }
   }
   ```

3. **Change Superadmin Credentials in Production**

   ```bash
   # In production, immediately:
   1. Change superadmin password
   2. Update email to your real admin email
   3. Store credentials securely (password manager, vault)
   ```

4. **Audit Role Changes**
   - Log when admins/moderators are created
   - Track who created which admin users
   - Monitor superadmin actions

## Extending Roles

To add new roles (e.g., "editor", "viewer"):

1. Update type definition:

   ```typescript
   // user.model.ts
   export type UserRole =
     | "superadmin"
     | "admin"
     | "moderator"
     | "editor"
     | "user";
   ```

2. Update DTO validation:

   ```typescript
   // admin.dto.ts
   role: z.enum(["admin", "moderator", "editor"]).optional();
   ```

3. Create middleware:

   ```typescript
   // requireRole.ts
   export const requireEditor = requireRole(["superadmin", "admin", "editor"]);
   ```

4. Generate and run migration to update existing rows if needed

## Common Patterns

### Mixed Authentication (Public + Protected)

```typescript
// GET public, POST/PUT/DELETE protected
articleRoutes.get("/articles", ArticleController.getAll);
articleRoutes.get("/articles/:id", ArticleController.getById);
articleRoutes.post("/articles", requireAuth, ArticleController.create);
articleRoutes.put("/articles/:id", requireAuth, ArticleController.update);
articleRoutes.delete("/articles/:id", requireAuth, ArticleController.delete);
```

### Resource Ownership + Admin Override

```typescript
const isSuperadmin = user.role === "superadmin";
const isOwner = resource.userId === user.id;

if (!isOwner && !isSuperadmin) {
  throw new ForbiddenError("Not authorized");
}
```

### Multi-Role Access

```typescript
// Multiple roles can access
app.get(
  "/dashboard",
  requireAuth,
  requireRole(["admin", "moderator"]),
  handler,
);
```
