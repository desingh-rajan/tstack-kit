#!/usr/bin/env -S deno run --allow-all --node-modules-dir

/**
 * Wrapper script for drizzle-kit generate command
 * Ensures graceful exit after migration generation
 *
 * FIX: Uses stdin: "piped" and closes stdin to prevent hanging
 * Related issue: https://github.com/desingh-rajan/tstack-kit/issues/31
 */

const generateCommand = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    "--node-modules-dir",
    "npm:drizzle-kit@0.28.0",
    "generate",
  ],
  stdin: "piped", // Fixed - use piped instead of null
  stdout: "inherit",
  stderr: "inherit",
});

const generateProcess = generateCommand.spawn();

// Fixed - explicitly close stdin to signal EOF
if (generateProcess.stdin) {
  await generateProcess.stdin.close();
}

const { code } = await generateProcess.output();

// Ensure graceful exit
Deno.exit(code);
