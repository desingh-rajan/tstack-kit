# Known Issues

## Deno Formatter Corruption in Test Files

**Issue:** VS Code's `formatOnSave` with Deno formatter can corrupt test files containing multi-line `assertEquals()` calls.

**Symptoms:**
- Orphaned commas on separate lines
- Broken `assertEquals()` statements split across multiple lines
- Syntax errors like "Expression expected"
- Files affected: `*.test.ts`

**Example Corruption:**
```typescript
// Before (correct):
assertEquals(
  await Deno.stat(path).then(() => true).catch(() => false),
  true,
);

// After Deno fmt corrupts it:
        true,
      
      assertEquals(
        
        true,
      
        await Deno.
        stat(path).then(() => true).catch(() => false),
        true,
      );
```

**Root Cause:** Deno fmt bug when handling complex multi-line assertions.

**Workaround:**

### Option 1: Disable formatOnSave for test files (Recommended)
Add to your `.vscode/settings.json`:
```json
{
  "files.associations": {
    "*.test.ts": "typescript-test"
  },
  "[typescript-test]": {
    "editor.defaultFormatter": "denoland.vscode-deno",
    "editor.formatOnSave": false
  }
}
```

### Option 2: Use single-line assertions
```typescript
// Instead of multi-line:
assertEquals(
  await Deno.stat(path).then(() => true).catch(() => false),
  true,
);

// Use single-line:
const exists = await Deno.stat(path).then(() => true).catch(() => false);
assertEquals(exists, true);
```

### Option 3: Restore from Git
If corruption happens:
```bash
git checkout HEAD -- path/to/corrupted.test.ts
```

**Files Previously Affected:**
- `packages/cli/src/commands/workspace.test.ts` (restored from commit aff0b27)
- `packages/cli/src/commands/create-admin-ui.test.ts` (recreated from scratch)
- `packages/cli/src/commands/creators/base-creator.ts` (manually fixed)
- `packages/cli/src/commands/creators/api-creator.ts` (manually fixed)
