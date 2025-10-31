#!/usr/bin/env -S deno run --allow-all --node-modules-dir

/**
 * Wrapper script for drizzle-kit studio command
 * Ensures graceful exit after studio is closed
 */

const command = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    "--node-modules-dir",
    "npm:drizzle-kit@0.28.0",
    "studio",
  ],
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await command.output();

// Ensure graceful exit
Deno.exit(code);
