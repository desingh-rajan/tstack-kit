# SC Production App Backport Analysis

Analysis of commits from sc-api, sc-admin-ui, and sc-store to identify bug fixes
and features that should be backported to tstack-kit starter templates.

---

## Summary

| Category             | Total | Covered | Remaining |
| -------------------- | ----- | ------- | --------- |
| Bug Fixes (API)      | 15    | 3       | 12        |
| Features (API)       | 12    | 4       | 8         |
| Bug Fixes (Admin UI) | 8     | 2       | 6         |
| Features (Admin UI)  | 8     | 4       | 4         |
| Bug Fixes (Store)    | 7     | 1       | 6         |
| Features (Store)     | 8     | 0       | 8         |
| Infrastructure       | 6     | 0       | 6         |

---

## SC-API Commits Analysis

### Bug Fixes

| Commit    | Description                                               | Status   | Priority |
| --------- | --------------------------------------------------------- | -------- | -------- |
| `a0d55b7` | Use STOREFRONT_URL for email verification links           | NOT DONE | HIGH     |
| `9bb490d` | Fix order generation regex and postgres health check      | NOT DONE | MEDIUM   |
| `6e4827f` | Fix N+1 cart queries, increase DB pool to 20              | NOT DONE | HIGH     |
| `c879f98` | Optimize cart queries (N+1)                               | NOT DONE | HIGH     |
| `8acfb56` | Fix N+1 queries in validateCheckout + email type errors   | NOT DONE | HIGH     |
| `27d8030` | Add postgres connection pool limits (prevent memory leak) | NOT DONE | HIGH     |
| `c1666cc` | Batch queries in order creation (N+1 fix)                 | NOT DONE | HIGH     |
| `ac5f9af` | Use MAX for order number + recursive retry on collision   | NOT DONE | HIGH     |
| `8c94931` | Fix duplicate variable name in order routes               | NOT DONE | LOW      |
| `619c90b` | Simplify order numbering + auto-update COD payment status | NOT DONE | MEDIUM   |
| `0bca377` | Add network-alias for internal Docker communication       | NOT DONE | LOW      |
| `fbd8d43` | Add APP_URL and STOREFRONT_URL for OAuth redirect         | NOT DONE | MEDIUM   |
| `469f1e5` | Deno 2.x healthcheck fix (remove --allow-net)             | NOT DONE | HIGH     |
| `a5fa5dd` | Add images to getBySlug and getProducts API responses     | NOT DONE | HIGH     |
| `a28cfcb` | Use custom controller for admin site_settings routes      | NOT DONE | MEDIUM   |

### Features

| Commit               | Description                                              | Status   | Priority |
| -------------------- | -------------------------------------------------------- | -------- | -------- |
| `b930348`            | Email verification flow + password validation            | NOT DONE | HIGH     |
| `eb5d2a5`            | Update order number format to SC-YYMMNNNN                | NOT DONE | LOW      |
| `ee6cac9`            | Standardize pagination (pageSize + limit params)         | NOT DONE | MEDIUM   |
| `56c3cb1`            | Email templates with order items                         | DONE     | -        |
| `fb731e3`            | Customer info (email, phone) in admin order APIs         | NOT DONE | MEDIUM   |
| `903ae8a`            | Merge defaults for system settings on retrieval          | NOT DONE | MEDIUM   |
| `83248dd`            | Payment method feature flags (Razorpay, COD, SelfPickup) | NOT DONE | HIGH     |
| `d02029a`            | Email branding, logo URL, contact info                   | PARTIAL  | LOW      |
| `0b5b54e`            | Email configuration in deploy.yml                        | NOT DONE | LOW      |
| `e1c3b49`            | Remove logo image from shared header                     | DONE     | -        |
| Kamal configs        | deploy.yml, secrets, CI/CD workflow                      | NOT DONE | HIGH     |
| Notification Service | NotificationService with lazy init                       | DONE     | -        |

---

## SC-ADMIN-UI Commits Analysis

### Bug Fixes

| Commit    | Description                                          | Status   | Priority |
| --------- | ---------------------------------------------------- | -------- | -------- |
| `70bb8bb` | Set timezone to Asia/Kolkata + fix type errors       | PARTIAL  | MEDIUM   |
| `fdf8cf4` | Fix Fresh context type mismatch in order handler     | NOT DONE | MEDIUM   |
| `89feb40` | Fix shipping address display in order detail         | NOT DONE | MEDIUM   |
| `2c5d35f` | Use internal Docker URL in payment service (504 fix) | NOT DONE | HIGH     |
| `56f31a4` | Use internal Docker URL in order service (504 fix)   | NOT DONE | HIGH     |
| `18a0220` | Use API_INTERNAL_URL in proxy routes (504 fix)       | DONE     | -        |
| `cc4a5c0` | Use SSR_API_URL in createApiClient                   | DONE     | -        |
| `5895e91` | Use internal Docker network for SSR API calls        | DONE     | -        |

### Features

