# Deno KV Visualization Tools

## Lightweight GUI Options

### 1. **Deno KV UI** (Recommended - Official)

```bash
deno run --unstable-kv --allow-read --allow-write --allow-net \
  jsr:@kitsonk/kview ~/.tstack/projects.db
```

- Official Deno KV viewer by Kitson Kelly (Deno core team)
- Web-based interface (opens in browser)
- View, edit, delete keys
- Filter and search functionality

### 2. **KV Insight**

```bash
deno run --unstable-kv --allow-all \
  jsr:@mfbx9da4/kv-insight ~/.tstack/projects.db
```

- Lightweight web UI
- Real-time updates
- JSON viewer for values

### 3. **CLI-Based: kvdump**

```bash
deno run --unstable-kv --allow-read \
  https://deno.land/x/kvdump/mod.ts ~/.tstack/projects.db
```

- Simple CLI output
- Export to JSON
- No GUI overhead

## Manual Inspection Script

Create `scripts/inspect-kv.ts`:

```typescript
#!/usr/bin/env -S deno run --unstable-kv --allow-read --allow-env

const homeDir = Deno.env.get("HOME");
const kvPath = `${homeDir}/.tstack/projects.db`;

const kv = await Deno.openKv(kvPath);

console.log("📦 TStack Projects:");
console.log("=".repeat(50));

const projects = kv.list({ prefix: ["projects"] });
for await (const entry of projects) {
  console.log("\n🔑 Key:", entry.key);
  console.log("📄 Value:", JSON.stringify(entry.value, null, 2));
}

console.log("\n📦 Scaffolds:");
console.log("=".repeat(50));

const scaffolds = kv.list({ prefix: ["scaffolds"] });
for await (const entry of scaffolds) {
  console.log("\n🔑 Key:", entry.key);
  console.log("📄 Value:", JSON.stringify(entry.value, null, 2));
}

console.log("\n📦 Workspaces:");
console.log("=".repeat(50));

const workspaces = kv.list({ prefix: ["workspaces"] });
for await (const entry of workspaces) {
  console.log("\n🔑 Key:", entry.key);
  console.log("📄 Value:", JSON.stringify(entry.value, null, 2));
}

kv.close();
```

Run:

```bash
deno run --unstable-kv --allow-read --allow-env scripts/inspect-kv.ts
```

## Quick Comparison

| Tool              | Type    | Best For              | Installation   |
| ----------------- | ------- | --------------------- | -------------- |
| **kview**         | Web GUI | Full featured editing | Single command |
| **kv-insight**    | Web GUI | Quick viewing         | Single command |
| **kvdump**        | CLI     | Export/Backup         | Single command |
| **Custom script** | CLI     | Project-specific      | Copy paste     |

## Recommendation

For development: **kview** (most user-friendly) For CI/testing: **Custom
script** (project-specific inspection) For backups: **kvdump** (export to JSON)
