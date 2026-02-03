# TStack Kit Backport TODO

Tracking backport tasks from sc-admin-ui/sc-api to tstack-kit starter templates.

**Related Issues:**

- [#88 - API_INTERNAL_URL for SSR performance](https://github.com/desingh-rajan/tstack-kit/issues/88)
- [#94 - Pagination and filtering system](https://github.com/desingh-rajan/tstack-kit/issues/94)

---

## Completed

- [x] Research and document all backport items
- [x] Create this tracking file
- [x] Comprehensive SC codebase analysis (see SC_BACKPORT_ANALYSIS.md)

### Pagination & Filtering (Issue #94)

- [x] Move `components/admin/Pagination.tsx` to `islands/Pagination.tsx`
  - [x] Add `currentParams` prop for filter preservation
  - [x] Add `getPageUrl()` helper function
  - [x] Change default pageSize from 20 to 10
  - [x] Add first/prev/next/last navigation icons
  - [x] Change to default export

- [x] Update `lib/base-service.ts`
  - [x] Handle nested, flat, and missing pagination formats
  - [x] Support both `pageSize` and `limit` params

- [x] Update `lib/admin/crud-handlers.ts`
  - [x] Pass `url: url.toString()` in list handler return
  - [x] Change default pageSize to 10

- [x] Update all entity list pages to use new Pagination island
  - [x] `routes/admin/users/index.tsx`
  - [x] `routes/admin/orders/index.tsx`
  - [x] `routes/admin/products/index.tsx`
  - [x] `routes/admin/categories/index.tsx`
  - [x] `routes/admin/brands/index.tsx`
  - [x] `routes/admin/variant-options/index.tsx`
  - [x] `routes/admin/product-variants/index.tsx`
  - [x] `routes/admin/product-images/index.tsx`
  - [x] `routes/admin/enquiries/index.tsx`
  - [x] `routes/admin/site-settings/index.tsx`
  - [x] `routes/admin/coupons/index.tsx`

### API_INTERNAL_URL Support (Issue #88)

- [x] Update `packages/admin-ui-starter/lib/api.ts`
  - [x] Add `API_INTERNAL_URL` detection
  - [x] Create `SSR_API_URL` constant
  - [x] Update `createApiClient()` to use `SSR_API_URL`

- [x] Update `packages/storefront-starter/lib/api.ts` (same changes)

### FilterableDataTable & Date Support

- [x] Create `islands/FilterableDataTable.tsx`
  - [x] `FilterDef` interface (text, select, date, daterange)
  - [x] `ColumnDef` interface (string, number, date, currency, badge, link)
  - [x] `TableConfig` interface
  - [x] Debounced text search (300ms)
  - [x] Client-side fetch with loading/error states
  - [x] Integrated pagination
  - [x] Clear filters button

- [x] Create `islands/DatePicker.tsx`
  - [x] Calendar modal with month/year navigation
  - [x] DD/MM/YYYY text input parsing
  - [x] Optional time picker (`includeTime` prop)
  - [x] Size variants (sm for filters, md for forms)

### Utility Libraries

- [x] Create `lib/date.ts`
  - [x] `formatDate()` function
  - [x] `formatDateTime()` function
  - [x] Configurable timezone via `APP_TIMEZONE` env var

- [x] Create `lib/currency.ts`
  - [x] `formatCurrency()` function
  - [x] Configurable currency/locale via env vars

### AWS Email Templates (api-starter)

- [x] Create `templates/shared.ts`
  - [x] `getHeader()` function (accepts appName, storeUrl params)
  - [x] `bodyStyles`, `containerStyles` exports
  - [x] Helper functions for items table, address formatting

- [x] Create new templates:
  - [x] `templates/order-processing.ts`
  - [x] `templates/order-shipped.ts`
  - [x] `templates/order-delivered.ts`
  - [x] `templates/order-cancelled.ts`

- [x] Update `templates/index.ts` with new exports

### Email Service Updates

- [x] Update `EmailServiceConfig` interface
  - [x] Add `storeUrl` property

- [x] Add new methods to `email.service.ts`:
  - [x] `sendOrderProcessingEmail()`
  - [x] `sendOrderShippedEmail()`
  - [x] `sendOrderDeliveredEmail()`
  - [x] `sendOrderCancelledEmail()`

- [x] Create `src/shared/services/notification.service.ts`
  - [x] Lazy initialization
  - [x] Fire-and-forget error handling
  - [x] Singleton export

### CLI Scaffold Updates

- [x] Update `packages/cli/src/templates/admin-ui/list-page.ts`
  - [x] Import from `@/islands/Pagination.tsx`
  - [x] Add `currentParams` prop
  - [x] Extract currentParams from url

### Existing First-Class Provider Support

- [x] **AWS S3** - File upload (`src/lib/s3-uploader.ts`)
- [x] **AWS SES** - Email provider
      (`src/shared/providers/email/ses.provider.ts`)
- [x] **Resend** - Email provider
      (`src/shared/providers/email/resend.provider.ts`)
- [x] **SMTP** - Email provider (`src/shared/providers/email/smtp.provider.ts`)
- [x] **Razorpay** - Payment provider
      (`src/shared/providers/payment/razorpay.provider.ts`)
- [x] **Google OAuth** - Auth provider
      (`src/shared/providers/auth/google.provider.ts`)

---

## Priority 1: Auth Flows (CRITICAL) - COMPLETED

> Password reset is user-facing and currently has frontend pages but NO backend!
> Email verification exists in sc-api but is missing from tstack-kit
> api-starter.

### Forgot/Reset Password Flow

**API (api-starter):**

- [x] Add to `src/auth/auth.service.ts`:
  - [x] `forgotPassword(email)` - Generate token, send email
  - [x] `resetPassword(token, newPassword)` - Validate token, update password
  - [x] Token expiry: 1 hour (use existing `passwordResetToken`,
        `passwordResetExpiry` fields)

- [x] Add to `src/auth/auth.dto.ts`:
  - [x] `ForgotPasswordSchema` - email validation
  - [x] `ResetPasswordSchema` - token, password validation (min 8 chars)
  - [x] `VerifyEmailSchema` - token validation

- [x] Add to `src/auth/auth.controller.ts`:
  - [x] `forgotPassword()` handler
  - [x] `resetPassword()` handler
  - [x] `verifyEmail()` handler
  - [x] `resendVerification()` handler

- [x] Add to `src/auth/auth.route.ts`:
  - [x] `POST /auth/forgot-password` (public)
  - [x] `POST /auth/reset-password` (public)
  - [x] `GET /auth/verify-email?token=` (public)
  - [x] `POST /auth/resend-verification` (requires auth)

**Storefront (storefront-starter):**

- [x] Existing `routes/auth/forgot-password.tsx` works with backend
- [x] Existing `routes/auth/reset-password.tsx` works with backend
- [x] Existing `routes/verify-email.tsx` works with backend

- [x] Update `lib/api.ts`:
  - [x] `verifyEmail(token)` - Fixed to use GET with query param
  - [x] `resendVerification()` method added

---

## Priority 2: Facebook OAuth - COMPLETED

**API (api-starter):**

- [x] Create `src/shared/providers/auth/facebook.provider.ts`
  - [x] Facebook OAuth 2.0 implementation with Graph API v18.0
  - [x] getAuthorizationUrl(), handleCallback(), exchangeCodeForTokens()
  - [x] getUserProfile(), debugToken(), getLongLivedToken()

- [x] Update `src/shared/providers/auth/factory.ts`
  - [x] Add Facebook provider case
  - [x] Add isFacebookAvailable() check

- [x] Update `src/shared/providers/auth/index.ts`
  - [x] Export FacebookProvider

- [x] Update `src/auth/user.model.ts`
  - [x] Add `facebookId` field

- [x] Update `src/auth/oauth.service.ts`
  - [x] Add getFacebookAuthUrl() method
  - [x] Add handleFacebookCallback() method
  - [x] Update findUserByProviderId() for Facebook
  - [x] Update linkOAuthAccount() for Facebook
  - [x] Update createUserFromOAuth() for Facebook

- [x] Update `src/auth/oauth.controller.ts`
  - [x] Add facebookAuth() handler
  - [x] Add facebookCallback() handler
  - [x] Add facebookToken() handler
  - [x] Add getFacebookState() handler

- [x] Update `src/auth/oauth.route.ts`
  - [x] GET /auth/facebook - Initiate OAuth flow
  - [x] GET /auth/facebook/callback - Handle callback
  - [x] POST /auth/facebook/token - Token exchange for SPA
  - [x] GET /auth/facebook/state - Get state for SPA

- [x] Update `.env.example`
  - [x] Add FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK_URL

**Storefront (storefront-starter):**

- [x] Create `routes/api/auth/facebook/index.ts`
  - [x] Redirect to API's Facebook OAuth endpoint

- [x] Create `routes/api/auth/facebook/callback.ts`
  - [x] Receive token from API and set auth cookie

- [x] Update `routes/auth/login.tsx`
  - [x] Add Facebook OAuth button

- [x] Update `routes/auth/register.tsx`
  - [x] Add Facebook OAuth button

---

## Priority 3: Legal/Policy Pages - COMPLETED

**Storefront (storefront-starter):**

- [x] Update `components/Footer.tsx`
  - [x] Add links to privacy, terms, refund, shipping policies

- [x] Create policy pages:
  - [x] `routes/policies/privacy.tsx` - Privacy Policy
  - [x] `routes/policies/terms.tsx` - Terms of Service
  - [x] `routes/policies/refund.tsx` - Refund and Return Policy
  - [x] `routes/policies/shipping.tsx` - Shipping Policy

---

## Priority 4: Critical Bug Fixes from Production - COMPLETED

### N+1 Query Fixes

- [x] Fix N+1 in cart queries
  - [x] Batch product lookups in `cart.service.ts` getCartItems()
  - [x] Use `inArray()` instead of loop queries

- [x] Batch queries in order creation
  - [x] Single query for all products in `order.service.ts` createOrder()
  - [x] Single query for all variants
  - [x] Single query for all images

- [x] Fix N+1 in validateCheckout
  - [x] Batch product and variant lookups in `order.service.ts`

### Database & Performance

- [x] Add postgres connection pool limits
  - [x] Update `src/config/database.ts`
  - [x] Add `max: 20` pool config
  - [x] Add `idle_timeout: 30` seconds
  - [x] Add `connect_timeout: 10` seconds

- [x] Order number collision handling
  - [x] Use `MAX(order_number)` instead of count
  - [x] Pattern matching for today's orders

### Deno 2.x Compatibility

- [x] Fix healthcheck in Dockerfile
  - [x] Remove `--allow-net` flag from deno eval (not needed in Deno 2.x)

### 504 Timeout Fixes (Internal Docker URLs)

- [ ] Admin UI proxy routes (`18a0220`, `2c5d35f`, `56f31a4`)
  - [x] crud-handlers.ts (completed)
  - [ ] product-images routes
  - [ ] order service
  - [ ] payment service

- [ ] Store proxy routes (`ea4cae0`)
  - [ ] cart API proxy
  - [ ] checkout API proxy

### Double-Submit Protection (Store)

- [ ] Add to checkout (`2bbf8ff`)
  - [ ] Increase API timeout to 30s
  - [ ] Disable submit button during API call
  - [ ] Show "Processing..." loading state
  - [ ] Prevent form re-submission

---

## Priority 5: Admin UI Enhancements

### OrderStatusUpdate Island

- [ ] Create `islands/OrderStatusUpdate.tsx`
  - [ ] Radio button status selection
  - [ ] Status descriptions and colors
  - [ ] Admin notes textarea
  - [ ] Confirmation dialog before change

- [ ] Update `routes/admin/orders/[id].tsx` to use island

### Order Detail Improvements

- [ ] Fix shipping address display (`89feb40`)
- [ ] Add customer phone (`1a547e9`)
- [ ] Add customer email to order list (`fb731e3`)

### FeatureFlags Sync

- [ ] Update admin types to match backend (`d757c80`)
- [ ] Add missing flags: `enableRazorpay`, `enableCOD`, `enableSelfPickup`

### Product Images in API

- [ ] Add images array to `getBySlug` response (`a5fa5dd`)
- [ ] Add primary image URL to `getProducts` response

### System Settings Merge Defaults

- [ ] Add `deepMerge` helper (`903ae8a`)
- [ ] Merge schema defaults on retrieval (`a28cfcb`)
- [ ] Use custom controller for admin routes

---

## Priority 6: Store UI/UX Enhancements

### Payment Method Feature Flags

- [ ] Add to feature_flags schema (`83248dd`):
  - [ ] `enableRazorpay`
  - [ ] `enableCOD`
  - [ ] `enableSelfPickup`

- [ ] Create `islands/PaymentMethodSelector.tsx` (`f5dcb61`)

### UI/UX Improvements

- [ ] Floating cart sidebar (`2be2914`)
- [ ] Redirect unauthenticated to login (`34c6198`)
- [ ] Navbar standardization (`0881190`)
- [ ] Shipping threshold/cost config (`ff2acd7`)

---

## Priority 7: Documentation & Environment

### Environment Files

- [ ] Update `packages/admin-ui-starter/.env.example`
  - [ ] Add `API_INTERNAL_URL`
  - [ ] Add `APP_TIMEZONE`

- [ ] Update `packages/storefront-starter/.env.example`
  - [ ] Add `API_INTERNAL_URL`
  - [ ] Add `COMPANY_NAME`
  - [ ] Add `SUPPORT_EMAIL`

- [ ] Update `packages/api-starter/.env.example`
  - [ ] Add `STOREFRONT_URL`
  - [ ] Add `APP_TIMEZONE`
  - [ ] Add Facebook OAuth vars
  - [ ] Add SNS vars

### Site Settings Integration

- [ ] Add to site_settings table/config:
  - [ ] `email_logo_url` - Logo for email headers
  - [ ] `store_name` - Brand name for emails
  - [ ] `timezone` - App timezone (fallback if env not set)
  - [ ] `currency_code` - Default currency (INR, USD, etc.)
  - [ ] `currency_locale` - Locale for formatting (en-IN, en-US)

- [ ] Create settings helper in api-starter
  - [ ] `getSettingValue(key, defaultValue)`
  - [ ] Cache settings on startup

---

## Priority 8: Infrastructure (tstack create infra)

> Premium feature command for production-ready deployment setup. Adds Kamal
> configs, CI/CD, Docker registry support to existing projects.

### CLI Command Implementation

- [ ] Create `packages/cli/src/commands/infra.ts`
  - [ ] Detect project type (api/admin-ui/store)
  - [ ] Interactive prompts for configuration
  - [ ] Generate all infrastructure files

- [ ] Prompts:
  - [ ] Docker registry: GHCR (default), Docker Hub, ECR
  - [ ] Domain name(s)
  - [ ] SSH user for deployment
  - [ ] Enable staging environment?
  - [ ] Database type (Postgres accessory or external)

### Kamal Deploy Configs

- [ ] Create `config/deploy.yml` template
  - [ ] Service name from project
  - [ ] Health check endpoints (`/health`)
  - [ ] Environment variables mapping
  - [ ] Proxy path prefix support (for API behind reverse proxy)
  - [ ] Memory limits (400m/500m default)
  - [ ] SSL via proxy or direct

- [ ] Create `config/deploy.staging.yml` template
  - [ ] Staging-specific server
  - [ ] Staging domain
  - [ ] Lower resource limits

### Docker Registry Support

- [ ] **GHCR** (default)
  - [ ] `ghcr.io/<username>/<project>`
  - [ ] Use `GITHUB_TOKEN` for auth

- [ ] **Docker Hub**
  - [ ] `docker.io/<username>/<project>`
  - [ ] `DOCKER_USERNAME`, `DOCKER_PASSWORD`

- [ ] **AWS ECR**
  - [ ] `<account>.dkr.ecr.<region>.amazonaws.com/<project>`
  - [ ] AWS credentials for auth

### Secrets Management

- [ ] Create `.kamal/secrets` template
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  - [ ] `EMAIL_FROM`, `RESEND_API_KEY` or `SES_*`
  - [ ] `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
  - [ ] `KAMAL_REGISTRY_PASSWORD`

- [ ] Create `.kamal/secrets.staging` template

### GitHub Actions CI/CD

- [ ] Create `.github/workflows/deploy.yml`
  - [ ] Trigger: push to `main` (production), `staging` (staging)
  - [ ] Ruby setup for Kamal
  - [ ] SSH key from secrets
  - [ ] Environment detection
  - [ ] Build and deploy steps

### Dockerfile Templates

- [ ] API Dockerfile
  - [ ] `denoland/deno:alpine-2.x` base
  - [ ] Healthcheck fix for Deno 2.x (remove `--allow-net`)
  - [ ] Cache dependencies layer
  - [ ] `/health` endpoint

- [ ] Admin UI / Store Dockerfile
  - [ ] Multi-stage build (build + serve)
  - [ ] Vite build step
  - [ ] Serve `_fresh/server.js`

### Documentation

- [ ] Create `docs/deployment.md`
  - [ ] Kamal setup guide
  - [ ] Server requirements
  - [ ] CI/CD workflow explanation
  - [ ] Secrets management
  - [ ] Troubleshooting (proxy conflicts, SSH issues, health checks)

---

## Notes

- **Timezone Strategy**: Use `APP_TIMEZONE` env var with fallback to site
  settings, then UTC
- **Branding Strategy**: Email templates use `getHeader(siteSettings)` to pull
  logo/name dynamically
- **Filter Persistence**: FilterableDataTable persists filters in URL query
  params for shareable links
- **Auth Token Expiry**: 7 days for JWT tokens, stored in `auth_tokens` table
- **Password Reset Token Expiry**: 1 hour
- **Email Verification Token Expiry**: 24 hours

---

## First-Class Provider Summary

| Provider       | Type            | Status     | Location                                            |
| -------------- | --------------- | ---------- | --------------------------------------------------- |
| AWS S3         | Storage         | Done       | `src/lib/s3-uploader.ts`                            |
| AWS SES        | Email           | Done       | `src/shared/providers/email/ses.provider.ts`        |
| AWS SNS        | SMS             | Skipped    | Future: `src/shared/providers/sms/sns.provider.ts`  |
| Resend         | Email           | Done       | `src/shared/providers/email/resend.provider.ts`     |
| SMTP           | Email           | Done       | `src/shared/providers/email/smtp.provider.ts`       |
| Razorpay       | Payment         | Done       | `src/shared/providers/payment/razorpay.provider.ts` |
| Google OAuth   | Auth            | Done       | `src/shared/providers/auth/google.provider.ts`      |
| Facebook OAuth | Auth            | Done       | `src/shared/providers/auth/facebook.provider.ts`    |
| GHCR           | Docker Registry | Priority 8 | CLI `tstack create infra`                           |
| Docker Hub     | Docker Registry | Priority 8 | CLI `tstack create infra`                           |
| AWS ECR        | Docker Registry | Priority 8 | CLI `tstack create infra`                           |

## Reference: SC-Project Commit Analysis

See [SC_BACKPORT_ANALYSIS.md](./SC_BACKPORT_ANALYSIS.md) for full
commit-by-commit analysis of sc-api, sc-admin-ui, and sc-store repositories.
