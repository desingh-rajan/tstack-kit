# Development Standards & Quality Assurance

**Version**: 1.0\
**Date**: November 22, 2025\
**Status**: 🎯 Active Guidelines

---

## 🎯 Purpose

Establish clear development standards for blog-v1-ui to prevent regressions,
maintain code quality, and ensure consistency across the Fresh/Preact codebase.

---

## 🔍 Pre-Commit Quality Checks

### 1. Automated Format & Lint Check

Run before every commit:

```bash
deno fmt --check . && deno lint . && deno check
```

Or use the task:

```bash
deno task check
```

**What it does:**

- ✅ `deno fmt --check` - Validates code formatting (no changes, just check)
- ✅ `deno lint` - Runs Fresh-recommended linter rules
- ✅ `deno check` - TypeScript type checking

### 2. Pre-Commit Hook (Recommended)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
set -e

echo "🔍 Running pre-commit checks..."

if ! deno fmt --check . > /dev/null 2>&1; then
  echo "❌ Format check failed. Run: deno fmt ."
  exit 1
fi

if ! deno lint . > /dev/null 2>&1; then
  echo "❌ Lint check failed. Run: deno lint ."
  exit 1
fi

if ! deno check > /dev/null 2>&1; then
  echo "❌ Type check failed. Review TypeScript errors above."
  exit 1
fi

echo "✅ All checks passed!"
exit 0
```

Make executable:

```bash
chmod +x .git/hooks/pre-commit
```

### 3. GitHub Actions CI/CD (Recommended)

Create `.github/workflows/quality.yml`:

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
        with:
          deno-version: vx.x.x # Match your deno.json version

      - name: Format check
        run: deno fmt --check .

      - name: Lint
        run: deno lint .

      - name: Type check
        run: deno check
```

---

## 📋 Code Style Guidelines

### Preact/Fresh Specific Rules

#### ✅ DO

**1. Use Type Inference for Component Functions**

```typescript
// ✅ GOOD - Let TypeScript infer return type
const renderField = (field: FieldConfig) => {
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// ✅ GOOD - For complex types, use generics on the component
export function GenericForm<T = Record<string, unknown>>(
  { config, item }: FormProps<T>,
) {
  return <form>{/* JSX */}</form>;
}
```

**2. Import from Preact, Not React**

```typescript
// ✅ GOOD
import { Fragment, h } from "preact";
import { useEffect, useState } from "preact/hooks";

// ❌ WRONG
import React from "react";
import { useState } from "react";
```

**3. Use JSX Pragma Only in Type Definitions**

```typescript
// ✅ GOOD - Interface return types
interface FieldRendererConfig {
  render?: (value: unknown) => string | JSX.Element;
}

// ❌ WRONG - Function return types (let type inference handle it)
const renderField = (field: FieldConfig): JSX.Element => {
  // ...
};
```

**4. Use `key` Prop in Lists**

```typescript
// ✅ GOOD
{
  items.map((item) => <div key={item.id}>{item.name}</div>);
}

// ❌ WRONG
{
  items.map((item, index) => <div key={index}>{item.name}</div>);
}
```

**5. Use Fresh Routes (Not Client-Side Routing)**

```typescript
// ✅ GOOD - File-based routes
// routes/admin/articles/index.tsx
export default function ArticleList() {
  return <div>List</div>;
}

// ❌ WRONG - Don't use react-router or similar in Fresh
```

#### ❌ DON'T

**1. Avoid Explicit JSX.Element Return Types on Functions**

```typescript
// ❌ WRONG
const renderField = (field: FieldConfig): JSX.Element => {
  // ...
};

// ✅ CORRECT
const renderField = (field: FieldConfig) => {
  // ...
};
```

**2. Avoid React-Specific Patterns**

```typescript
// ❌ WRONG
import type { FC, ReactNode } from "react";
type MyComponent = FC<Props>;

// ✅ CORRECT
export function MyComponent(props: Props) {
  // ...
}
```

**3. Avoid Class Components**

```typescript
// ❌ WRONG
class MyComponent extends React.Component {
  render() {
    return <div />;
  }
}

// ✅ CORRECT
export function MyComponent() {
  return <div />;
}
```

**4. Avoid Global State When Preact Signals Work**

```typescript
// ❌ WRONG - Complex Redux-like setup
// ✅ CORRECT - Use Preact Signals
import { signal } from "@preact/signals";

const count = signal(0);

export function Counter() {
  return <button onClick={() => count.value++}>{count.value}</button>;
}
```

---

## 🚨 Common Pitfalls to Avoid

### Issue #1: JSX.Element Type Annotations

