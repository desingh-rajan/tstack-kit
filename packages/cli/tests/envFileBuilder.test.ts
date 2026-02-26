/**
 * EnvFileBuilder Tests
 *
 * Unit tests for the structured .env file manipulation utility.
 */

import { assertEquals } from "@std/assert";
import {
  EnvFileBuilder,
  transformEnvContent,
} from "../src/utils/envFileBuilder.ts";

Deno.test("EnvFileBuilder - parse preserves comments and blank lines", () => {
  const input = [
    "# Database config",
    "DATABASE_URL=postgresql://user:pass@localhost:5432/mydb",
    "",
    "# JWT",
    "JWT_SECRET=secret123",
  ].join("\n");

  const builder = new EnvFileBuilder().parse(input);
  const output = builder.build();

  assertEquals(output, input);
});

Deno.test("EnvFileBuilder - set overwrites existing key", () => {
  const input = [
    "DATABASE_URL=postgresql://old:pass@localhost:5432/olddb",
    "JWT_SECRET=secret123",
  ].join("\n");

  const builder = new EnvFileBuilder().parse(input);
  builder.set("DATABASE_URL", "postgresql://new:pass@localhost:5432/newdb");
  const output = builder.build();

  assertEquals(
    output,
    [
      "DATABASE_URL=postgresql://new:pass@localhost:5432/newdb",
      "JWT_SECRET=secret123",
    ].join("\n"),
  );
});

Deno.test("EnvFileBuilder - set appends new key", () => {
  const input = "DATABASE_URL=postgresql://user:pass@localhost:5432/mydb";

  const builder = new EnvFileBuilder().parse(input);
  builder.set("NEW_KEY", "new_value");
  const output = builder.build();

  assertEquals(
    output,
    [
      "DATABASE_URL=postgresql://user:pass@localhost:5432/mydb",
      "NEW_KEY=new_value",
    ].join("\n"),
  );
});

Deno.test("EnvFileBuilder - handles values with special chars", () => {
  const input =
    "DATABASE_URL=postgresql://user:p@ss@localhost:5432/db?sslmode=require";

  const builder = new EnvFileBuilder().parse(input);
  assertEquals(
    builder.get("DATABASE_URL"),
    "postgresql://user:p@ss@localhost:5432/db?sslmode=require",
  );

  // Round-trip
  assertEquals(builder.build(), input);
});

Deno.test("EnvFileBuilder - handles quoted values", () => {
  const input = 'APP_NAME="My Cool App"';

  const builder = new EnvFileBuilder().parse(input);
  assertEquals(builder.get("APP_NAME"), '"My Cool App"');

  // Round-trip
  assertEquals(builder.build(), input);
});

Deno.test("EnvFileBuilder - get returns undefined for missing key", () => {
  const input = "DATABASE_URL=something";
  const builder = new EnvFileBuilder().parse(input);
  assertEquals(builder.get("MISSING"), undefined);
});

Deno.test("transformEnvContent - convenience function applies overrides", () => {
  const input = [
    "# Config",
    "DATABASE_URL=postgresql://tonystack:password@localhost:5432/tonystack",
    "JWT_SECRET=old",
  ].join("\n");

  const result = transformEnvContent(input, {
    DATABASE_URL: "postgresql://myuser:mypass@localhost:5432/mydb",
    JWT_SECRET: "new-secret-value",
  });

  assertEquals(
    result,
    [
      "# Config",
      "DATABASE_URL=postgresql://myuser:mypass@localhost:5432/mydb",
      "JWT_SECRET=new-secret-value",
    ].join("\n"),
  );
});
