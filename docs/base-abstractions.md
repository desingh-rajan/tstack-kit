# Base Abstractions

TStack uses base classes to eliminate 70-80% of CRUD boilerplate.

## BaseService

Handles database operations with lifecycle hooks.

```typescript
import { BaseService } from "@tstack/admin";

export class ProductService extends BaseService<Product, CreateDTO, UpdateDTO> {
  constructor() {
    super(db, products);
  }
}
```

### Lifecycle Hooks

| Hook                     | When Called             |
| ------------------------ | ----------------------- |
| `beforeCreate(data)`     | Before inserting record |
| `afterCreate(record)`    | After record created    |
| `beforeUpdate(id, data)` | Before updating record  |
| `afterUpdate(record)`    | After record updated    |
| `beforeDelete(id)`       | Before deleting record  |
| `afterDelete(id)`        | After record deleted    |

### Example: Auto-generate Slug

```typescript
export class ArticleService extends BaseService<Article, CreateDTO, UpdateDTO> {
  protected override async beforeCreate(data: CreateDTO) {
    return {
      ...data,
      slug: slugify(data.title),
    };
  }

  protected override async beforeUpdate(id: number, data: UpdateDTO) {
    if (data.title) {
      data.slug = slugify(data.title);
    }
    return data;
  }
}
```

## BaseController

Handles HTTP requests with declarative authorization.

```typescript
import { BaseController } from "@tstack/admin";

export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(productService, "Product");
  }
}
```

### Authorization Options

```typescript
export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(productService, "Product", {
      create: { requireAuth: true },
      update: {
        requireAuth: true,
        ownershipCheck: (product, userId) => product.ownerId === userId,
      },
      delete: {
        requireAuth: true,
        roles: ["admin", "superadmin"],
      },
    });
  }
}
```

### Custom Endpoints

```typescript
export class ProductController extends BaseController<typeof productService> {
  async getByCategory(c: Context) {
    const category = c.req.param("category");
    const products = await this.service.findByCategory(category);
    return c.json({ data: products });
  }
}
```

## When to Extend vs Override

- **Extend** (add hooks): For pre/post processing logic
- **Override** (replace method): For completely custom behavior

```typescript
// Extend - add logic around base behavior
protected override async beforeCreate(data: CreateDTO) {
  return { ...data, createdBy: getCurrentUserId() };
}

// Override - replace base behavior entirely
override async findById(id: number) {
  // Custom query with joins
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { category: true, reviews: true },
  });
}
```

---

## Design Philosophy: Why Base Classes Work This Way

### The Rails Inspiration

Ruby on Rails popularized the pattern of inheriting from base classes:

```ruby
# Rails
class Product < ApplicationRecord
end

# TStack
class ProductService extends BaseService<Product, CreateDTO, UpdateDTO> {}
```

Rails proved that most CRUD operations follow identical patterns. Instead of
writing the same code in every model, inherit from a base that provides sensible
defaults.

**What TStack learned from Rails:**

1. Convention over configuration (predictable method names)
2. Lifecycle hooks instead of scattered callbacks
3. Extend the base, don't fight it
4. Make the common case trivial, the complex case possible

**Where TStack differs from Rails:**

1. Type safety through generics (Rails uses runtime reflection)
2. Explicit hooks instead of magical before_action names
3. Hooks receive typed data, not arbitrary params
4. No ActiveRecord magic - just Drizzle queries

### Why Lifecycle Hooks Over Middleware

Many frameworks use middleware for pre/post processing:

```typescript
// Middleware approach (not TStack)
app.use("/products", validateProduct);
app.use("/products", beforeProductCreate);
app.post("/products", createProduct);
app.use("/products", afterProductCreate);
```

TStack uses lifecycle hooks inside the service:

```typescript
// Hook approach (TStack)
class ProductService extends BaseService {
  protected override async beforeCreate(data: CreateDTO) {
    // Pre-processing here
  }

  protected override async afterCreate(record: Product) {
    // Post-processing here
  }
}
```

**Advantages of hooks:**

1. **Encapsulation** - Logic lives with the entity, not in route configuration
2. **Type safety** - Hooks receive typed data, not `unknown` from middleware
3. **Testability** - Test the service directly without HTTP layer
4. **Reusability** - Same hooks apply whether called from API, admin, or CLI
5. **Discoverability** - All entity logic is in one file

**When middleware is still appropriate:**

- Authentication (applies to many routes)
- Request logging (cross-cutting concern)
- Rate limiting (infrastructure concern)

Hooks are for entity-specific business logic. Middleware is for cross-cutting
concerns.

### The 70-80% Boilerplate Reduction Claim

This is not marketing. Here is actual measurement:

**Without BaseService (raw Drizzle):**

```typescript
export class ProductService {
  async create(data: CreateProductDTO): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async findById(id: number): Promise<Product | undefined> {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
    });
  }

  async findAll(options?: { limit?: number; offset?: number }) {
    return await db.query.products.findMany({
      limit: options?.limit ?? 20,
      offset: options?.offset ?? 0,
    });
  }

  async update(id: number, data: UpdateProductDTO): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async delete(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }
}
// ~40 lines for basic CRUD
```

