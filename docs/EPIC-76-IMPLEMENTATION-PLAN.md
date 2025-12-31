# TStack E-Commerce Implementation Plan

**EPIC**:
[#76 - Cart, Orders, Payments, OAuth](https://github.com/desingh-rajan/tstack-kit/issues/76)
**Timeline**: Dec 31, 2025 → Jan 12, 2026 (12 days) **Goal**: Launch Surya's
Cookware production storefront with full e-commerce capabilities **Related
Issues**: #34 (OAuth), #10 (Email Service)

---

## Overview

### Workspaces

| Environment             | Purpose                 | GitHub Org      |
| ----------------------- | ----------------------- | --------------- |
| `ts-ground/suryas-test` | Development & testing   | ts-ground       |
| `suryas-cookware/*`     | Production deployment   | suryas-cookware |
| `tstack-kit/packages/*` | Extract patterns to kit | desingh-rajan   |

### Tech Stack

- **API**: Deno + Hono + Drizzle + PostgreSQL
- **Storefront**: Fresh + Preact + Tailwind
- **Email**: SMTP (Resend/Gmail for MVP)
- **Payments**: Razorpay
- **Auth**: JWT + Google OAuth

---

## Database Schema Additions

```sql
-- User extensions (modify existing)
ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verification_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN password_reset_expiry TIMESTAMP;

-- New tables
CREATE TABLE addresses (...);
CREATE TABLE carts (...);
CREATE TABLE cart_items (...);
CREATE TABLE orders (...);
CREATE TABLE order_items (...);
CREATE TABLE payments (...);
```

---

## Day-by-Day Implementation

### Day 1 (Dec 31): Email Service Foundation

**Goal**: Email provider abstraction + SMTP implementation

#### Files to Create

```
src/shared/providers/email/
├── email-provider.interface.ts   # IEmailProvider interface
├── smtp.provider.ts              # SMTP implementation (Resend/Gmail)
├── email.service.ts              # Email service facade
├── templates/
│   ├── verification.ts           # Email verification template
│   ├── password-reset.ts         # Password reset template
│   └── welcome.ts                # Welcome email template
└── index.ts
```

#### IEmailProvider Interface

```typescript
interface IEmailProvider {
  send(options: EmailOptions): Promise<EmailResult>;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}
```

#### Environment Variables

```env
# Email Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@suryascookware.com
```

#### Tasks

- [ ] Create `IEmailProvider` interface
- [ ] Implement `SmtpProvider` using nodemailer/Deno SMTP
- [ ] Create email templates (verification, reset, welcome)
- [ ] Add email config to environment
- [ ] Write unit tests for email service

---

### Day 2 (Jan 1): Email Verification & Password Reset

**Goal**: Complete auth flows for email verification and password reset

#### Schema Changes (users table)

```typescript
// Add to users model
emailVerificationToken: text("email_verification_token"),
emailVerificationExpiry: timestamp("email_verification_expiry"),
passwordResetToken: text("password_reset_token"),
passwordResetExpiry: timestamp("password_reset_expiry"),
```

#### New API Endpoints

```
POST /auth/send-verification     # Send verification email
GET  /auth/verify-email          # Verify email with token
POST /auth/forgot-password       # Request password reset
POST /auth/reset-password        # Reset password with token
```

#### Files to Modify

```
src/auth/
├── auth.service.ts              # Add verification/reset methods
├── auth.controller.ts           # Add new endpoints
└── auth.route.ts                # Register new routes
```

#### Auth Service Methods

```typescript
// New methods to add
async sendVerificationEmail(userId: number): Promise<void>
async verifyEmail(token: string): Promise<boolean>
async sendPasswordResetEmail(email: string): Promise<void>
async resetPassword(token: string, newPassword: string): Promise<boolean>
```

#### Tasks

- [ ] Add token fields to users schema
- [ ] Implement `sendVerificationEmail()` in auth service
- [ ] Implement `verifyEmail()` endpoint
- [ ] Implement `forgotPassword()` endpoint
- [ ] Implement `resetPassword()` endpoint
- [ ] Send welcome email on registration
- [ ] Block checkout for unverified emails
- [ ] Write integration tests

---

### Day 3 (Jan 2): Google OAuth Provider

**Goal**: Google OAuth login with user linking

**Closes**: #34 (OAuth Login Support) - Google portion

#### Files to Create

```
src/shared/providers/auth/
├── auth-provider.interface.ts   # IAuthProvider interface
├── google.provider.ts           # Google OAuth implementation
├── oauth.config.ts              # OAuth configuration
└── index.ts

src/auth/
├── oauth.controller.ts          # OAuth callback handlers
└── oauth.route.ts               # OAuth routes
```

#### Schema Changes (users table)

```typescript
// Add to users model
googleId: text("google_id").unique(),
avatarUrl: text("avatar_url"),
firstName: text("first_name"),
lastName: text("last_name"),
```

#### New API Endpoints

```
GET  /auth/google                # Redirect to Google OAuth
GET  /auth/google/callback       # Handle OAuth callback
POST /auth/oauth/link            # Link OAuth to existing account
```

#### OAuth Flow

```
1. User clicks "Login with Google"
2. Redirect to /auth/google
3. Google redirects back to /auth/google/callback
4. Extract profile (email, name, avatar, googleId)
5. Find user by googleId OR email
6. Create new user if not exists (auto-verified)
7. Link googleId if user exists by email
8. Generate JWT token
9. Redirect to storefront with token
```

#### Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback
```

#### Tasks

- [ ] Create `IAuthProvider` interface
- [ ] Implement `GoogleAuthProvider`
- [ ] Add googleId, firstName, lastName, avatarUrl to users
- [ ] Create OAuth routes and controller
- [ ] Handle new user creation from OAuth
- [ ] Handle linking OAuth to existing email account
- [ ] Auto-verify email for OAuth users
- [ ] Write integration tests

---

### Day 4 (Jan 3): User Profile & Addresses Entity

**Goal**: Extended user profile + address management

#### Profile API Endpoints

```
GET  /users/me/profile           # Get current user profile
PUT  /users/me/profile           # Update profile
POST /users/me/avatar            # Upload avatar (S3)
```

#### Address Entity Files

```
src/entities/addresses/
├── address.model.ts
├── address.dto.ts
├── address.service.ts
├── address.controller.ts
├── address.route.ts
├── address.admin.route.ts
└── address.test.ts
```

#### Address Schema

```typescript
export const addresses = pgTable("addresses", {
  ...commonColumns,
  userId: integer("user_id").references(() => users.id).notNull(),
  label: text("label"), // "Home", "Work", "Mom's House"
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("India"),
  isDefault: boolean("is_default").default(false).notNull(),
  type: text("type").default("shipping"), // shipping | billing
});
```

#### Address API Endpoints

```
GET    /addresses                # List user's addresses
POST   /addresses                # Create address
GET    /addresses/:id            # Get address
PUT    /addresses/:id            # Update address
DELETE /addresses/:id            # Delete address
PUT    /addresses/:id/default    # Set as default
```

#### Tasks

- [ ] Create profile endpoints
- [ ] Create address entity (all files)
- [ ] Enforce user ownership on addresses
- [ ] Implement "set default" logic (unset others)
- [ ] Add admin routes for address management
- [ ] Write integration tests

---

### Day 5-6 (Jan 4-5): Cart System

**Goal**: Full cart functionality with guest support

#### Cart Entity Files

```
src/entities/carts/
├── cart.model.ts
├── cart.dto.ts
├── cart.service.ts
├── cart.controller.ts
├── cart.route.ts
└── cart.test.ts

src/entities/cart_items/
├── cart-item.model.ts
├── cart-item.dto.ts
├── cart-item.service.ts
└── cart-item.controller.ts
```

#### Cart Schema

```typescript
export const carts = pgTable("carts", {
  ...uuidColumns,
  userId: integer("user_id").references(() => users.id), // null for guests
  guestId: text("guest_id"), // UUID for guests
  status: text("status").default("active").notNull(), // active | converted | expired
  expiresAt: timestamp("expires_at"), // 7 days for guest carts
});

export const cartItems = pgTable("cart_items", {
  ...uuidColumns,
  cartId: uuid("cart_id").references(() => carts.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull().default(1),
  priceAtAdd: decimal("price_at_add", { precision: 10, scale: 2 }).notNull(),
});
```

#### Cart API Endpoints

```
GET    /cart                     # Get or create active cart
POST   /cart/items               # Add item to cart
PUT    /cart/items/:id           # Update item quantity
DELETE /cart/items/:id           # Remove item from cart
DELETE /cart                     # Clear cart
POST   /cart/merge               # Merge guest cart on login
GET    /cart/count               # Get item count (for header badge)
```

#### Cart Business Logic

```typescript
class CartService {
  // Get or create cart (handles guest + auth)
  async getOrCreateCart(userId?: number, guestId?: string): Promise<Cart>;

  // Add item with stock validation
  async addItem(
    cartId: string,
    productId: string,
    variantId?: string,
    quantity: number,
  ): Promise<CartItem>;

  // Calculate totals
  async getCartWithTotals(cartId: string): Promise<CartWithTotals>;

  // Merge guest cart into user cart on login
  async mergeCarts(guestId: string, userId: number): Promise<Cart>;

  // Validate stock for all items
  async validateStock(cartId: string): Promise<StockValidationResult>;
}
```

#### Guest Cart Flow

```
1. New visitor -> Generate guestId (UUID), store in cookie
2. Add to cart -> Create cart with guestId, no userId
3. User logs in -> Call POST /cart/merge
4. Merge logic:
   - Find guest cart by guestId
   - Find/create user cart
   - Move items (update quantities if same product)
   - Delete guest cart
   - Clear guestId cookie
```

#### Tasks

- [ ] Create cart entity
- [ ] Create cart_items entity
- [ ] Implement guest cart (cookie-based guestId)
- [ ] Implement cart merge on login
- [ ] Add price snapshot on add (priceAtAdd)
- [ ] Validate stock on add
- [ ] Calculate totals (subtotal, count)
- [ ] Add cart expiry for guests (7 days)
- [ ] Write integration tests

---

### Day 7-8 (Jan 6-7): Orders & Checkout

**Goal**: Order creation from cart with checkout flow

#### Order Entity Files

```
src/entities/orders/
├── order.model.ts
├── order.dto.ts
├── order.service.ts
├── order.controller.ts
├── order.route.ts
├── order.admin.route.ts
└── order.test.ts

src/entities/order_items/
├── order-item.model.ts
└── order-item.dto.ts
```

#### Order Schema

```typescript
export const orderStatusEnum = pgEnum("order_status", [
  "pending", // Created, awaiting payment
  "confirmed", // Payment received
  "processing", // Being prepared
  "shipped", // In transit
  "delivered", // Completed
  "cancelled", // Cancelled
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const orders = pgTable("orders", {
  ...uuidColumns,
  orderNumber: text("order_number").notNull().unique(), // SC-20260107-00001
  userId: integer("user_id").references(() => users.id).notNull(),

  // Totals
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 })
    .default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
    .default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),

  // Status
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending")
    .notNull(),

  // Addresses (snapshot)
  shippingAddressId: integer("shipping_address_id").references(() =>
    addresses.id
  ),
  billingAddressId: integer("billing_address_id").references(() =>
    addresses.id
  ),
  shippingAddressSnapshot: jsonb("shipping_address_snapshot"),
  billingAddressSnapshot: jsonb("billing_address_snapshot"),

  // Payment
  paymentMethod: text("payment_method"), // razorpay, cod
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),

  // Notes
  customerNotes: text("customer_notes"),
  adminNotes: text("admin_notes"),
});

