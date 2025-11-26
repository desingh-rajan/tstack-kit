# Migrations

This folder will contain your database migrations.

## First Time Setup

After creating your project, follow these steps:

### 1. Customize Your Models (Optional)

Before generating migrations, you can customize the auth models:

```typescript
// src/auth/user.model.ts
export const users = pgTable("users", {
  ...commonColumns,
  username: text("username"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(),

  // Add your custom fields here!
  // firstName: text("first_name"),
  // lastName: text("last_name"),
  // avatar: text("avatar"),

  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
});
```

### 2. Generate Initial Migration

```bash
deno task migrate:generate
```

This will create migration files based on all your `*.model.ts` files:

- `src/auth/user.model.ts`
- `src/auth/auth-token.model.ts`
- `src/entities/articles/article.model.ts` (reference example)

### 3. Run Migrations

```bash
# Development database
deno task migrate:run

# Test database
ENVIRONMENT=test deno task migrate:run
```

### 4. Seed Database

```bash
# Seed both superadmin and alpha test user
deno task db:seed

# Or seed individually
deno task db:seed:superadmin
deno task db:seed:alpha
```

## Adding New Entities

After scaffolding a new entity:

```bash
tstack scaffold products
```

The model will be created at `src/entities/products/product.model.ts`.

Then:

```bash
# Generate migration for the new entity
deno task migrate:generate

# Run the migration
deno task migrate:run
```

## Important Notes

- **Never edit migration files manually** - Always use
  `deno task migrate:generate`
- **Migrations are source of truth** - Keep them in version control
- **Test database separate** - Use `ENVIRONMENT=test` for test migrations

See the project documentation for detailed migration information workflows.
