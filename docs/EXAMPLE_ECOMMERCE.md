# 🛒 Example: Building an E-commerce Backend

A practical, step-by-step example of building a complete e-commerce backend
using TonyStack.

---

## Requirements

**Client:** Online Store **Timeline:** 7 days **Features:** Products,
Categories, Shopping Cart, Orders, Reviews

---

## Day 1: Setup & Planning

### 1. Clone and Setup

```bash
cp -r packages/starter ~/projects/online-store-api
cd ~/projects/online-store-api
git init
```

### 2. Design Data Model

```
Users (pre-built) 
├── Products
│ ├── belongs to Category
│ └── has many Reviews
├── Categories
│ └── has many Products
├── Cart Items
│ ├── belongs to User
│ └── belongs to Product
├── Orders
│ ├── belongs to User
│ └── has many Order Items
├── Order Items
│ ├── belongs to Order
│ └── belongs to Product
└── Reviews
 ├── belongs to User
 └── belongs to Product
```

---

## Day 2: Generate Entities

```bash
# Generate all entities
tstack scaffold products
tstack scaffold categories
tstack scaffold cart-items
tstack scaffold orders
tstack scaffold order-items
tstack scaffold reviews

# Register routes in src/main.ts
```

**Add to `src/main.ts`:**

```typescript
import productRoutes from "./entities/products/product.route.ts";
import categoryRoutes from "./entities/categories/category.route.ts";
import cartItemRoutes from "./entities/cartItems/cartItem.route.ts";
import orderRoutes from "./entities/orders/order.route.ts";
import orderItemRoutes from "./entities/orderItems/orderItem.route.ts";
import reviewRoutes from "./entities/reviews/review.route.ts";

app.route("/api", productRoutes);
app.route("/api", categoryRoutes);
app.route("/api", cartItemRoutes);
app.route("/api", orderRoutes);
app.route("/api", orderItemRoutes);
app.route("/api", reviewRoutes);
```

---

## Day 3: Customize Models

### products/product.model.ts