export const orderItems = pgTable("order_items", {
  ...uuidColumns,
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id),

  // Snapshot at purchase time
  productName: text("product_name").notNull(),
  variantName: text("variant_name"),
  sku: text("sku"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});
```

#### Order Number Generation

```typescript
// Format: SC-YYYYMMDD-XXXXX (e.g., SC-20260107-00001)
async generateOrderNumber(): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await this.getTodayOrderCount();
  const sequence = String(count + 1).padStart(5, "0");
  return `SC-${date}-${sequence}`;
}
```

#### Checkout API Endpoints

```
POST /checkout/validate          # Validate cart before checkout
POST /checkout/create            # Create order from cart
GET  /orders                     # User's order history
GET  /orders/:id                 # Order details
POST /orders/:id/cancel          # Cancel order (if allowed)

# Admin
GET    /admin/orders             # List all orders (filters)
GET    /admin/orders/:id         # Order details
PUT    /admin/orders/:id/status  # Update order status
```

#### Checkout Flow

```
1. POST /checkout/validate
   - Verify user is authenticated
   - Verify email is verified
   - Validate cart has items
   - Validate all items in stock
   - Calculate totals
   - Return validation result

2. POST /checkout/create
   - Validate shipping address
   - Create order with "pending" status
   - Snapshot product details to order_items
   - Snapshot addresses
   - Generate order number
   - Clear cart
   - Return order with Razorpay order ID

