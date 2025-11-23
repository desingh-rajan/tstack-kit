#!/usr/bin/env -S deno run --unstable-kv --allow-read --allow-env

/**
 * Inspect TStack KV Store
 * Usage: deno run --unstable-kv --allow-read --allow-env scripts/inspect-kv.ts [--test]
 */

const args = Deno.args;
const useTestDb = args.includes("--test");

const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
if (!homeDir) {
  console.error("❌ Could not determine home directory");
  Deno.exit(1);
}

const kvPath = useTestDb
  ? `${homeDir}/.tstack/projects-test.db`
  : `${homeDir}/.tstack/projects.db`;

console.log(`\n🔍 Inspecting: ${kvPath}`);
console.log(`Mode: ${useTestDb ? "TEST" : "PRODUCTION"}`);
console.log("=".repeat(70));

const kv = await Deno.openKv(kvPath);

// Projects
console.log("\n📦 PROJECTS:");
console.log("-".repeat(70));

const projects = kv.list({ prefix: ["projects"] });
let projectCount = 0;
for await (const entry of projects) {
  projectCount++;
  const data = entry.value as {
    folderName?: string;
    type?: string;
    path?: string;
    createdAt?: number;
    databases?: { dev?: string; test?: string; prod?: string };
  };
  console.log(`\n  ${projectCount}. ${data.folderName || "Unknown"}`);
  console.log(`     Type: ${data.type || "?"}`);
  console.log(`     Path: ${data.path || "?"}`);
  console.log(
    `     Created: ${
      data.createdAt ? new Date(data.createdAt).toLocaleString() : "?"
    }`,
  );
  if (data.databases) {
    console.log(
      `     DBs: ${data.databases.dev || "?"}, ${data.databases.test || "?"}, ${
        data.databases.prod || "?"
      }`,
    );
  }
}

if (projectCount === 0) {
  console.log("  (empty)");
}

// Scaffolds
console.log("\n\n🏗️  SCAFFOLDS:");
console.log("-".repeat(70));

const scaffolds = kv.list({ prefix: ["scaffolds"] });
let scaffoldCount = 0;
for await (const entry of scaffolds) {
  scaffoldCount++;
  const data = entry.value as {
    entityName?: string;
    projectName?: string;
    createdAt?: number;
  };
  console.log(`\n  ${scaffoldCount}. ${data.entityName || "Unknown"}`);
  console.log(`     Project: ${data.projectName || "?"}`);
  console.log(
    `     Created: ${
      data.createdAt ? new Date(data.createdAt).toLocaleString() : "?"
    }`,
  );
}

if (scaffoldCount === 0) {
  console.log("  (empty)");
}

// Workspaces
console.log("\n\n🏢 WORKSPACES:");
console.log("-".repeat(70));

const workspaces = kv.list({ prefix: ["workspaces"] });
let workspaceCount = 0;
for await (const entry of workspaces) {
  workspaceCount++;
  const data = entry.value as {
    name?: string;
    path?: string;
    namespace?: string;
    githubRepos?: unknown[];
    subProjects?: unknown[];
  };
  console.log(`\n  ${workspaceCount}. ${data.name || "Unknown"}`);
  console.log(`     Path: ${data.path || "?"}`);
  console.log(`     Namespace: ${data.namespace || "?"}`);
  console.log(`     Repos: ${data.githubRepos?.length || 0}`);
  console.log(`     Sub-projects: ${data.subProjects?.length || 0}`);
}

if (workspaceCount === 0) {
  console.log("  (empty)");
}

// Summary
console.log("\n" + "=".repeat(70));
console.log(
  `📊 Summary: ${projectCount} projects, ${scaffoldCount} scaffolds, ${workspaceCount} workspaces`,
);
console.log("=".repeat(70) + "\n");

kv.close();