```typescript
export const products = sqliteTable("products", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  price: int().notNull(), // Store in cents: $29.99 = 2999
  compareAtPrice: int(), // Original price for discounts
  stock: int().default(0).notNull(),
  categoryId: int().references(() => categories.id),
  imageUrl: text(),
  images: text(), // JSON array of image URLs
  sku: text().unique(),
  slug: text().unique().notNull(),
  rating: int().default(0), // Average rating * 100
  reviewCount: int().default(0),
  isActive: int({ mode: "boolean" }).default(true).notNull(),
  isFeatured: int({ mode: "boolean" }).default(false),
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

### categories/category.model.ts

```typescript
export const categories = sqliteTable("categories", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  slug: text().unique().notNull(),
  imageUrl: text(),
  parentId: int().references((): any => categories.id), // For subcategories
  sortOrder: int().default(0),
  isActive: int({ mode: "boolean" }).default(true).notNull(),
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

### cartItems/cartItem.model.ts

```typescript
export const cartItems = sqliteTable("cart_items", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => users.id),
  productId: int().notNull().references(() => products.id),
  quantity: int().notNull().default(1),
  price: int().notNull(), // Price at time of adding to cart
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

### orders/order.model.ts

```typescript
export const orders = sqliteTable("orders", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => users.id),
  orderNumber: text().unique().notNull(), // e.g., "ORD-2024-0001"
  subtotal: int().notNull(),
  tax: int().default(0),
  shipping: int().default(0),
  total: int().notNull(),
  status: text().notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  paymentStatus: text().default("unpaid"), // unpaid, paid, refunded
  paymentMethod: text(), // credit_card, paypal, etc.

  // Shipping info
  shippingName: text().notNull(),
  shippingAddress: text().notNull(),
  shippingCity: text().notNull(),
  shippingState: text(),
  shippingZip: text().notNull(),
  shippingCountry: text().notNull(),
  shippingPhone: text(),

  // Tracking
  trackingNumber: text(),
  notes: text(),

  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

### orderItems/orderItem.model.ts

```typescript
export const orderItems = sqliteTable("order_items", {
  id: int().primaryKey({ autoIncrement: true }),
  orderId: int().notNull().references(() => orders.id),
  productId: int().notNull().references(() => products.id),
  productName: text().notNull(), // Snapshot of product name at purchase time
  quantity: int().notNull(),
  price: int().notNull(), // Price per unit at purchase time
  total: int().notNull(), // quantity * price
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

### reviews/review.model.ts

```typescript
export const reviews = sqliteTable("reviews", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => users.id),
  productId: int().notNull().references(() => products.id),
  rating: int().notNull(), // 1-5
  title: text(),
  comment: text(),
  isVerifiedPurchase: int({ mode: "boolean" }).default(false),
  isActive: int({ mode: "boolean" }).default(true).notNull(),
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

---

## Day 4: Add Business Logic

### products/product.service.ts

Add custom methods:

```typescript
export class ProductService {
  // ... existing CRUD methods ...

  static async getByCategory(categoryId: number) {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
      ))
      .orderBy(desc(products.createdAt));
  }

  static async getFeatured(limit = 10) {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.isFeatured, true),
        eq(products.isActive, true),
      ))
      .limit(limit);
  }

  static async search(query: string) {
    return await db
      .select()
      .from(products)
      .where(
        and(
          or(
            like(products.name, `%${query}%`),
            like(products.description, `%${query}%`),
          ),
          eq(products.isActive, true),
        ),
      );
  }

  static async updateStock(productId: number, quantity: number) {
    const product = await this.getById(productId);
    if (!product) throw new NotFoundError("Product not found");

    if (product.stock + quantity < 0) {
      throw new Error("Insufficient stock");
    }

    return await db
      .update(products)
      .set({
        stock: product.stock + quantity,
        updatedAt: Date.now(),
      })
      .where(eq(products.id, productId))
      .returning();
  }
}
```

### orders/order.service.ts

Add order creation logic:

```typescript
export class OrderService {
  // ... existing CRUD methods ...

  static async createFromCart(userId: number, shippingInfo: any) {
    // Get cart items
    const cartItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += item.price * item.quantity;
    }

    const tax = Math.floor(subtotal * 0.08); // 8% tax
    const shipping = 999; // $9.99 flat rate
    const total = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const order = await db
      .insert(orders)
      .values({
        userId,
        orderNumber,
        subtotal,
        tax,
        shipping,
        total,
        ...shippingInfo,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      .returning();

    // Create order items
    for (const cartItem of cartItems) {
      const product = await ProductService.getById(cartItem.productId);

      await db.insert(orderItems).values({
        orderId: order[0].id,
        productId: cartItem.productId,
        productName: product.name,
        quantity: cartItem.quantity,
        price: cartItem.price,
        total: cartItem.price * cartItem.quantity,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Decrease product stock
      await ProductService.updateStock(cartItem.productId, -cartItem.quantity);
    }

    // Clear cart
    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    return order[0];
  }
}
```

---

## Day 5: Add Controllers & Routes

### products/product.controller.ts

Add custom endpoints:

```typescript
export class ProductController {
  // ... existing CRUD methods ...

  static async getByCategory(c: Context) {
    const categoryId = parseInt(c.req.param("categoryId"));
    const products = await ProductService.getByCategory(categoryId);
    return c.json(ApiResponse.success(products), 200);
  }

  static async getFeatured(c: Context) {
    const products = await ProductService.getFeatured();
    return c.json(ApiResponse.success(products), 200);
  }

  static async search(c: Context) {
    const query = c.req.query("q") || "";
    const products = await ProductService.search(query);
    return c.json(ApiResponse.success(products), 200);
  }
}
```

### products/product.route.ts

```typescript
// Public routes
productRoutes.get("/products", ProductController.getAll);
productRoutes.get("/products/featured", ProductController.getFeatured);
productRoutes.get("/products/search", ProductController.search);
productRoutes.get(
  "/products/category/:categoryId",
  ProductController.getByCategory,
);
productRoutes.get("/products/:id", ProductController.getById);

// Admin routes
productRoutes.post(
  "/products",
  requireAuth,
  requireRole(["admin"]),
  ProductController.create,
);
productRoutes.put(
  "/products/:id",
  requireAuth,
  requireRole(["admin"]),
  ProductController.update,
);
productRoutes.delete(
  "/products/:id",
  requireAuth,
  requireRole(["admin"]),
  ProductController.delete,
);
```

---

## Day 6: Testing & Database

### Generate Migrations

```bash
deno task migrate:generate
deno task migrate:run
```

### Seed Data

Create `scripts/seed.ts`:

```typescript
import { db } from "../src/config/database.ts";
import { categories, products } from "../src/entities/...";

// Add sample categories
const electronics = await db.insert(categories).values({
  name: "Electronics",
  slug: "electronics",
  createdAt: Date.now(),
  updatedAt: Date.now(),
}).returning();

// Add sample products
await db.insert(products).values({
  name: "Wireless Headphones",
  description: "Premium noise-cancelling headphones",
  price: 29999, // $299.99
  stock: 50,
  categoryId: electronics[0].id,
  slug: "wireless-headphones",
  sku: "WH-001",
  isFeatured: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

Run seed:

```bash
deno run --allow-all scripts/seed.ts
```

---

## Day 7: Deploy

### Update Environment

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=super-secure-random-string-here
ALLOWED_ORIGINS=https://yourstore.com
```

### Deploy with Docker

```bash
docker-compose --profile prod up --build -d
```

---

## Complete API Endpoints

### Public

- `GET /api/products` - List all products
- `GET /api/products/featured` - Featured products
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/category/:id` - Products by category
- `GET /api/products/:id` - Single product
- `GET /api/categories` - List categories

### Authenticated

- `GET /api/cart-items` - User's cart
- `POST /api/cart-items` - Add to cart
- `DELETE /api/cart-items/:id` - Remove from cart
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - User's orders
- `POST /api/reviews` - Submit review

### Admin Only

- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PUT /api/orders/:id` - Update order status

---

## Project Delivered

**Total Time:** 7 days **Total Entities:** 6 **Total Endpoints:** 25+ **Lines of
Code:** ~2000

Built with TonyStack in a week!