3. Payment flow (Day 9-10)

4. POST /orders/:id/cancel
   - Only if status is "pending" or "confirmed"
   - Update status to "cancelled"
   - Restore stock (if reserved)
   - Trigger refund if paid
```

#### Tasks

- [ ] Create order entity
- [ ] Create order_items entity
- [ ] Implement order number generation
- [ ] Create checkout validation endpoint
- [ ] Create order from cart
- [ ] Snapshot product details to order_items
- [ ] Snapshot addresses
- [ ] Clear cart after order creation
- [ ] Implement order history endpoint
- [ ] Implement order cancellation
- [ ] Create admin order management routes
- [ ] Write integration tests

---

### Day 9-10 (Jan 8-9): Razorpay Integration

**Goal**: Payment provider abstraction + Razorpay implementation

#### Payment Provider Files

```
src/shared/providers/payment/
├── payment-provider.interface.ts  # IPaymentProvider interface
├── razorpay.provider.ts           # Razorpay implementation
├── payment.service.ts             # Payment service facade
└── index.ts

src/entities/payments/
├── payment.model.ts
├── payment.dto.ts
├── payment.service.ts
├── payment.controller.ts
├── payment.route.ts
└── payment.test.ts
```

#### Payment Schema

```typescript
export const payments = pgTable("payments", {
  ...uuidColumns,
  orderId: uuid("order_id").references(() => orders.id).notNull(),

  // Razorpay fields
  razorpayOrderId: text("razorpay_order_id").notNull(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),

  // Amount
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("INR").notNull(),

  // Status
  status: text("status").default("created").notNull(), // created, authorized, captured, failed, refunded

  // Metadata
  method: text("method"), // card, upi, netbanking, wallet
  bank: text("bank"),
  wallet: text("wallet"),
  vpa: text("vpa"), // UPI ID

  // Timestamps
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  refundedAt: timestamp("refunded_at"),

  // Raw response
  razorpayResponse: jsonb("razorpay_response"),
});
```

#### IPaymentProvider Interface

```typescript
interface IPaymentProvider {
  createOrder(options: CreateOrderOptions): Promise<PaymentOrder>;
  verifyPayment(options: VerifyPaymentOptions): Promise<boolean>;
  capturePayment(paymentId: string, amount: number): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;
  getPaymentDetails(paymentId: string): Promise<PaymentDetails>;
}

