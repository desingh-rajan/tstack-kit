#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * TStack Kit Version Bump Script
 *
 * This script updates the kit release version in:
 * - Root deno.json (source of truth for kit version)
 * - CLI package (the distributed tool published to JSR)
 *
 * Note: api-starter and admin-ui-starter are templates that get copied
 * to user projects—they don't have versions as they're not published.
 * Admin package (@tstack/admin) has independent versioning on JSR.
 */

const version = Deno.args[0];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: deno task bump <version>");
  console.error("Example: deno task bump 1.3.0");
  Deno.exit(1);
}

// Files to update with kit version
const files = [
  { path: "./deno.json", name: "root" },
  { path: "./packages/cli/deno.json", name: "cli" },
];

for (const file of files) {
  const content = await Deno.readTextFile(file.path);
  const json = JSON.parse(content);
  const oldVersion = json.version;
  json.version = version;
  await Deno.writeTextFile(file.path, JSON.stringify(json, null, 2) + "\n");
  console.log(`[ok] Updated ${file.name}: v${oldVersion} -> v${version}`);
}

console.log(
  `\n[info] Template packages (api-starter, admin-ui-starter) don't have versions`,
);
console.log(
  `[info] Admin package (@tstack/admin) has independent versioning on JSR`,
);

console.log(`\n[done] TStack Kit bumped to v${version}`);
console.log("\nNext steps:");
console.log(`  git commit -am "chore: release v${version}"`);
console.log(`  git tag v${version}`);
console.log(`  git push origin main --tags`);