| Commit    | Description                                       | Status   | Priority |
| --------- | ------------------------------------------------- | -------- | -------- |
| `d9d024d` | DatePicker island + orders admin UI improvements  | DONE     | -        |
| `614691e` | Pagination island + FilterableDataTable           | DONE     | -        |
| `a680edf` | Formatting helpers (date, currency)               | DONE     | -        |
| `2442024` | OrderStatusUpdate island with confirmation dialog | NOT DONE | MEDIUM   |
| `1a547e9` | Phone in order user type                          | NOT DONE | LOW      |
| `d757c80` | Sync FeatureFlags with backend                    | NOT DONE | MEDIUM   |
| `dc7d438` | Improve card visibility (shadows, borders)        | NOT DONE | LOW      |
| `e925908` | Redirect to orders page after login               | NOT DONE | LOW      |

---

## SC-STORE Commits Analysis

### Bug Fixes

| Commit    | Description                                            | Status   | Priority |
| --------- | ------------------------------------------------------ | -------- | -------- |
| `2bbf8ff` | Increase API timeout to 30s + double-submit protection | NOT DONE | HIGH     |
| `0bd5715` | Server-side proxy for resend verification (CORS fix)   | NOT DONE | HIGH     |
| `f52f3d3` | Set timezone to Asia/Kolkata                           | NOT DONE | MEDIUM   |
| `ff2acd7` | Update shipping threshold (5000) and cost (100)        | NOT DONE | MEDIUM   |
| `b3cb47f` | Resolve Cart type compatibility issues                 | NOT DONE | MEDIUM   |
| `ea4cae0` | Internal Docker URL for cart API proxy (504 fix)       | NOT DONE | HIGH     |
| `29bde21` | API timeout + parallel middleware calls                | NOT DONE | MEDIUM   |

### Features

| Commit    | Description                                           | Status   | Priority |
| --------- | ----------------------------------------------------- | -------- | -------- |
| `f66ea2b` | Email verification page + resend functionality        | NOT DONE | HIGH     |
| `1bc6f05` | Date and currency formatting helpers                  | PARTIAL  | -        |
| `b0c5a4f` | Shipping, Refund, Privacy, Terms policy pages         | NOT DONE | MEDIUM   |
| `f268a8c` | Legal disclaimer links on Login/Register              | NOT DONE | LOW      |
| `0881190` | Standardize Navbar, improve checkout UI/UX            | NOT DONE | MEDIUM   |
| `2be2914` | Floating cart sidebar + OAuth port handling           | NOT DONE | MEDIUM   |
| `34c6198` | Redirect unauthenticated to login when adding to cart | NOT DONE | MEDIUM   |
| `f5dcb61` | PaymentMethodSelector island with feature flags       | NOT DONE | HIGH     |
| `626eddd` | Maintenance banner + image modal                      | NOT DONE | LOW      |

---

## Infrastructure (Kamal + CI/CD)

| Component                      | Description                     | Status   | Priority |
| ------------------------------ | ------------------------------- | -------- | -------- |
| `config/deploy.yml`            | Kamal production deploy config  | NOT DONE | HIGH     |
| `config/deploy.staging.yml`    | Kamal staging deploy config     | NOT DONE | HIGH     |
| `.kamal/secrets`               | Production secrets template     | NOT DONE | HIGH     |
| `.kamal/secrets.staging`       | Staging secrets template        | NOT DONE | HIGH     |
| `.github/workflows/deploy.yml` | CI/CD workflow for Kamal        | NOT DONE | HIGH     |
| Docs                           | CI/CD guide and troubleshooting | NOT DONE | MEDIUM   |

---

## Priority Backport List (Recommended Order)

### Phase 1: Critical Bug Fixes

1. N+1 query fixes (cart, order creation, validateCheckout)
2. Postgres connection pool limits
3. Order number collision handling (MAX + retry)
4. Deno 2.x healthcheck fix
5. 504 timeout fixes (internal Docker network URLs)
6. Double-submit protection

### Phase 2: Core Features

1. Email verification flow (API + Store)
2. STOREFRONT_URL for email links
3. Product images in getBySlug/getProducts
4. Payment method feature flags
5. Merge defaults for system settings
6. Pagination standardization (pageSize + limit)

### Phase 3: Admin UI Enhancements

1. OrderStatusUpdate island
2. Order detail shipping address fix
3. Customer info (email, phone) in admin
4. FeatureFlags sync with backend

### Phase 4: Store Enhancements

1. Policy pages (Shipping, Refund, Privacy, Terms)
2. PaymentMethodSelector island
3. Floating cart sidebar
4. Redirect unauthenticated users

### Phase 5: Infrastructure (tstack create infra)

1. Kamal deploy configs (production + staging)
2. Secrets templates
3. GitHub CI/CD workflow
4. Documentation

---

## What's Already Done (Previous Session)

- [x] Pagination island (URL-based navigation)
- [x] FilterableDataTable island (client-side filtering)
- [x] DatePicker island
- [x] Date utilities (formatDateTime, formatDate, formatRelativeTime)
- [x] Currency utilities (formatCurrency, formatPrice)
- [x] API_INTERNAL_URL support in api.ts, base-service.ts, crud-handlers.ts
- [x] All entity list pages using Pagination island
- [x] Email templates (order-processing, shipped, delivered, cancelled)
- [x] NotificationService with lazy init
- [x] CLI template updates for list-page.ts
- [x] Tests for new email templates and NotificationService