**With BaseService:**

```typescript
export class ProductService extends BaseService<Product, CreateDTO, UpdateDTO> {
  constructor() {
    super(db, products);
  }
}
// 5 lines for the same functionality
```

That is 87.5% reduction for basic CRUD. Add soft delete, pagination, and
lifecycle hooks - the gap widens further.

### Why Three Generic Type Parameters

```typescript
BaseService<Product, CreateProductDTO, UpdateProductDTO>;
//         ^Entity  ^CreateInput        ^UpdateInput
```

**Why not just `BaseService<Product>`?**

Create and Update DTOs often differ:

```typescript
// CreateProductDTO - all required fields
{
  name: string;
  price: number;
  categoryId: number;
}

// UpdateProductDTO - all optional (partial update)
{
  name?: string;
  price?: number;
  categoryId?: number;
}

// Product - includes database-generated fields
{
  id: number;
  name: string;
  price: number;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Three generics give you type safety at every boundary:

- `beforeCreate` receives `CreateDTO`, returns `CreateDTO`
- `afterCreate` receives `Entity`
- `beforeUpdate` receives `UpdateDTO`, returns `UpdateDTO`
- CRUD methods accept and return correct types

### Authorization in BaseController

Authorization is declarative, not imperative:

```typescript
// Declarative (TStack)
super(productService, "Product", {
  delete: { requireAuth: true, roles: ["admin"] },
});

// Imperative (other frameworks)
async deleteProduct(c: Context) {
  const user = c.get("user");
  if (!user) throw new UnauthorizedError();
  if (!user.roles.includes("admin")) throw new ForbiddenError();
  // ... actual delete logic
}
```

**Why declarative:**

1. **Scannable** - See all authorization rules at a glance
2. **Consistent** - Same pattern across all entities
3. **Auditable** - Easy to review who can do what
4. **Testable** - Authorization logic is data, not code

**The ownership check pattern:**

```typescript
{
  update: {
    requireAuth: true,
    ownershipCheck: (product, userId) => product.ownerId === userId,
  },
}
```

This enables "users can edit their own products" without custom controller
logic. The base controller fetches the record, runs the check, and returns 403
if it fails.

### When NOT to Use Base Classes

Base classes excel at standard CRUD. They struggle with:

**Complex aggregations:**

```typescript
// Don't: Try to fit this into BaseService
async getDashboardStats() {
  const revenue = await db.select({ sum: sql`sum(total)` }).from(orders);
  const users = await db.select({ count: sql`count(*)` }).from(users);
  return { revenue, users };
}

// Do: Custom service method or separate service
export class DashboardService {
  async getStats() {
    // Complex query logic here
  }
}
```

**Multi-table operations:**

```typescript
// Don't: Override base methods for complex workflows
async create(orderData: CreateOrderDTO) {
  // Create order, update inventory, charge payment, send email
}

// Do: Custom service with explicit workflow
export class OrderWorkflowService {
  async placeOrder(orderData: CreateOrderDTO) {
    return await db.transaction(async (tx) => {
      const order = await this.orderService.create(orderData);
      await this.inventoryService.deduct(order.items);
      await this.paymentService.charge(order.total);
      await this.emailService.sendConfirmation(order);
      return order;
    });
  }
}
```

**Search and filtering:**

```typescript
// BaseService provides simple findAll with offset/limit
// For complex search, add custom methods
async searchProducts(query: ProductSearchQuery) {
  return await db.query.products.findMany({
    where: and(
      query.name ? ilike(products.name, `%${query.name}%`) : undefined,
      query.minPrice ? gte(products.price, query.minPrice) : undefined,
      query.category ? eq(products.categoryId, query.category) : undefined,
    ),
    orderBy: [desc(products.createdAt)],
    limit: query.limit ?? 20,
  });
}
```

### The Escape Hatch Philosophy

BaseService and BaseController provide escape hatches at every level:

1. **Lifecycle hooks** - Inject logic without overriding methods
2. **Method override** - Replace single method, keep others
3. **Custom methods** - Add new methods alongside base methods
4. **No inheritance** - Write a plain class if base does not fit

The base classes are there to help, not constrain. If fighting the abstraction,
step outside it.

### Why Published as @tstack/admin

Base classes live in `packages/admin` and publish to JSR as `@tstack/admin`.
This is separate from the CLI (`@tonystack/cli`) because:

1. **Runtime dependency** - Your project imports @tstack/admin. It does not
   import the CLI.

2. **Independent versioning** - Admin package evolves with features. CLI evolves
   with scaffolding changes. Different release cycles.

3. **Size optimization** - Your deployed API includes only @tstack/admin, not
   CLI code.

4. **Clear boundaries** - CLI creates projects. Admin package runs in projects.
