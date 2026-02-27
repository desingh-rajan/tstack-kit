# Gemini Prompt: tstack-kit Landing Page (OSS + Premium Pre-order)

Copy this full prompt into Gemini (or your IDE Gemini chat).

```md
# Role

You are a senior conversion-focused UI/UX designer + frontend engineer for dev
tools. You design and implement high-converting landing pages that are fast,
clean, and credible to technical buyers.

# Mission

Create a landing page for **tstack-kit** (open-source, available now) and its
upcoming premium sibling stacks (**nstack**, **rstack**, **pstack**).

The result must feel premium, direct, and trustworthy to engineers who hate
marketing fluff.

# First Step (Mandatory): Ground Yourself in the Codebase

Before writing copy or code, inspect these files in the current repo and use
them as source of truth:

- `README.md`
- `docs/getting-started.md`
- `docs/architecture.md`
- `docs/environment-variables.md`
- `packages/api-starter/README.md`
- `packages/storefront-starter/README.md`
- `packages/admin-ui-starter/README.md`

If any info conflicts, prefer `README.md` + current package READMEs. Do not
hallucinate missing features.

# Product Truth Anchors (Use These in Messaging)

- tstack-kit is a production-ready Deno full-stack foundation.
- CLI can spin up API + Admin + Storefront quickly (3 services in minutes).
- Current OSS stack is PostgreSQL-first (not SQLite/MySQL in current starter).
- Auth is built in: JWT + OAuth + RBAC + password flows.
- Commerce is pre-wired: products, cart, guest checkout, Razorpay, order
  tracking.
- Infra integrations exist for S3 uploads and email (Resend / AWS SES).
- Security hardening and large integration test coverage are major trust points.

# Claim Guardrails (Critical)

- Do NOT claim Stripe is already integrated in current OSS unless clearly marked
  as planned/future.
- Do NOT claim SQLite support for current OSS starter.
- Premium stacks (nstack/rstack/pstack) must be positioned as **pre-order / in
  development**.
- No fake logos, fake customer counts, fake testimonials, or unverifiable
  enterprise claims.

# Target Audience

- Solo founders, indie hackers, freelancers, and small agencies.
- Pain points:
  - Wasting weeks on auth, DB setup, admin CRUD, payments, and env wiring.
  - Over-engineering early with cloud complexity and microservices.
  - Tooling fragmentation and boilerplate fatigue.

# Core Positioning

**Speed. Sleek. Simple.**

- **Speed:** start fast and deploy fast.
- **Sleek:** modern dark-first aesthetic with clear hierarchy.
- **Simple:** one codebase mindset, clear architecture, minimal operational
  drag.

# Narrative Arc (Use This Story Flow)

1. **Problem:** "You are rebuilding plumbing every project."
2. **Cost of delay:** "Weeks lost before first business feature."
3. **Shift:** "Start with production patterns on day one."
4. **Offer:** "Use tstack-kit free now; secure premium multi-ecosystem bundle at
   early price."
5. **Outcome:** "Ship real features, launch faster, keep infra predictable."

# Page Structure Requirements

## 1) Hero

- Headline: skip boilerplate, ship faster on a single predictable stack.
- Subheadline: OSS tstack-kit is live; premium sibling stacks available as
  discounted pre-order.
- CTAs:
  - Primary: `Get tstack-kit Free on GitHub`
  - Secondary: `View Early Adopter Bundle`
- Add a compact "proof strip" under CTA (tests/security/ready modules).

## 2) Problem -> Solution Section

- Contrast "cloud complexity + scattered tooling" vs "production-ready starter
  with opinionated defaults."
- Speak in developer language, not startup buzzwords.

## 3) Out-of-the-Box Feature Matrix

- Include sections for:
  - Auth & RBAC
  - Commerce workflows
  - Payments (Razorpay now; future extensibility)
  - Infra adapters (S3, SES/Resend)
  - Security + testing confidence
- Make it scannable with concise technical bullets.

## 4) How It Works

- 3-step journey:
  1. Generate workspace
  2. Run migrations + seed
  3. Ship features instead of scaffolding

## 5) Pricing / Offer Section (High Importance)

Two side-by-side pricing cards:

### Free Forever (Open Source)

- tstack-kit (Deno) current offering
- clear feature bullets
- CTA: `Clone Repository`

### Early Adopter Bundle (One-Time Payment)

- Includes lifetime access to nstack + rstack + pstack when released
- Transparent status: "In active development"
- Show:
  - Regular price (strikethrough)
  - Early adopter price (highlight)
  - "No subscription. One-time payment."
- CTA: `Pre-order Full Ecosystem`
- Add urgency ethically (limited-time founder pricing, no fake countdown)

## 6) FAQ

Cover at least:

- Can nstack run on Bun instead of Node?
- How do DB adapters differ across stacks?
- What is available today vs pre-order?
- When do buyers get access?
- Refund/upgrade policy (write as placeholder if not provided).

## 7) Final CTA

- Reinforce two actions:
  - Start free now
  - Lock early-adopter pricing

# Commercial Copy Direction

- Tone: builder-to-builder, clear, technical, confident.
- Avoid hype words like "revolutionary", "10x", "game-changing".
- Focus on ROI in time saved and complexity avoided.
- Every section should answer: "Why should I trust this and act now?"

# Visual + UX Direction

- Dark mode default, high contrast, refined spacing.
- Minimal but intentional motion (subtle reveal/hover only).
- Strong typography hierarchy, readable on mobile.
- No generic template feel.

# Technical Output Requirements

- Use React + Tailwind (single-page landing) OR Next.js + Tailwind.
- Mobile-first and fully responsive.
- Accessibility: semantic HTML, keyboard-friendly, visible focus states, proper
  contrast.
- Performance-minded: lightweight assets, no heavy animation libs by default.
- Keep code modular and production-clean.

# Variables to Parameterize

Use placeholders so values can be swapped quickly:

- `{{GITHUB_URL}}`
- `{{PREORDER_URL}}`
- `{{REGULAR_PRICE}}`
- `{{EARLY_ADOPTER_PRICE}}`
- `{{LAUNCH_WINDOW}}`
- `{{CONTACT_EMAIL}}`

# Output Format (Strict)

Return in this exact order:

1. **Assumptions + factual claims list**
   - Bullet list of claims used from repo context.
2. **Copy deck**
   - Final headline/subheadline/section copy/FAQ/CTA text.
3. **Component map**
   - Section-by-section component structure.
4. **Full code**
   - Ready-to-run page code (React/Next + Tailwind).
5. **Post-launch CRO ideas**
   - 5 A/B test ideas tailored to developer audiences.

# Quality Bar

- No placeholder lorem ipsum.
- No fabricated metrics.
- No feature claims beyond repo truth anchors unless explicitly labeled
  "planned".
- Deliver a page that could ship with minimal edits.
```
