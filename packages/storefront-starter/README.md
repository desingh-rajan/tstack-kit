# TStack Storefront Starter

> Production-ready e-commerce storefront with guest checkout, order tracking,
> and Razorpay payments.

Part of the **TStack Kit** ecosystem. Built on **Fresh 2** (Deno's web
framework) with Preact islands architecture.

## Features

| Feature                | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| **Guest Checkout**     | Full purchase flow without account creation                  |
| **Order Tracking**     | Public `/track-order` page by email + order number           |
| **Razorpay Payments**  | Integrated payment flow for guests and registered users      |
| **Authentication**     | Login, register, Google OAuth, email verification            |
| **Shopping Cart**      | Persistent cart with guest identity via cookie               |
| **Contact Form**       | Server-proxied contact form (no client-side API keys leaked) |
| **Email Verification** | Resend verification email island                             |
| **Health Check**       | `/health` endpoint for container orchestration               |
| **Error Pages**        | Custom `_error.tsx` for 404 and 500 handling                 |
| **Test Attributes**    | `data-testid` on login, register, cart, add-to-cart buttons  |
| **SSR API Routing**    | Docker-aware internal API URL for server-side rendering      |
| **Landing Page**       | Hero, features grid, about section, footer                   |

## Getting Started

```bash
tstack create workspace my-shop
cd my-shop/my-shop-store
deno task dev
```

Storefront runs at `http://localhost:5173` (Vite default).

---

## Architecture

### Authentication & Guest Identity

The storefront supports both registered users and guest shoppers.

**`lib/auth.ts`** provides:

- `requireAuth()` -- redirects to `/auth/login` if no session token
- `optionalAuth()` -- returns `{ token, guestId }`, allowing either identity
- `getGuestId()` -- reads the `guest_cart_id` cookie (7-day TTL)
- `GUEST_ID_COOKIE` -- cookie name constant (`guest_cart_id`)

Guest users are identified by a UUID stored in the `guest_cart_id` cookie. This
ID is sent as an `X-Guest-Id` header on API requests, allowing cart persistence
without login.

### API Client (`lib/api.ts`)

Centralized HTTP client with:

- **Per-request client factory**: Each SSR request creates its own API client
  instance. This prevents auth token leakage between concurrent server-side
  requests (security fix in v1.6).
- **`SSR_API_URL`**: Server-side requests use `API_INTERNAL_URL` (for Docker
  internal networking) with fallback to `API_BASE_URL`
- **`isDeno` guard**: Automatically selects internal vs. public URL based on
  runtime environment
- **`AbortSignal.timeout`**: All server-side API calls have configurable
  timeouts
- **Guest methods**: `validateGuestCheckout()`, `createGuestOrder()`,
  `trackOrder()`, `getGuestOrderForPayment()`, `createGuestPaymentOrder()`

### Middleware (`routes/_middleware.ts`)

Runs on every request:

- Resolves user session and cart data in parallel (`Promise.all`)
- Falls back to guest cart via `X-Guest-Id` header when no session exists
- Sets `state.user` and `state.cart` for all downstream routes

---

## Guest Checkout Flow

Full purchase flow without requiring account creation:

1. **Cart** -- Guest adds items via cookie-based cart identity
2. **Checkout** (`/checkout`) -- `optionalAuth()` detects guest vs. registered
   user. Guests enter shipping address and email inline; registered users select
   from saved addresses
3. **Validation** -- Backend validates guest checkout data (address, email)
4. **Order Creation** -- Creates order with `isGuest: true`, `guestEmail`, and
   `guestPhone`
5. **Payment** (`/checkout/payment`) -- Razorpay checkout opens with guest email
   prefilled
6. **Verification** -- `/api/payments/verify` handles both guest and
   authenticated payment verification
7. **Tracking** -- After successful payment, redirects to
   `/track-order?orderNumber=...&email=...&success=1`

---

## Order Tracking

Public page at `/track-order` allows anyone to look up an order by email address
and order number. No login required.

- `GET /track-order?orderNumber=ORD-123&email=test@example.com` -- auto-tracks
  (used for post-checkout redirect)
- `POST /track-order` -- form submission for manual lookups

---

## Proxy Routes

Server-side proxy routes keep API keys and internal URLs out of client-side
code:

| Route                                | Proxies To                                          | Purpose                   |
| ------------------------------------ | --------------------------------------------------- | ------------------------- |
| `POST /api/contact`                  | `POST /contact`                                     | Contact form submission   |
| `POST /api/auth/resend-verification` | `POST /auth/resend-verification`                    | Resend email verification |
| `POST /api/payments/verify`          | `POST /payments/verify` or `/payments/guest/verify` | Payment verification      |

---

## Environment Variables

| Variable           | Required | Description                                        |
| :----------------- | :------- | :------------------------------------------------- |
| `API_BASE_URL`     | Yes      | Public API URL (e.g., `http://localhost:8000/api`) |
| `API_INTERNAL_URL` | No       | Docker internal URL (e.g., `http://api:8000/api`)  |
| `RAZORPAY_KEY_ID`  | Payments | Razorpay public key for checkout                   |

When running in Docker, set `API_INTERNAL_URL` so server-side rendering calls
the API over the internal network instead of going through the public URL.

---

## Error Handling

Custom `_error.tsx` handles 404 (Not Found) and 500 (Server Error) pages with
user-friendly messages and navigation back to the home page.

---

## Project Structure

```text
storefront-starter/
├── components/            # Reusable UI components
│   ├── Navbar.tsx         # Shared navbar (fixed position)
│   ├── Hero.tsx           # Landing page hero
│   ├── Features.tsx       # Feature highlights grid
│   └── Footer.tsx         # Site footer
├── islands/               # Interactive Preact islands
│   ├── CartButton.tsx     # Cart icon with item count
│   ├── ContactForm.tsx    # Contact form with validation
│   └── ResendVerification.tsx  # Email verification resend
├── lib/
│   ├── api.ts             # API client (per-request, SSR-aware, guest methods)
│   └── auth.ts            # Auth helpers (requireAuth, optionalAuth, guest ID)
├── routes/
│   ├── _error.tsx         # 404/500 error pages
│   ├── _middleware.ts     # Session + cart resolution
│   ├── index.tsx          # Landing page
│   ├── track-order.tsx    # Public order tracking
│   ├── cart.tsx           # Shopping cart
│   ├── checkout/
│   │   ├── index.tsx      # Address selection (guest + registered)
│   │   └── payment.tsx    # Razorpay payment
│   ├── auth/
│   │   ├── login.tsx      # Login page
│   │   └── register.tsx   # Registration page
│   ├── api/               # Server-side proxy routes
│   │   ├── contact.ts
│   │   └── auth/resend-verification.ts
│   └── account/           # User account pages
├── static/                # Static assets
├── main.ts                # App entry + /health endpoint
├── deno.json              # Tasks & config
└── vite.config.ts         # Vite + Tailwind
```

---

## Tech Stack

| Layer     | Technology       |
| --------- | ---------------- |
| Framework | Fresh 2.x (Deno) |
| UI        | Preact + Islands |
| Styling   | Tailwind CSS 4   |
| Payments  | Razorpay         |
| Runtime   | Deno 2.x         |
| Build     | Vite             |
| Language  | TypeScript       |

---

## Development

```bash
deno task dev     # Dev server with hot reload
deno task build   # Production build
deno lint         # Lint
deno fmt          # Format
```
