#!/usr/bin/env -S deno run --allow-all --node-modules-dir

/**
 * Migration Check (Dry Run) Script
 *
 * Runs drizzle-kit generate in check mode to show what SQL changes
 * would be generated without actually creating migration files.
 * Useful for previewing schema drift before committing.
 *
 * Usage: deno task db:migrate:check
 */

console.log("\nChecking for pending schema changes...\n");

const checkCommand = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    "--node-modules-dir",
    "npm:drizzle-kit@0.28.0",
    "generate",
    "--custom",
  ],
  stdin: "piped",
  stdout: "piped",
  stderr: "piped",
});

const process = checkCommand.spawn();

// Close stdin to prevent hanging
if (process.stdin) {
  await process.stdin.close();
}

const { code, stdout, stderr } = await process.output();

const outText = new TextDecoder().decode(stdout);
const errText = new TextDecoder().decode(stderr);

if (outText.trim()) {
  console.log(outText);
}
if (errText.trim()) {
  // drizzle-kit outputs some info to stderr
  console.log(errText);
}

if (code === 0) {
  console.log("\nDry-run complete. No files were modified.");
  console.log(
    "Run 'deno task db:generate' to create the migration file.",
  );
} else {
  console.error("\ndrizzle-kit exited with code:", code);
}

Deno.exit(code);