**Problem**: Explicit return types on JSX functions break Preact type inference

```typescript
// ❌ WRONG
const renderField = (field: FieldConfig): JSX.Element => {
  return <div>{field.label}</div>;
};
```

**Why it's wrong**: Preact's JSX type system is different from React. Explicit
`JSX.Element` can cause type conflicts.

**Fix**: Remove the explicit return type

```typescript
// ✅ CORRECT
const renderField = (field: FieldConfig) => {
  return <div>{field.label}</div>;
};
```

**Detection**: `grep -rn "JSX\.Element" --include="*.tsx"`

---

### Issue #2: React Imports

**Problem**: Accidentally importing from React instead of Preact

```typescript
// ❌ WRONG
import { useState } from "react";

// ✅ CORRECT
import { useState } from "preact/hooks";
```

**Detection**: `grep -rn "from.*react" --include="*.tsx"`

---

### Issue #3: Key Prop Missing in Lists

**Problem**: Rendering lists without proper `key` causes re-render bugs

```typescript
// ❌ WRONG
{
  items.map((item) => <div>{item.name}</div>);
}

// ✅ CORRECT
{
  items.map((item) => <div key={item.id}>{item.name}</div>);
}
```

**Detection**: Manual code review or ESLint rule (recommended)

---

### Issue #4: State in Island vs Route

**Problem**: Using state in static route components

```typescript
// ❌ WRONG - routes can't have state
export default function MyPage() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// ✅ CORRECT - move to island
// routes/my-page.tsx
export default function MyPage() {
  return <CounterIsland />;
}

// islands/CounterIsland.tsx
export default function CounterIsland() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

**Detection**: Type checker will catch this - routes should only return JSX from
server context

---

## ✅ Quality Assurance Checklist

Before committing, verify:

- [ ] `deno fmt .` - Code is properly formatted
- [ ] `deno lint .` - No lint warnings
- [ ] `deno check` - All TypeScript types are correct
- [ ] No `JSX.Element` return types on functions
- [ ] All imports are from `preact` (not `react`)
- [ ] All list items have `key` prop
- [ ] Island components for interactive features
- [ ] Routes only contain static JSX
- [ ] No unused imports
- [ ] No console.log statements (unless debugging)
- [ ] Component names are PascalCase
- [ ] Files follow naming convention (kebab-case)

---

## 🔄 Git Workflow

### 1. Before Pushing

```bash
# Run checks
deno task check

# Format code (if needed)
deno fmt .

# Run linter (if needed)
deno lint . --fix
```

### 2. Create PR

- Ensure CI passes (GitHub Actions)
- Request code review
- Address feedback

### 3. Merge to Main

- Squash commits if multiple
- Use meaningful commit messages
- Reference issues/tickets

---

## 📖 Reference Links

- **Preact Docs**: <https://preactjs.com/>
- **Fresh Docs**: <https://fresh.deno.dev/>
- **Preact Signals**: <https://preactjs.com/guide/v10/signals/>
- **Deno Docs**: <https://deno.land/manual>
- **TypeScript Best Practices**: <https://www.typescriptlang.org/docs/handbook/>

---

## 🎓 Learning Resources

### For New Team Members

1. Read Fresh Documentation (30 mins)
2. Read Preact Essentials (30 mins)
3. Review this document (15 mins)
4. Code along with GenericForm.tsx example (30 mins)
5. Try scaffolding a new entity (1 hour)

### Common Commands Reference

```bash
# Development
deno task dev              # Start dev server

# Quality
deno task check            # Format, lint, type check
deno fmt .                 # Auto-format code
deno lint . --fix          # Auto-fix lint errors
deno check                 # Type check only

# Building
deno task build            # Build for production
deno task start            # Run production build
```

---

## 🚀 Continuous Improvement

### Monthly Review

- Review code quality metrics
- Identify common issues
- Update guidelines based on learnings
- Share knowledge with team

### Quarterly Audit

- Codebase refactoring opportunities
- Dependency updates
- Performance optimization
- Security review

---

## 📞 Questions?

Refer to:

- SCAFFOLDING_IMPROVEMENTS.md (for generating new entities)
- FRESH_TSTACK_CONVENTIONS.md (for project structure)
- ADMIN_IMPROVEMENT_ROADMAP.md (for feature implementation)

---

## ✨ Commit Message Format

Use conventional commits:

```
type(scope): brief description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

```bash
git commit -m "feat(articles): add bulk delete action"
git commit -m "fix(form): correct field type inference for Preact"
git commit -m "docs: add development standards guide"
git commit -m "chore: update dependencies"
```
