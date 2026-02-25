# TStack API Foundation

> **Robust. Modular. Type-safe.**
>
> A production-grade REST API architecture built on Deno 2, Hono, and Drizzle.
> Designed for scalability, from the first loc to the first million requests.

## Instant Start

The fastest way to get your API running. Assumes Docker is installed.

```bash
# 1. Environment Configuration
cp .env.example .env.development.local

# 2. Infrastructure Up
docker compose up -d postgres

# 3. Database Initialization (Migrate + Seed)
deno task setup            # Core data (Users, Site Settings)
deno task seed:ecommerce   # E-commerce data (Products, Categories, Brands)

# 4. Develop
deno task dev
```

**Endpoinst Active:**

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs` (if enabled)
- Health: `http://localhost:8000/health`

---

## Command Reference

Your daily driver commands. Run these from the project root.

| Task                    | Description                                                    |
| :---------------------- | :------------------------------------------------------------- |
| **Development**         |                                                                |
| `deno task dev`         | Start development server with hot-reload and full permissions. |
| `deno task start`       | Production start (no watcher).                                 |
| `deno task check`       | Run formatter check (`fmt`) and linter (`lint`).               |
| `deno task routes`      | Print all registered API routes to the console.                |
| **Database**            |                                                                |
| `deno task db:migrate`  | Apply pending migrations to the database.                      |
| `deno task db:generate` | Generate new migration files from schema changes.              |
| `deno task db:studio`   | Open Drizzle Studio to browse data visually.                   |
| `deno task setup`       | Full reset: Run migrations and seed core data.                 |
| **Testing**             |                                                                |
| `deno task test`        | Run full test suite (Database setup → Run → Cleanup).          |
| `deno task test:watch`  | Run tests in watch mode for TDD.                               |

---

## System Architecture

This is not just a template; it's an **Entity-Centric Modular Architecture**.
Code is organized by **domain feature** rather than technical layer.

```text
src/
├── main.ts                  # Application Entry & Bootstrap
├── config/                  # Database & Environment Configuration
├── shared/                  # Base Classes, Middleware, Utilities
└── entities/                # Domain Logic (The Core)
    ├── users/               # [Core] Auth & User Management
    ├── site_settings/       # [Core] Dynamic App Config
    │
    ├── products/            # [Listing] Product Catalog
    ├── categories/          # [Listing] Hierarchy & taxonomy
    ├── brands/              # [Listing] Brand management
    ├── variants/            # [Listing] SKU definitions
    │
    ├── carts/               # [Commerce] Shopping Cart State
    ├── orders/              # [Commerce] Order Processing
    ├── payments/            # [Commerce] Transaction Handling
    └── addresses/           # [Commerce] Shipping Logic
```

---

## Engine Capabilities

### 1. Core Foundation

The bedrock of your application.

- **Authentication**: JWT-based stateless auth with HS256.
- **RBAC**: Built-in Role-Based Access Control (`user`, `admin`, `superadmin`).
- **Dynamic Config**: `site_settings` table for runtime configuration updates
  without redeployments.

### 2. Listing Engine

Manage your catalog complexity with ease.

- **Hierarchical Categories**: Unlimited nesting depth.
- **Product Variants**: Robust handling of Size/Color SKU combinations.
- **Brand Management**: First-class support for multi-brand stores.
- **Media**: Integrated with AWS S3 for product imagery.

### 3. Commerce Engine

Transactional integrity for serious business.

- **Shopping Cart**: Persistent cart logic with guest identity support
  (`X-Guest-Id` header).
- **Guest Checkout**: Full purchase flow without account creation. Orders store
  `guestEmail`, `guestPhone`, and `isGuest` flag. Guest routes are placed before
  the auth middleware.
- **Order Lifecycle**: State machine for order status (Pending -> Paid ->
  Shipped -> Delivered). Includes `insertOrderWithRetry` for order number
  collision handling.
- **Order Tracking**: Public endpoint (`POST /orders/track`) to look up orders
  by email + order number without authentication.
- **Payments**: Razorpay integration with separate guest and authenticated
  flows. Includes manual refund support for admin.
- **Address Book**: User shipping/billing address management.

### 4. Email & Notification System

Transactional email support via Resend or AWS SES.

- **Email Templates**: Order confirmation, processing, shipped, delivered, and
  refunded notifications.
- **Admin Notifications**: Automatic email to admin on new order placement.
- **Notification Service**: Centralized service for dispatching order lifecycle
  emails.

### 5. Site Settings & Feature Flags

Runtime configuration via `site_settings` table:

- **Payment Method Flags**: `enableRazorpay`, `enableCOD`, `enableSelfPickup`
- **Notification Flags**: `OrderNotifications` to toggle order emails
- **Dynamic Config**: Update settings without redeployment

---

## 🔌 Integration Deep Dive

### 1. Google OAuth 2.0

We use a **Provider Pattern** (`src/shared/providers/auth/google.provider.ts`)
to handle OAuth flows, ensuring your auth logic remains clean and testable.

**Setup Instructions:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create Credentials > OAuth Client ID > Web Application.
3. **Authorized Redirect URIs**:
   `http://localhost:8000/api/auth/google/callback` (Dev) and your prod URL.

