#!/usr/bin/env -S deno run --allow-read --allow-write

const version = Deno.args[0];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: deno run scripts/bump-version.ts <version>");
  console.error("Example: deno run scripts/bump-version.ts 1.2.0");
  Deno.exit(1);
}

// CLI, api-starter, and admin-ui-starter share the same version
// Admin (ORM/core library) is independently versioned
const packages = ["cli", "api-starter", "admin-ui-starter"];

for (const pkg of packages) {
  const path = `./packages/${pkg}/deno.json`;
  const content = await Deno.readTextFile(path);
  const json = JSON.parse(content);
  const oldVersion = json.version;
  json.version = version;
  await Deno.writeTextFile(path, JSON.stringify(json, null, 2) + "\n");
  console.log(`✅ Updated ${pkg}: v${oldVersion} → v${version}`);
}

console.log(`\nℹ️  Admin package version unchanged (independent versioning)`);

console.log(`\n🎉 All packages bumped to v${version}`);
console.log("\nNext steps:");
console.log(`  git commit -am "chore: bump version to v${version}"`);
console.log(`  git tag v${version}`);
console.log(`  git push origin main --tags`);
