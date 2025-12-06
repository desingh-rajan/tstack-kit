#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * TStack Kit Version Bump Script
 *
 * This script updates the kit release version in:
 * - Root deno.json (source of truth for kit version)
 * - CLI package (the distributed tool published to JSR)
 * - install.sh (installation script version)
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

// JSON files to update with kit version
const jsonFiles = [
  { path: "./deno.json", name: "root" },
  { path: "./packages/cli/deno.json", name: "cli" },
];

for (const file of jsonFiles) {
  const content = await Deno.readTextFile(file.path);
  const json = JSON.parse(content);
  const oldVersion = json.version;
  json.version = version;
  await Deno.writeTextFile(file.path, JSON.stringify(json, null, 2) + "\n");
  console.log(`[ok] Updated ${file.name}: v${oldVersion} -> v${version}`);
}

// Update install.sh version (only TSTACK_VERSION, URL uses variable interpolation)
const installShPath = "./install.sh";
let installShContent = await Deno.readTextFile(installShPath);
const oldVersionMatch = installShContent.match(/TSTACK_VERSION="([^"]+)"/);
const oldInstallVersion = oldVersionMatch?.[1] || "unknown";
installShContent = installShContent.replace(
  /TSTACK_VERSION="[^"]+"/,
  `TSTACK_VERSION="${version}"`,
);
await Deno.writeTextFile(installShPath, installShContent);
console.log(`[ok] Updated install.sh: v${oldInstallVersion} -> v${version}`);

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
