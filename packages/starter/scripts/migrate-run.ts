#!/usr/bin/env -S deno run --allow-all --node-modules-dir

/**
 * Wrapper script for drizzle-kit migrate command
 * Ensures graceful exit after running migrations
 *
 * FIX: Uses stdin: "piped" and closes stdin to prevent hanging
 * Related issue: https://github.com/desingh-rajan/tstack-kit/issues/31
 */

const migrateCommand = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    "--node-modules-dir",
    "npm:drizzle-kit@0.28.0",
    "migrate",
  ],
  stdin: "piped", // Fixed - use piped instead of null
  stdout: "inherit",
  stderr: "inherit",
});

const migrateProcess = migrateCommand.spawn();

// Fixed - explicitly close stdin to signal EOF
if (migrateProcess.stdin) {
  await migrateProcess.stdin.close();
}

const { code } = await migrateProcess.output();

// Ensure graceful exit
Deno.exit(code);
