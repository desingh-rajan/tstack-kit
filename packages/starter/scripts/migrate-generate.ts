#!/usr/bin/env -S deno run --allow-all --node-modules-dir

/**
 * Wrapper script for drizzle-kit generate command
 * Ensures graceful exit after migration generation
 */

const command = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    "--node-modules-dir",
    "npm:drizzle-kit@0.28.0",
    "generate",
  ],
  stdin: "null", // Prevent hanging by closing stdin
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await command.output();

// Ensure graceful exit
Deno.exit(code);
