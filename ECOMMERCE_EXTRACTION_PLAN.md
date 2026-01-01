# TStack E-Commerce Feature Extraction Plan

**Document Version**: 1.0\
**Created**: January 2, 2026\
**Branch**: `feature/epic-76-ecommerce-stack`\
**Total Changes**: 385 files, ~68,000 lines of code

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Component Breakdown](#component-breakdown)
4. [Extraction Strategy](#extraction-strategy)
5. [API Starter Extraction](#api-starter-extraction)
6. [Admin UI Starter Extraction](#admin-ui-starter-extraction)
7. [Storefront Starter Extraction](#storefront-starter-extraction)
8. [Environment Variables Reference](#environment-variables-reference)
9. [Customization Guide](#customization-guide)
10. [Testing Strategy](#testing-strategy)
11. [Migration Checklist](#migration-checklist)

---

## Executive Summary

This document provides a comprehensive plan for extracting the e-commerce
features developed in `ts-ground/` into reusable starters for the TStack Kit.
The implementation covers:

- Full authentication system (email/password + Google OAuth)
- E-commerce entities (products, categories, brands, variants, images)
- Shopping cart with guest support
- Order management and checkout flow
- Razorpay payment integration
- Email service with multiple providers (SMTP, Resend, AWS SES)
- S3 image upload with public URLs
- Admin panel for managing all entities
- Customer-facing storefront

### Key Statistics

| Component  | Files | Lines of Code | Entities   |
| ---------- | ----- | ------------- | ---------- |
| API        | 150+  | ~25,000       | 13         |
| Admin UI   | 120+  | ~20,000       | 11 configs |
| Storefront | 50+   | ~12,000       | 15 pages   |
| Providers  | 15+   | ~3,000        | 3 types    |

---

## Architecture Overview

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        STOREFRONT (Fresh)                        │
│  Port 5174 | Customer-facing | Products, Cart, Checkout, Orders │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API (Hono)                              │
│  Port 8000 | REST API | Auth, Entities, Payments, Webhooks      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN UI (Fresh)                            │
│  Port 5173 | Admin panel | CRUD, Orders, Settings                │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Customer Journey:
Browse Products → Add to Cart → Login/Register → Checkout → Pay → Order Confirmation

Admin Journey:
Login → Dashboard → Manage Products → Process Orders → View Payments
```

---

## Component Breakdown

### 1. API Layer (`ts-ground-api/`)

#### Core Entities

| Entity             | Purpose                    | Key Files                        |
| ------------------ | -------------------------- | -------------------------------- |
| `users`            | Authentication, profiles   | `src/auth/user.model.ts`         |
| `addresses`        | Shipping/billing addresses | `src/entities/addresses/`        |
| `products`         | Product catalog            | `src/entities/products/`         |
| `product_images`   | S3 image storage           | `src/entities/product_images/`   |
| `product_variants` | Size/color variants        | `src/entities/product_variants/` |
| `variant_options`  | Variant type definitions   | `src/entities/variant_options/`  |
| `categories`       | Product categories         | `src/entities/categories/`       |
| `brands`           | Product brands             | `src/entities/brands/`           |
| `carts`            | Shopping carts             | `src/entities/carts/`            |
| `orders`           | Customer orders            | `src/entities/orders/`           |
| `payments`         | Payment records            | `src/entities/payments/`         |
| `articles`         | CMS content                | `src/entities/articles/`         |
| `site_settings`    | App configuration          | `src/entities/site_settings/`    |

#### Provider Abstractions

| Provider | Purpose              | Implementations       |
| -------- | -------------------- | --------------------- |
| Email    | Transactional emails | SMTP, Resend, AWS SES |
| Payment  | Payment processing   | Razorpay              |
| OAuth    | Social login         | Google                |

#### File Structure

```
src/
├── auth/                          # Authentication system
│   ├── auth.controller.ts         # Login, register, verify
│   ├── auth.service.ts            # Auth business logic
│   ├── oauth.controller.ts        # OAuth callbacks
│   ├── oauth.service.ts           # OAuth providers
│   ├── profile.controller.ts      # User profile management
│   └── user.model.ts              # User schema
│
├── entities/                      # Domain entities
│   ├── addresses/                 # Address management
│   ├── products/                  # Product catalog
│   ├── carts/                     # Shopping cart
│   ├── orders/                    # Order processing
│   ├── payments/                  # Payment handling
│   └── ...
│
├── shared/
│   ├── providers/                 # Pluggable providers
│   │   ├── email/                 # Email abstraction
│   │   ├── payment/               # Payment abstraction
│   │   └── auth/                  # OAuth abstraction
│   ├── services/                  # Base services
│   ├── middleware/                # Logging, auth
│   └── utils/                     # Helpers
│
├── lib/
│   └── s3-uploader.ts             # S3 image upload
│
└── config/
    ├── database.ts                # Drizzle connection
    └── env.ts                     # Environment config
```

### 2. Admin UI Layer (`ts-ground-admin-ui/`)

#### Entity Configurations

Each entity has a config file that defines:

- Table columns
- Form fields
- Validation rules
- Display formatting

```
config/entities/
├── articles.config.tsx
├── brands.config.tsx
├── categories.config.tsx
├── orders.config.tsx
├── product-images.config.tsx
├── product-variants.config.tsx
├── products.config.tsx
├── site-settings.config.tsx
├── users.config.tsx
└── variant-options.config.tsx
```

#### Reusable Components

```
components/admin/
├── DataTable.tsx          # Generic data table
├── GenericForm.tsx        # Dynamic form builder
├── Pagination.tsx         # Pagination controls
├── ShowPage.tsx           # Detail view component
└── AccessDenied.tsx       # Permission error page

islands/
├── DataTableActions.tsx   # Row actions (edit/delete)
├── ImageUploadPane.tsx    # S3 image uploader
├── RelationshipSelect.tsx # Foreign key selector
└── ThemeSwitcher.tsx      # Dark/light mode
```

#### CRUD Handler Pattern

```typescript
// lib/admin/crud-handlers.ts
// Generates handlers for list, show, create, update, delete
// Used by all entity routes
```

### 3. Storefront Layer (`ts-ground-store/`)

#### Customer Pages

| Route               | Purpose         | Key Features                    |
| ------------------- | --------------- | ------------------------------- |
| `/`                 | Homepage        | Hero, features                  |
| `/products`         | Product listing | Filters, search, pagination     |
| `/products/[slug]`  | Product detail  | Gallery, variants, add to cart  |
| `/cart`             | Shopping cart   | Update quantities, remove items |
| `/checkout`         | Checkout flow   | Address selection, order review |
| `/checkout/payment` | Payment page    | Razorpay integration            |
| `/orders/[id]`      | Order detail    | Status, items, tracking         |

#### Auth Pages

| Route                   | Purpose                |
| ----------------------- | ---------------------- |
| `/auth/login`           | Email + Google login   |
| `/auth/register`        | User registration      |
| `/auth/verify-email`    | Email verification     |
| `/auth/forgot-password` | Password reset request |
| `/auth/reset-password`  | Password reset form    |
| `/auth/logout`          | Session logout         |

#### Account Pages

| Route                | Purpose            |
| -------------------- | ------------------ |
| `/account`           | Account dashboard  |
| `/account/profile`   | Profile management |
| `/account/orders`    | Order history      |
| `/account/addresses` | Address management |

#### Interactive Islands

```
islands/
├── AddToCart.tsx          # Add to cart with quantity
├── ProductGallery.tsx     # Image gallery with thumbnails
└── UserMenu.tsx           # User dropdown menu
```

---

## Extraction Strategy

### Phase 1: API Starter

**Target**: `packages/api-starter/`

1. Copy core structure from `ts-ground-api/`
2. Keep all entity patterns intact
3. Make providers configurable
4. Document environment variables
5. Remove ts-ground specific data

### Phase 2: Admin UI Starter

**Target**: `packages/admin-ui-starter/`

1. Copy from `ts-ground-admin-ui/`
2. Generalize entity configs
3. Keep CRUD handler pattern
4. Document customization points

### Phase 3: Storefront Starter

**Target**: `packages/storefront-starter/`

1. Copy from `ts-ground-store/`
2. Remove hardcoded content
3. Make branding configurable
4. Document API integration

---

## API Starter Extraction

### Files to Extract

```
ts-ground-api/ → packages/api-starter/

COPY AS-IS:
├── src/
│   ├── auth/                      # Full auth system
│   ├── entities/                  # All entities
│   ├── shared/                    # Providers, utils
│   ├── lib/                       # S3 uploader
│   ├── config/                    # Database, env
│   └── main.ts                    # Entry point
├── migrations/                    # Drizzle migrations
├── scripts/                       # CLI scripts
├── tests/                         # Test files
├── deno.json                      # Dependencies
├── drizzle.config.ts              # Drizzle config
├── Dockerfile                     # Container
└── docker-compose.yml             # Dev setup

TEMPLATE (rename/edit):
├── .env.example                   # Environment template
└── README.md                      # Update for starter
```

### Entity Extraction Checklist

For each entity in `src/entities/`:

- [ ] Model file (schema definition)
- [ ] DTO file (validation schemas)
- [ ] Service file (business logic)
- [ ] Controller file (HTTP handlers)
- [ ] Route file (endpoint definitions)
- [ ] Admin route file (admin endpoints)
- [ ] Test file (integration tests)
- [ ] Index file (exports)

### Provider Extraction Checklist

For `src/shared/providers/`:

- [ ] Email provider interface + implementations
- [ ] Payment provider interface + Razorpay
- [ ] OAuth provider interface + Google
- [ ] Factory pattern for provider selection

---

## Admin UI Starter Extraction

### Files to Extract

```
ts-ground-admin-ui/ → packages/admin-ui-starter/

COPY AS-IS:
├── components/                    # UI components
├── config/entities/               # Entity configs
├── entities/                      # Service + types
├── islands/                       # Interactive components
├── lib/                           # API, auth, handlers
├── routes/                        # All admin routes
├── assets/                        # Styles
├── deno.json                      # Dependencies
├── main.ts                        # Entry point
└── utils.ts                       # Fresh utils

TEMPLATE:
├── .env.example                   # Environment template
└── README.md                      # Update for starter
```

### Entity Config Pattern

Each entity config follows this structure:

```typescript
// config/entities/products.config.tsx
export const productsConfig: EntityConfig<Product> = {
  name: "products",
  label: "Products",
  labelPlural: "Products",

  // Table columns
  columns: [
    { key: "name", label: "Name", sortable: true },
    { key: "price", label: "Price", format: "currency" },
    // ...
  ],

  // Form fields
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "price", label: "Price", type: "number" },
    // ...
  ],

  // Validation
  schema: createProductSchema,
};
```

### Customization Points

| What               | Where                               | How                    |
| ------------------ | ----------------------------------- | ---------------------- |
| Add entity         | `config/entities/`                  | Create new config file |
| Modify columns     | `config/entities/[name].config.tsx` | Edit `columns` array   |
| Change form fields | `config/entities/[name].config.tsx` | Edit `fields` array    |
| Custom formatting  | `columns[].format`                  | Use built-in or custom |
| Relationships      | `RelationshipSelect` island         | Configure in field     |

---

## Storefront Starter Extraction

### Files to Extract

```
ts-ground-store/ → packages/storefront-starter/

COPY AS-IS:
├── components/                    # UI components
├── islands/                       # Interactive components
├── lib/                           # API client, auth
├── routes/                        # All pages
├── assets/                        # Styles
├── static/                        # Static files
├── deno.json                      # Dependencies
├── main.ts                        # Entry point
└── utils.ts                       # Fresh utils

TEMPLATE:
├── .env.example                   # Environment template
└── README.md                      # Update for starter
```

### API Client (`lib/api.ts`)

The API client handles all backend communication:

```typescript
class ApiClient {
  // Auth
  login(email, password);
  register(data);
  verifyEmail(token);
  forgotPassword(email);
  resetPassword(token, password);

  // Profile
  getProfile();
  updateProfile(data);

  // Addresses
  getAddresses();
  createAddress(data);
  updateAddress(id, data);
  deleteAddress(id);
  setDefaultAddress(id);

  // Cart
  getCart();
  addToCart(productId, quantity, variantId?);
  updateCartItem(itemId, quantity);
  removeCartItem(itemId);
  clearCart();

  // Orders
  createOrder(data);
  getOrders();
  getOrder(id);
  cancelOrder(id);

  // Payments
  createPaymentOrder(orderId);
  verifyPayment(data);

  // Products
  getProducts(params);
  getProduct(id);
  getProductBySlug(slug);
  getCategories();
}
```

### Authentication Flow

```
1. User visits /auth/login
2. Submits email/password OR clicks Google OAuth
3. API returns JWT token
4. Token stored in cookie (store_session)
5. Middleware reads cookie, fetches user profile
6. User context available in all pages via ctx.state.user
```

---

## Environment Variables Reference

### API Environment Variables

```bash
# ============================================
# DATABASE (Required)
# ============================================
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# ============================================
# JWT (Required)
# ============================================
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# ============================================
# EMAIL (Required for auth flows)
# ============================================
# Provider: smtp | resend | ses
EMAIL_PROVIDER=smtp

# SMTP Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxx
SMTP_SECURE=false

# OR Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxx

# OR AWS SES Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
SES_FROM_EMAIL=noreply@yourdomain.com

# Common email settings
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com

# ============================================
# GOOGLE OAUTH (Optional)
# ============================================
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback

# ============================================
# RAZORPAY (Required for payments)
# ============================================
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# ============================================
# AWS S3 (Required for image uploads)
# ============================================
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket-name
S3_PREFIX=your-app/dev

# ============================================
# APP SETTINGS
# ============================================
APP_NAME=Your App Name
APP_URL=http://localhost:8000
STOREFRONT_URL=http://localhost:5174
ADMIN_URL=http://localhost:5173

# ============================================
# SEED DATA (Development)
# ============================================
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=SecurePassword123!
```

### Admin UI Environment Variables

```bash
API_BASE_URL=http://localhost:8000
```

### Storefront Environment Variables

```bash
API_BASE_URL=http://localhost:8000
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

---

## Customization Guide

### How to Add a New Email Provider

1. **Create provider file**:
   ```
   src/shared/providers/email/mailgun.provider.ts
   ```

2. **Implement interface**:
   ```typescript
   import {
     EmailOptions,
     EmailResult,
     IEmailProvider,
   } from "./email-provider.interface.ts";

   export class MailgunProvider implements IEmailProvider {
     async send(options: EmailOptions): Promise<EmailResult> {
       // Implementation
     }
   }
   ```

3. **Register in factory**:
   ```typescript
   // src/shared/providers/email/factory.ts
   case "mailgun":
     return new MailgunProvider();
   ```

4. **Add env variables**:
   ```bash
   EMAIL_PROVIDER=mailgun
   MAILGUN_API_KEY=...
   MAILGUN_DOMAIN=...
   ```

### How to Add a New Payment Provider

1. **Create provider file**:
   ```
   src/shared/providers/payment/stripe.provider.ts
   ```

2. **Implement interface**:
   ```typescript
   import { IPaymentProvider } from "./payment-provider.interface.ts";

   export class StripeProvider implements IPaymentProvider {
     async createOrder(options) { ... }
     async verifyPayment(options) { ... }
     async capturePayment(paymentId, amount) { ... }
     async refundPayment(paymentId, amount?) { ... }
   }
   ```

3. **Update payment service** to use factory pattern

### How to Add a New OAuth Provider

1. **Create provider file**:
   ```
   src/shared/providers/auth/github.provider.ts
   ```

2. **Implement interface**:
   ```typescript
   import { IOAuthProvider } from "./auth-provider.interface.ts";

   export class GitHubProvider implements IOAuthProvider {
     getAuthUrl(state: string): string { ... }
     async getTokens(code: string): Promise<OAuthTokens> { ... }
     async getUserInfo(accessToken: string): Promise<OAuthUserInfo> { ... }
   }
   ```

3. **Add routes**:
   ```
   src/auth/oauth.route.ts → Add /auth/github endpoints
   ```

### How to Add a New Entity

1. **Create entity directory**:
   ```
   src/entities/reviews/
   ├── review.model.ts      # Drizzle schema
   ├── review.dto.ts        # Zod validation
   ├── review.service.ts    # Business logic
   ├── review.controller.ts # HTTP handlers
   ├── review.route.ts      # Public routes
   ├── review.admin.route.ts# Admin routes
   └── index.ts             # Exports
   ```

2. **Register in main.ts**:
   ```typescript
   import reviewRoutes from "./entities/reviews/review.route.ts";
   app.route("/", reviewRoutes);
   ```

3. **Run migration**:
   ```bash
   deno task db:generate
   deno task db:migrate
   ```

4. **Add admin config** (if needed):
   ```
   config/entities/reviews.config.tsx
   ```

### How to Customize Email Templates

Templates are in `src/shared/providers/email/templates/`:

```typescript
// templates/order-confirmation.ts
export function orderConfirmationTemplate(data: {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: string;
}): string {
  return `
    <h1>Order Confirmed!</h1>
    <p>Hi ${data.customerName},</p>
    <p>Your order #${data.orderNumber} has been confirmed.</p>
    ...
  `;
}
```

### How to Customize S3 Upload

Edit `src/lib/s3-uploader.ts`:

```typescript
// Change path structure
const key = `${this.prefix}/${entityType}/${entityId}/${imageId}.${extension}`;

// Change allowed file types
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Change max file size
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

---

## Testing Strategy

### Unit Tests

```bash
# Run all tests
deno task test

# Run specific test file
deno test src/entities/products/product.test.ts
```

### Integration Tests

```bash
# Setup test database
deno task test:setup

# Run tests with coverage
deno task test:coverage
```

### Manual Testing Checklist

- [ ] User registration with email verification
- [ ] User login (email + Google OAuth)
- [ ] Password reset flow
- [ ] Product browsing with filters
- [ ] Add to cart (logged in + guest)
- [ ] Checkout flow with address
- [ ] Razorpay payment completion
- [ ] Order history and detail
- [ ] Admin product management
- [ ] Admin order processing

---

## Migration Checklist

### Pre-Migration

- [ ] Backup existing database
- [ ] Document current env variables
- [ ] List custom modifications

### Migration Steps

1. **Database**
   ```bash
   # Generate migration
   deno task db:generate

   # Review migration file
   cat migrations/xxxx_migration.sql

   # Apply migration
   deno task db:migrate
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Fill in all required values
   - Validate with `deno task validate:env`

3. **Seed Data**
   ```bash
   deno task db:seed:superadmin
   deno task db:seed:settings
   ```

4. **Verify**
   ```bash
   deno task dev
   # Check health endpoint: http://localhost:8000/health
   ```

### Post-Migration

- [ ] Verify all API endpoints
- [ ] Test authentication flows
- [ ] Test payment integration
- [ ] Verify email delivery
- [ ] Check S3 uploads

---

## File Location Quick Reference

| Need to...                | File Location                               |
| ------------------------- | ------------------------------------------- |
| Add email provider        | `src/shared/providers/email/`               |
| Add payment provider      | `src/shared/providers/payment/`             |
| Add OAuth provider        | `src/shared/providers/auth/`                |
| Add entity                | `src/entities/[name]/`                      |
| Add API endpoint          | `src/entities/[name]/[name].route.ts`       |
| Add admin endpoint        | `src/entities/[name]/[name].admin.route.ts` |
| Customize email template  | `src/shared/providers/email/templates/`     |
| Customize S3 paths        | `src/lib/s3-uploader.ts`                    |
| Add admin entity config   | `config/entities/[name].config.tsx`         |
| Add storefront page       | `routes/[path].tsx`                         |
| Add interactive component | `islands/[Name].tsx`                        |
| Add API client method     | `lib/api.ts`                                |
| Configure auth            | `lib/auth.ts`                               |

---

## Summary

This extraction plan provides a complete roadmap for:

1. **Understanding** the e-commerce implementation architecture
2. **Extracting** features into reusable starters
3. **Customizing** providers (email, payment, OAuth)
4. **Extending** with new entities and features
5. **Testing** the implementation thoroughly
6. **Migrating** to production environments

The key design principles followed:

- **Provider abstraction** - Swap implementations without code changes
- **Entity pattern** - Consistent structure for all domain objects
- **Config-driven admin** - Add entities via configuration
- **Type safety** - Full TypeScript with Zod validation
- **Test coverage** - Unit and integration tests included

---

## Next Steps

1. Review this document and the branch code
2. Decide which features to include in starters
3. Create extraction branches for each starter
4. Update starter documentation
5. Test extracted starters in clean environment
6. Publish updated starters

---

_Document generated from `feature/epic-76-ecommerce-stack` branch analysis_
