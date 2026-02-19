# tstack-kit Monorepo — Agent Rules

## Pre-push Checklist (MANDATORY — every single time, no exceptions)

Before committing or pushing **any** change, run from the **repo root**:

```bash
deno fmt --check && deno lint
```

This matches exactly what CI runs and covers all packages and root-level files
in one go. If `deno fmt --check` fails, run `deno fmt` to auto-fix, then
re-verify. Fix all lint errors before pushing. Never push with failing fmt or
lint.

> `deno check` (TypeScript type checking) currently has pre-existing failures in
> both `storefront-starter` and `admin-ui-starter` that predate this project's
> history. Do **not** use `deno check` as a gate — fmt+lint only.

---

## Tests (MANDATORY for bug fixes and new features)

Run the existing test suite for any package you modified **before pushing**.

### cli

```bash
cd packages/cli
deno task test
```

### admin

```bash
cd packages/admin
deno task test
```

### api-starter

```bash
cd packages/api-starter
deno task test
```

> `storefront-starter` and `admin-ui-starter` have no test suite — skip for
> those packages.

### New features → new tests required

If you introduce a new feature in any package that has a test suite (`cli`,
`admin`, `api-starter`), you **must** add corresponding tests before pushing. Do
not leave new logic untested.

---

## Project Structure

```
packages/
  storefront-starter/   # Fresh (Deno) storefront — JSX, Preact, Tailwind
  admin-ui-starter/     # Fresh (Deno) admin UI
  api-starter/          # Deno API (Hono)
  admin/                # Deno admin framework/ORM helpers
  cli/                  # Deno CLI (tstack)
```

---

## storefront-starter Patterns

### Navbar component

All route files use the shared `components/Navbar.tsx` — never inline a
`<header>` block.

- Standard page: `<Navbar user={user} />`
- With cart count: `<Navbar user={user} cartCount={cart?.itemCount} />`
- Minimal (checkout):
  `<Navbar minimal rightAction={<a href="/cart">Back to Cart</a>} />`
- Navbar is `position: fixed` — always add `<div class="h-16"></div>` spacer
  immediately after it.

### Getting the current user in route page functions

Route handlers that do **not** return `user` in their `data` object must get the
user from state:

```tsx
export default define.page<typeof handler>(function MyPage({ data, state }) {
  const user = state.user;
  // ...
});
```

Pages where `user` IS returned in handler data (e.g. `account/index.tsx`):

```tsx
const { user } = data;
```

### LSP false positives

The language server cannot resolve `preact/jsx-runtime` types — all JSX-related
LSP errors are pre-existing false positives. They do not affect Deno
compilation. Ignore them.

### react-no-danger lint rule

`dangerouslySetInnerHTML` in `checkout/payment.tsx` is intentional (Razorpay
inline script). It has a `// deno-lint-ignore react-no-danger` comment — do not
remove it.

---

## Reference Implementation

The production sc-store repo at `/home/tony/projects/sc/sc-store` is the
reference for patterns used in `storefront-starter`. Read it when unsure about
how something should be structured (Navbar, auth flow, state management, etc.).
