# TStack Kit Backport TODO

Tracking backport tasks from sc-admin-ui/sc-api to tstack-kit starter templates.

**Related Issues:**

- [#88 - API_INTERNAL_URL for SSR performance](https://github.com/desingh-rajan/tstack-kit/issues/88)
- [#94 - Pagination and filtering system](https://github.com/desingh-rajan/tstack-kit/issues/94)

---

## Completed

- [x] Research and document all backport items
- [x] Create this tracking file

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

---

## Priority 1: Remaining Critical Items

### Documentation

- [ ] Document in `.env.example` files
  - [ ] `packages/admin-ui-starter/.env.example` - add API_INTERNAL_URL
  - [ ] `packages/storefront-starter/.env.example` - add API_INTERNAL_URL
  - [ ] `packages/api-starter/.env.example` - add STORE_URL, APP_TIMEZONE

- [ ] Add Kamal deploy config examples in docs

---

## Priority 2: Order Status Island

### OrderStatusUpdate Island

- [ ] Create `islands/OrderStatusUpdate.tsx`
  - [ ] Radio button status selection
  - [ ] Status descriptions and colors
  - [ ] Admin notes textarea
  - [ ] Confirmation before status change

- [ ] Update `routes/admin/orders/[id].tsx` to use island

---

## Priority 3: Entity Filter Configurations

- [ ] Orders filters (status, daterange, customer email)
- [ ] Products filters (name, category, status)
- [ ] Users filters (email, phone, role)

### API Proxy Routes (for FilterableDataTable AJAX)

- [ ] Create `routes/api/admin/orders.tsx`
- [ ] Create `routes/api/admin/products.tsx`
- [ ] Create `routes/api/admin/users.tsx`

---

## Priority 4: Site Settings Integration

### Configurable Settings

- [ ] Add to site_settings table / config:
  - [ ] `email_logo_url` - Logo for email headers
  - [ ] `store_name` - Brand name for emails
  - [ ] `timezone` - App timezone (fallback if env not set)
  - [ ] `currency_code` - Default currency (INR, USD, etc.)
  - [ ] `currency_locale` - Locale for formatting (en-IN, en-US)

- [ ] Create settings helper in api-starter
  - [ ] `getSettingValue(key, defaultValue)`
  - [ ] Cache settings on startup

---

## Notes

- **Timezone Strategy**: Use `APP_TIMEZONE` env var with fallback to site
  settings, then UTC
- **Branding Strategy**: Email templates use `getHeader(siteSettings)` to pull
  logo/name dynamically
- **Filter Persistence**: FilterableDataTable persists filters in URL query
  params for shareable links
