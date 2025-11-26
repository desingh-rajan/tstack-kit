# Plan: Contact Form with Email & Job Queue Support

This plan addresses **Issue #11** (Contact/Enquiry Form Module) while also implementing the foundational infrastructure for **email service** (Issue #10) and **background jobs** (Issue #9) to support Rails-like `deliver_later` patterns.

## Overview

We're building three interconnected systems:

1. **Email Service** - Provider-based abstraction supporting SMTP (default), Resend, SendGrid, SES
2. **Job Queue System** - Redis-backed queue for async operations with Rails-like `deliver_later` API
3. **Contact/Enquiry Form** - Production-ready module with anti-spam, admin dashboard, and email notifications

## Implementation Steps

### 1. Build Email Service Infrastructure

**Location:** `packages/starter/src/shared/services/email/`

**Files to create:**

- **`types.ts`** - Core interfaces and types

  - `EmailOptions` interface (from, to, subject, html, text, replyTo, attachments)
  - `EmailResponse` interface (success, messageId, error)
  - `EmailProvider` abstract class with `send()` and `isConfigured()` methods

- **`providers/smtp.provider.ts`** - Default SMTP implementation

  - Use `https://deno.land/x/smtp@v0.7.0/mod.ts`
  - Read env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`
  - Support both TLS and non-TLS connections
  - Implement connection pooling for performance

- **`providers/resend.provider.ts`** - Modern email API (optional)

  - Use `https://esm.sh/resend@3.0.0`
  - Read env var: `RESEND_API_KEY`
  - Simple REST API integration

- **`providers/sendgrid.provider.ts`** - Enterprise provider (optional)

  - Read env var: `SENDGRID_API_KEY`
  - Direct fetch API implementation to SendGrid v3 API

- **`providers/ses.provider.ts`** - AWS SES (optional, placeholder for now)

  - Read env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
  - TODO: Implement AWS v4 signing

- **`email.service.ts`** - Main service facade

  - Auto-select provider based on `EMAIL_PROVIDER` env var (smtp|resend|sendgrid|ses)
  - Helper methods: `send()`, `sendHTML()`, `sendText()`
  - Export singleton instance: `emailService`

- **`templates/`** - Email templates
  - `welcome.template.ts` - Welcome email for new users
  - `contact-admin-notification.template.ts` - Admin notification for new enquiries
  - `contact-confirmation.template.ts` - Auto-reply to enquiry submitters
  - Template functions return `{ subject, html, text }`

**Dependencies to add:**

```json
{
  "imports": {
    "@std/smtp": "https://deno.land/x/smtp@v0.7.0/mod.ts",
    "resend": "https://esm.sh/resend@3.0.0"
  }
}
```

---

### 2. Build Job Queue System

**Location:** `packages/starter/src/shared/services/jobs/`

**Files to create:**

- **`queue.service.ts`** - Redis-backed queue

  - `enqueue(queue: string, job: any)` - Add job to queue
  - `dequeue(queue: string)` - Pop job from queue
  - `process(queue: string, handler: Function)` - Worker loop with error handling
  - Support job priorities, retry logic, and dead letter queue

- **`worker.ts`** - Background job processor

  - Start worker processes for different queues (emails, exports, notifications)
  - Graceful shutdown handling
  - Job retry with exponential backoff

- **`jobs/email.job.ts`** - Email-specific job handler
  - `EmailJob` class with `perform()` method
  - Integrate with email service
  - Implement retry logic for failed sends
  - Rails-like API: `EmailJob.deliver_later()` vs `EmailJob.deliver_now()`

**Redis configuration:**

Update `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

**Dependencies to add:**

```json
{
  "imports": {
    "redis": "https://deno.land/x/redis@v0.32.3/mod.ts"
  }
}
```

**Configuration in `src/config/redis.ts`:**

```typescript
import { connect } from "redis";