interface CreateOrderOptions {
  amount: number; // In paise (INR * 100)
  currency: string;
  receipt: string; // Order number
  notes?: Record<string, string>;
}
```

#### Payment API Endpoints

```
POST /payments/create-order      # Create Razorpay order
POST /payments/verify            # Verify payment (webhook)
GET  /payments/:orderId/status   # Check payment status

# Webhook (called by Razorpay)
POST /webhooks/razorpay          # Payment status webhook
```

#### Razorpay Flow

```
Frontend:
1. User clicks "Pay Now"
2. Call POST /payments/create-order { orderId }
3. Receive { razorpayOrderId, amount, key }
4. Open Razorpay checkout modal
5. User completes payment
6. Razorpay returns { razorpay_payment_id, razorpay_order_id, razorpay_signature }
7. Call POST /payments/verify with above data

Backend:
1. Create Razorpay order via API
2. Store in payments table
3. On verify: validate signature
4. Update payment status
5. Update order paymentStatus to "paid"
6. Update order status to "confirmed"
7. Send order confirmation email
```

#### Signature Verification

```typescript
// Razorpay signature verification
verifySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === razorpaySignature;
}
```

#### Environment Variables

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

#### Tasks

- [ ] Create `IPaymentProvider` interface
- [ ] Implement `RazorpayProvider`
- [ ] Create payments entity
- [ ] Create Razorpay order endpoint
- [ ] Implement signature verification
- [ ] Create payment verification endpoint
- [ ] Update order status on successful payment
- [ ] Send order confirmation email
- [ ] Implement webhook handler
- [ ] Handle failed payments
- [ ] Write integration tests

---

### Day 11 (Jan 10): Transactional Emails & Admin

**Goal**: Order emails + admin order management

#### Email Templates

```
src/shared/providers/email/templates/
├── order-confirmation.ts        # Order placed successfully
├── payment-success.ts           # Payment received
├── payment-failed.ts            # Payment failed
├── order-shipped.ts             # Order shipped with tracking
├── order-delivered.ts           # Order delivered
└── order-cancelled.ts           # Order cancelled
```

#### Email Triggers

| Event                   | Email                 | Recipient |
| ----------------------- | --------------------- | --------- |
| Order created (pending) | -                     | -         |
| Payment success         | Order Confirmation    | Customer  |
| Payment failed          | Payment Failed        | Customer  |
| Status -> shipped       | Shipping Notification | Customer  |
| Status -> delivered     | Delivery Confirmation | Customer  |
| Status -> cancelled     | Cancellation Notice   | Customer  |
| New order               | New Order Alert       | Admin     |

#### Admin Order Management UI

```
Admin UI Routes:
/admin/orders                    # Orders list with filters
/admin/orders/[id]               # Order detail page
```

#### Admin Features

- [ ] Orders list with filters (status, date range, search)
- [ ] Order detail view
- [ ] Update order status
- [ ] Add admin notes
- [ ] View payment details
- [ ] Trigger emails manually

#### Tasks

- [ ] Create all email templates
- [ ] Implement email triggers on status changes
- [ ] Send admin notification on new order
- [ ] Create admin orders list page
- [ ] Create admin order detail page
- [ ] Implement status update UI
- [ ] Add order search/filters

---

### Day 12 (Jan 11): Storefront UI

**Goal**: Customer-facing auth, cart, checkout pages

#### Storefront Routes

```
routes/
├── auth/
│   ├── login.tsx                # Login page (email + Google)
│   ├── register.tsx             # Registration page
│   ├── verify-email.tsx         # Email verification page
│   ├── forgot-password.tsx      # Forgot password page
│   └── reset-password.tsx       # Reset password page
├── account/
│   ├── index.tsx                # Profile page
│   ├── orders.tsx               # Order history
│   ├── orders/[id].tsx          # Order detail
│   └── addresses.tsx            # Address management
├── cart.tsx                     # Cart page
├── checkout.tsx                 # Checkout page (multi-step)
└── order-confirmation/[id].tsx  # Order success page
```

#### Components

```
components/
├── auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── GoogleButton.tsx
│   └── ForgotPasswordForm.tsx
├── cart/
│   ├── CartDrawer.tsx           # Slide-out cart
│   ├── CartItem.tsx
│   ├── CartSummary.tsx
│   └── CartEmpty.tsx
├── checkout/
│   ├── CheckoutForm.tsx
│   ├── AddressSelector.tsx
│   ├── OrderSummary.tsx
│   └── RazorpayButton.tsx
└── account/
    ├── ProfileForm.tsx
    ├── AddressForm.tsx
    ├── AddressList.tsx
    └── OrderCard.tsx