**Configuration:**

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
```

**End-to-End Flow:**

1. **Frontend** redirects user to `/api/auth/google`.
2. **Backend** generates state, redirects to Google.
3. **Google** redirects back to `/api/auth/google/callback` with `code`.
4. **Backend** exchanges code for tokens, finds/creates user, and issues a
   session JWT.

### 2. Razorpay Payments

The payment system (`src/entities/payments`) is built for robustness, handling
edge cases like network failures during payment verification.

**Architecture:**

- **Backend-Driven Orders**: You create orders on the backend first
  (`/api/payments/orders`) to ensure amount integrity. Frontend never sets the
  price.
- **Double Verification**: Payments are verified on the backend using
  HMAC-SHA256 signature checks.
- **Webhook Resilience**: We listen for `payment.captured` and `payment.failed`
  to reconcile status even if the user closes the browser.

**Required Secrets:**

```bash
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Webhook Configuration:**

- Endpoint: `https://your-api.com/api/webhooks/razorpay`
- Events to Subscribe:
  - `payment.captured` (Marks order as PAID)
  - `payment.failed` (Marks order as FAILED)
  - `refund.processed` (Marks order as REFUNDED)

---

## base-abstractions Pattern

Do not write boilerplate. Inherit it.

We use a powerful **Base Class** pattern to eliminate 80% of repetitive CRUD
code for Admin interfaces, while keeping Public APIs flexible.

### The Problem

Building an Admin Panel requires standard CRUD (List, Create, Show, Update,
Delete) for _every_ entity. Writing this manually is redundant.

### The Solution

**1. Data Layer (`BaseService`)** Generic CRUD with lifecycle hooks
(`beforeCreate`, `afterUpdate`, etc.).

```typescript
export class ProductService extends BaseService<Product, CreateDTO, UpdateDTO> {
  // Add custom logic only where needed
  protected override async beforeCreate(data: CreateDTO) {
    return { ...data, slug: slugify(data.name) }; // Auto-slug
  }
}
```

**2. HTTP Layer (`BaseController`)** Declarative authorization and request
handling.

```typescript
export class ProductController extends BaseController<typeof productService> {
  constructor() {
    super(productService, "Product", {
      // Declarative Auth Rules
      update: {
        requireAuth: true,
        ownershipCheck: (p, uid) => p.ownerId === uid,
      },
      delete: { requireRole: "admin" },
    });
  }
}
```

**3. Router Layer (`RouteFactory`)** One-line router generation.

```typescript
// Admin Route - Standardized for Dashboard
export const adminRoutes = AdminRouteFactory.createRoutes({ ... });

// Public Route - Custom logic allowed
export const publicRoutes = BaseRouteFactory.createCrudRoutes({ ... });
```

---

## Critical Configuration

**Environment Variables** (`.env`)

| Variable                  | Importance   | Description                                          |
| :------------------------ | :----------- | :--------------------------------------------------- |
| `DATABASE_URL`            | **Critical** | PostgreSQL connection string.                        |
| `JWT_SECRET`              | **Critical** | 64-char hex string for signing tokens.               |
| `ENVIRONMENT`             | High         | `development`, `test`, or `production`.              |
| `APP_URL`                 | High         | API base URL (e.g., `https://api.example.com`).      |
| `STOREFRONT_URL`          | High         | Storefront URL for email links.                      |
| `APP_CURRENCY`            | Optional     | Currency code for formatting (default: `INR`).       |
| `DB_POOL_SIZE`            | Optional     | Database connection pool size.                       |
| `GOOGLE_CLIENT_ID`        | Auth         | Google OAuth Client ID.                              |
| `GOOGLE_CLIENT_SECRET`    | Auth         | Google OAuth Client Secret.                          |
| `RAZORPAY_KEY_ID`         | Payments     | Razorpay API Key ID.                                 |
| `RAZORPAY_KEY_SECRET`     | Payments     | Razorpay Key Secret.                                 |
| `RAZORPAY_WEBHOOK_SECRET` | Payments     | Secret for verifying webhook signatures.             |
| `RESEND_API_KEY`          | Email        | API Key for Resend (starts with `re_`).              |
| `SES_ACCESS_KEY_ID`       | Email        | AWS Access Key for SES (overrides general AWS keys). |
| `SES_SECRET_ACCESS_KEY`   | Email        | AWS Secret Key for SES.                              |
| `SES_REGION`              | Email        | AWS Region for SES (e.g., `us-east-1`).              |
| `EMAIL_FROM`              | Email        | Default sender address (e.g., `noreply@domain.com`). |
| `AWS_ACCESS_KEY_ID`       | Optional     | For S3 image uploads (also fallback for SES).        |
| `AWS_SECRET_ACCESS_KEY`   | Optional     | For S3 image uploads (also fallback for SES).        |
| `S3_BUCKET_NAME`          | Optional     | Target bucket for assets.                            |

---

## Testing Strategy

We treat tests as a first-class citizen.

- **Integration Tests**: We test against a **real PostgreSQL database**, not
  mocks.
- **Lifecycle**: The `deno task test` command handles the entire lifecycle:
  1. Spins up a fresh test DB.
  2. Runs migrations.
  3. Executes tests.
  4. Tears down the DB.

`src/entities/products/product.test.ts` (Public API)
`src/entities/products/product.admin.test.ts` (Admin API)

Run them often. Ship with confidence.