export const redis = await connect({
  hostname: Deno.env.get("REDIS_HOST") || "localhost",
  port: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
  password: Deno.env.get("REDIS_PASSWORD"),
});
```

---

### 3. Implement Contact/Enquiry Form Module

**Location:** `packages/starter/src/entities/enquiries/`

**Files to create:**

- **`enquiry.model.ts`** - Drizzle schema

  ```typescript
  export const enquiries = pgTable("enquiries", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Contact Details
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    company: varchar("company", { length: 255 }),

    // Message Details
    subject: varchar("subject", { length: 255 }),
    message: text("message").notNull(),

    // Status tracking
    status: varchar("status", { length: 20 }).default("new").notNull(),
    // Status: 'new' | 'read' | 'replied' | 'spam' | 'archived'

    // Anti-spam & Tracking
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    referrer: varchar("referrer", { length: 500 }),

    // Admin Notes
    adminNotes: text("admin_notes"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    readAt: timestamp("read_at"),
    repliedAt: timestamp("replied_at"),
  });
  ```

- **`enquiry.dto.ts`** - Zod validation

  - `createEnquirySchema` - Public submission validation
  - `updateStatusSchema` - Admin status updates
  - `updateNotesSchema` - Admin notes
  - Honeypot field: `website` (should be empty)

- **`enquiry.service.ts`** - Business logic

  - `create()` - Save enquiry, enqueue admin email, optionally enqueue auto-reply
  - `list()` - Admin listing with filters (status, date range), pagination, sorting
  - `getById()` - Single enquiry details
  - `updateStatus()` - Change status (auto-update readAt, repliedAt timestamps)
  - `updateNotes()` - Add admin notes
  - `markAsSpam()` - Anti-spam action
  - `delete()` - Hard delete (admin only)

- **`enquiry.controller.ts`** - Request handlers

  - `create()` - Public endpoint, extract IP/userAgent/referrer from request
  - `list()` - Admin only
  - `getById()` - Admin only
  - `updateStatus()` - Admin only
  - `updateNotes()` - Admin only
  - `delete()` - Admin only

- **`enquiry.route.ts`** - Public routes

  ```typescript
  import { Hono } from "hono";
  import { EnquiryController } from "./enquiry.controller.ts";
  import { rateLimit } from "@/shared/middleware/rateLimit.ts";

  const router = new Hono();

  // Public endpoint - no auth, with rate limiting
  router.post(
    "/api/contact",
    rateLimit({ windowMs: 600000, maxRequests: 3 }), // 3 per 10 min
    EnquiryController.create
  );

  export default router;
  ```

- **`enquiry.admin.route.ts`** - Admin routes

  ```typescript
  import { Hono } from "hono";
  import { EnquiryController } from "./enquiry.controller.ts";
  import { requireAuth, requireRole } from "@/shared/middleware/auth.ts";

  const router = new Hono();

  router.use("*", requireAuth, requireRole(["superadmin", "admin"]));

  router.get("/ts-admin/enquiries", EnquiryController.list);
  router.get("/ts-admin/enquiries/:id", EnquiryController.getById);
  router.patch(
    "/ts-admin/enquiries/:id/status",
    EnquiryController.updateStatus
  );
  router.patch("/ts-admin/enquiries/:id/notes", EnquiryController.updateNotes);
  router.delete("/ts-admin/enquiries/:id", EnquiryController.delete);

  export default router;
  ```

- **`enquiry.test.ts`** - Test suite
  - Test public submission (happy path)
  - Test validation errors
  - Test rate limiting
  - Test honeypot detection
  - Test admin CRUD operations
  - Mock email service

---

### 4. Add Anti-Spam & Rate Limiting

**Location:** `packages/starter/src/shared/middleware/`

**Files to create:**

- **`rateLimit.ts`** - Redis-backed rate limiter

  ```typescript
  import { Context, Next } from "hono";
  import { redis } from "@/config/redis.ts";

  export const rateLimit = (options: {
    windowMs: number;
    maxRequests: number;
  }) => {
    return async (c: Context, next: Next) => {
      const ip =
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        "unknown";
      const key = `rate_limit:${ip}:${c.req.path}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(options.windowMs / 1000));
      }

      if (current > options.maxRequests) {
        return c.json(
          {
            success: false,
            error: "Too many requests. Please try again later.",
          },
          429
        );
      }

      await next();
    };
  };
  ```

**Anti-spam features in `enquiry.service.ts`:**

- Track IP address, user agent, referrer
- Honeypot field validation (if `website` field is filled, reject as bot)
- Time-based validation (if form submitted too fast, likely a bot)
- Admin spam marking feature

---

### 5. Update Starter Kit Configuration

**Environment Variables** - Add to `.env.example`:

```bash
# Email Configuration
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@yourdomain.com
EMAIL_ASYNC=true

# SMTP Settings (default provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Optional: Resend
# EMAIL_PROVIDER=resend
# RESEND_API_KEY=re_xxxxxxxxxx

# Optional: SendGrid
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=SG.xxxxxxxxxx

# Optional: AWS SES
# EMAIL_PROVIDER=ses
# AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxx
# AWS_SECRET_ACCESS_KEY=xxxxxxxxxx
# AWS_REGION=us-east-1

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Contact Form
ADMIN_EMAIL=admin@yourdomain.com
ENQUIRY_AUTO_REPLY=true
ENQUIRY_RATE_LIMIT_WINDOW=600000
ENQUIRY_RATE_LIMIT_MAX=3
```

**Database Migration** - Create migration for enquiries table:

```bash
deno task migrate:generate
```

**Update `deno.json`:**

```json
{
  "imports": {
    "@std/smtp": "https://deno.land/x/smtp@v0.7.0/mod.ts",
    "redis": "https://deno.land/x/redis@v0.32.3/mod.ts",
    "resend": "https://esm.sh/resend@3.0.0"
  },
  "tasks": {
    "worker": "deno run --allow-all src/shared/services/jobs/worker.ts"
  }
}
```

**Update `docker-compose.yml`:**

```yaml
services:
  app:
    depends_on:
      - db
      - redis
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379

  db:
    # ... existing postgres config

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

**Update README.md:**

- Add section on email configuration
- Document contact form API endpoints
- Explain job queue usage
- Show examples of `deliver_later()` vs `deliver_now()`

---

### 6. Create CLI Scaffolding Support

**Location:** `packages/cli/src/commands/create.ts`

**Add CLI flags:**

```typescript
// Update parseArgs configuration
const args = parseArgs(Deno.args, {
  boolean: [
    "help",
    "version",
    "force",
    "latest",
    "with-email",
    "with-jobs",
    "with-contact-form",
  ],
  string: ["dir", "email-provider"],
  alias: {
    h: "help",
    v: "version",
    f: "force",
    d: "dir",
  },
});
```

**Examples:**

```bash
# Create project with email support (SMTP default)
tstack create my-api --with-email

# Create with specific email provider
tstack create my-api --with-email --email-provider=resend

# Create with job queue support
tstack create my-api --with-jobs

# Create with contact form (includes email + jobs)
tstack create my-api --with-contact-form

# All-in-one
tstack create my-api --with-email --with-jobs --with-contact-form
```

**Update help text:**

```typescript
Logger.code(
  "--with-email              Add email service support (default: SMTP)"
);
Logger.code(
  "--email-provider <name>   Email provider (smtp|resend|sendgrid|ses)"
);
Logger.code("--with-jobs               Add Redis job queue support");
Logger.code(
  "--with-contact-form       Add contact form with email notifications"
);
```

**Conditional file generation:**

- If `--with-email`: Copy email service files, add dependencies, update env vars
- If `--with-jobs`: Copy job queue files, add Redis to docker-compose, add dependencies
- If `--with-contact-form`: Copy enquiry entity files, add rate limiting middleware

---

## Discussion Points

### 1. Out-of-the-box vs Optional?

**Option A: Ship Everything by Default** (Recommended)

- Contact form is "must-have for most client projects" (Issue #11)
- Email service is essential for any real application
- Job queue is optional, but having the infrastructure ready is valuable
- **Pros:** Batteries-included, faster time-to-first-feature
- **Cons:** Slightly heavier initial bundle, requires Redis in docker-compose

**Option B: Opt-in via CLI Flags**

- Keep starter minimal by default
- Let developers add features as needed
- **Pros:** Lightweight starter, no Redis requirement by default
- **Cons:** More setup steps, inconsistent project structures

**Recommendation:** Ship email + contact form by default, make job queue optional via `--with-jobs` flag. This balances "batteries included" with "minimal footprint".

### 2. Email Provider Strategy

**Default: SMTP** (zero external dependencies, works with any SMTP server)

- Easy development setup with Gmail SMTP (500 emails/day free)
- No API keys needed for local development
- Works offline with local SMTP server

**Production: External Providers**

- Switch via `EMAIL_PROVIDER` env var (no code changes)
- Resend: 3,000 emails/month free (best DX)
- SendGrid: 100 emails/day free (enterprise standard)
- AWS SES: 62,000 emails/month free (if hosted on AWS)

**Recommendation:** Default to SMTP, document Gmail setup for quick start, provide clear migration path to external providers for production.

### 3. Job Queue: Optional or Always On?

**Option A: Always Include Redis + Job Queue**

- Enables async email sending by default
- Ready for background tasks (image processing, exports, etc.)
- Modern best practice for production apps
- **Cons:** Requires Redis running (docker-compose handles this)

**Option B: Make Job Queue Optional**

- Keep starter minimal, add with `--with-jobs` flag
- Use synchronous email sending by default
- Add job queue when needed
- **Cons:** Two different email patterns (sync vs async)

**Recommendation:** Include Redis in docker-compose by default, but make job queue **optional via env flag**: `EMAIL_ASYNC=true/false`. This allows:

- Development: Synchronous emails (no Redis required)
- Production: Async emails via job queue (Redis required)
- Toggle without code changes

### 4. Template Engine

**Option A: Simple String Templates** (Recommended for v1)

- Use TypeScript template literals
- Functions that return `{ subject, html, text }`
- No external dependencies
- Easy to customize

**Option B: Template Engine (Handlebars/Mustache)**

- More powerful template syntax
- Separate template files from code
- Learning curve for customization
- Extra dependency

**Recommendation:** Start with simple string templates (Rails approach with ERB translates well to template literals). Add template engine in v2 if needed.

### 5. Testing Strategy

**Unit Tests:**

- Mock email providers (don't send real emails in tests)
- Test email template rendering
- Test job queue enqueue/dequeue logic
- Test validation schemas

**Integration Tests:**

- Use Redis test instance (different DB number)
- Test full contact form flow: submit → queue job → verify job added
- Test rate limiting with Redis
- Test admin CRUD operations

**Manual Testing:**

- Use Mailcatcher or Mailtrap for local email testing
- Document setup in README

---

## Implementation Timeline

### Phase 1: Email Service (v1.1.1) - 6 hours

- [ ] Create email service architecture
- [ ] Implement SMTP provider (default)
- [ ] Implement Resend provider
- [ ] Implement SendGrid provider
- [ ] Create email templates
- [ ] Add environment configuration
- [ ] Write tests

### Phase 2: Job Queue (v1.1.1) - 5 hours

- [ ] Create Redis configuration
- [ ] Implement queue service
- [ ] Implement worker process
- [ ] Create email job handler
- [ ] Add `deliver_later()` / `deliver_now()` API
- [ ] Update docker-compose
- [ ] Write tests

### Phase 3: Contact Form (v1.1.1) - 6 hours

- [ ] Create enquiry model and migration
- [ ] Create enquiry DTOs
- [ ] Create enquiry service
- [ ] Create enquiry controller
- [ ] Create public route with rate limiting
- [ ] Create admin routes
- [ ] Write tests

### Phase 4: CLI Integration (v1.1.1) - 3 hours

- [ ] Add `--with-email` flag
- [ ] Add `--with-jobs` flag
- [ ] Add `--with-contact-form` flag
- [ ] Update help text
- [ ] Conditional file generation
- [ ] Update documentation

### Phase 5: Documentation (v1.1.1) - 2 hours

- [ ] API documentation
- [ ] Frontend integration examples
- [ ] Email provider setup guides
- [ ] Job queue usage examples
- [ ] Migration guide

**Total: ~22 hours** (split across team or phased releases)

---

## Success Criteria

✅ Send emails via SMTP without external dependencies  
✅ Easy switch to Resend/SendGrid via env variable  
✅ Background job queue with Redis  
✅ Rails-like `deliver_later()` API  
✅ Production-ready contact form with anti-spam  
✅ Admin dashboard for enquiry management  
✅ Rate limiting with Redis  
✅ Clean abstraction (provider-agnostic API)  
✅ Production-ready error handling  
✅ Documented and tested  
✅ Save developers $5-15 in AI costs per project by eliminating boilerplate prompts

---

## Related Issues

- [Issue #10: Email Service Integration](https://github.com/desingh-rajan/tstack-kit/issues/10)
- [Issue #9: Redis Integration for Caching and Job Queue](https://github.com/desingh-rajan/tstack-kit/issues/9)
- [Issue #11: Contact/Enquiry Form Module](https://github.com/desingh-rajan/tstack-kit/issues/11)
- [Issue #8: Site Configuration Management](https://github.com/desingh-rajan/tstack-kit/issues/8) (completed, can be used for email settings)

---

## Notes

- This plan implements three features (email, jobs, contact form) that work together but can be developed independently
- Email service is the foundation; job queue and contact form build on top
- Design follows Rails conventions (`deliver_later`, `deliver_now`) familiar to many developers
- Provider pattern allows easy extension (add new email providers, new job types)
- All features are optional via CLI flags, keeping the starter flexible