```

#### Islands (Interactive)

```
islands/
├── CartDrawer.tsx               # Cart with add/remove
├── CartBadge.tsx                # Header cart count
├── CheckoutForm.tsx             # Multi-step checkout
├── RazorpayCheckout.tsx         # Razorpay integration
├── AddressManager.tsx           # CRUD addresses
└── GoogleAuthButton.tsx         # Google OAuth
```

#### Checkout Steps

```
Step 1: Review Cart
  - Show cart items
  - Update quantities
  - Remove items
  - Show subtotal

Step 2: Shipping Address
  - Select existing address OR
  - Add new address
  - Validate address

Step 3: Payment
  - Show order summary
  - Razorpay checkout button
  - Handle success/failure
  
Step 4: Confirmation
  - Order number
  - Order details
  - Estimated delivery
  - Continue shopping button
```

#### Tasks

- [ ] Create login/register pages
- [ ] Add Google OAuth button
- [ ] Create forgot/reset password pages
- [ ] Create account profile page
- [ ] Create address management page
- [ ] Create order history page
- [ ] Create cart page/drawer
- [ ] Create multi-step checkout
- [ ] Integrate Razorpay checkout
- [ ] Create order confirmation page
- [ ] Mobile responsive design
- [ ] Test complete flow

---

## Day 13-14 (Jan 12-13): Buffer & Polish

**Goal**: Testing, bug fixes, deployment prep

#### Tasks

- [ ] End-to-end testing of complete flow
- [ ] Fix bugs discovered in testing
- [ ] Performance optimization
- [ ] Security audit (CSRF, XSS, SQL injection)
- [ ] Environment variable validation
- [ ] Production database setup
- [ ] Deploy to suryas-cookware org
- [ ] DNS/domain configuration
- [ ] SSL certificate setup
- [ ] Smoke test in production

---

## API Endpoint Summary

### Auth

```
POST /auth/register              # Register with email/password
POST /auth/login                 # Login with email/password
POST /auth/logout                # Logout (revoke token)
POST /auth/send-verification     # Send verification email
GET  /auth/verify-email          # Verify email with token
POST /auth/forgot-password       # Request password reset
POST /auth/reset-password        # Reset password with token
GET  /auth/google                # Google OAuth redirect
GET  /auth/google/callback       # Google OAuth callback
```

### User & Profile

```
GET  /users/me                   # Get current user
GET  /users/me/profile           # Get profile details
PUT  /users/me/profile           # Update profile
POST /users/me/avatar            # Upload avatar
```

### Addresses

```
GET    /addresses                # List addresses
POST   /addresses                # Create address
GET    /addresses/:id            # Get address
PUT    /addresses/:id            # Update address
DELETE /addresses/:id            # Delete address
PUT    /addresses/:id/default    # Set as default
```

### Cart

```
GET    /cart                     # Get/create cart
POST   /cart/items               # Add item
PUT    /cart/items/:id           # Update quantity
DELETE /cart/items/:id           # Remove item
DELETE /cart                     # Clear cart
POST   /cart/merge               # Merge guest cart
GET    /cart/count               # Item count
```

### Orders & Checkout

```
POST /checkout/validate          # Validate cart
POST /checkout/create            # Create order
GET  /orders                     # Order history
GET  /orders/:id                 # Order detail
POST /orders/:id/cancel          # Cancel order
```

### Payments

```
POST /payments/create-order      # Create Razorpay order
POST /payments/verify            # Verify payment
GET  /payments/:orderId/status   # Payment status
POST /webhooks/razorpay          # Razorpay webhook
```

### Admin

```
GET    /admin/orders             # List orders
GET    /admin/orders/:id         # Order detail
PUT    /admin/orders/:id/status  # Update status
```

---

## Environment Variables Checklist

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/suryas_cookware_dev

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxxx
EMAIL_FROM=noreply@suryascookware.com

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=https://api.suryascookware.com/auth/google/callback

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# S3 (for avatars/invoices)
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=ap-south-1
S3_BUCKET=suryas-cookware-assets

# App
APP_URL=https://suryascookware.com
API_URL=https://api.suryascookware.com
```

---

## Success Criteria

- [ ] User can register with email/password
- [ ] User can login with Google OAuth
- [ ] User receives verification email and can verify
- [ ] User can reset forgotten password
- [ ] User can manage multiple addresses
- [ ] Guest can add items to cart
- [ ] Guest cart merges on login
- [ ] User can checkout with Razorpay
- [ ] User receives order confirmation email
- [ ] User can view order history
- [ ] Admin can manage orders
- [ ] Admin receives new order notifications

---

## Post-Launch (Jan 15+)

1. Extract patterns to tstack-kit starters
2. Write documentation for Pro features
3. Add GitHub OAuth (#34 completion)
4. Add invoice PDF generation
5. Add SMS notifications (optional)
6. Flutter admin MVP for client
7. Performance monitoring setup

---

## Notes

- Skip Stripe/LemonSqueezy for now (Razorpay only for India)
- Skip Cognito (#60) - overkill for this use case
- Skip phone verification - requires SMS provider
- Magic links can be added post-launch
- Focus on shipping, not perfection
