#!/usr/bin/env -S deno run --allow-read --allow-write

const version = Deno.args[0];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: deno run scripts/bump-version.ts <version>");
  console.error("Example: deno run scripts/bump-version.ts 1.1.0");
  Deno.exit(1);
}

// CLI and Starter use the same version, Admin is independent
const packages = ["cli", "starter"];

for (const pkg of packages) {
  const path = `./packages/${pkg}/deno.json`;
  const content = await Deno.readTextFile(path);
  const json = JSON.parse(content);
  json.version = version;
  await Deno.writeTextFile(path, JSON.stringify(json, null, 2) + "\n");
  console.log(`✅ Updated ${pkg} to v${version}`);
}

console.log(`ℹ️  Admin package version unchanged (independent versioning)`);

console.log(`\n🎉 All packages bumped to v${version}`);
console.log("\nNext steps:");
console.log(`  git commit -am "chore: bump version to v${version}"`);
console.log(`  git tag v${version}`);
console.log(`  git push origin main --tags`);
