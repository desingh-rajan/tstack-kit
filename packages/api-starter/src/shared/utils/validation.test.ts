/**
 * Tests for ValidationUtil and commonSchemas
 */

import { assertEquals, assertThrows } from "@std/assert";
import { commonSchemas, ValidationUtil } from "./validation.ts";
import { ValidationError } from "./errors.ts";
import { z } from "zod";

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

Deno.test("ValidationUtil.validate", async (t) => {
  await t.step("returns parsed data for valid input", () => {
    const result = ValidationUtil.validate(testSchema, {
      name: "Alice",
      age: 30,
    });

    assertEquals(result, { name: "Alice", age: 30 });
  });

  await t.step("throws ValidationError for invalid input", () => {
    assertThrows(
      () => ValidationUtil.validate(testSchema, { name: "", age: -1 }),
      ValidationError,
      "Validation failed",
    );
  });

  await t.step("throws ValidationError for wrong type", () => {
    assertThrows(
      () => ValidationUtil.validate(testSchema, { name: 123, age: "abc" }),
      ValidationError,
      "Validation failed",
    );
  });

  await t.step("throws ValidationError for missing fields", () => {
    assertThrows(
      () => ValidationUtil.validate(testSchema, {}),
      ValidationError,
    );
  });

  await t.step("re-throws non-Zod errors", () => {
    const badSchema = z.string().transform(() => {
      throw new TypeError("custom error");
    });

    assertThrows(
      () => ValidationUtil.validate(badSchema, "hello"),
      TypeError,
      "custom error",
    );
  });
});

Deno.test("ValidationUtil.validateSync", async (t) => {
  await t.step("works the same as validate", () => {
    const result = ValidationUtil.validateSync(testSchema, {
      name: "Bob",
      age: 25,
    });
    assertEquals(result, { name: "Bob", age: 25 });
  });

  await t.step("throws ValidationError for invalid input", () => {
    assertThrows(
      () => ValidationUtil.validateSync(testSchema, { name: "", age: 0 }),
      ValidationError,
    );
  });
});

Deno.test("ValidationUtil.safeValidate", async (t) => {
  await t.step("returns success with data for valid input", () => {
    const result = ValidationUtil.safeValidate(testSchema, {
      name: "Carol",
      age: 40,
    });

    assertEquals(result.success, true);
    assertEquals(result.data, { name: "Carol", age: 40 });
    assertEquals(result.errors, undefined);
  });

  await t.step("returns failure with errors for invalid input", () => {
    const result = ValidationUtil.safeValidate(testSchema, {
      name: "",
      age: -5,
    });

    assertEquals(result.success, false);
    assertEquals(result.data, undefined);
    assertEquals(Array.isArray(result.errors), true);
  });
});

Deno.test("commonSchemas", async (t) => {
  await t.step("email accepts valid email", () => {
    const result = commonSchemas.email.safeParse("user@example.com");
    assertEquals(result.success, true);
  });

  await t.step("email rejects invalid email", () => {
    const result = commonSchemas.email.safeParse("not-an-email");
    assertEquals(result.success, false);
  });

  await t.step("password requires min 8 chars", () => {
    assertEquals(commonSchemas.password.safeParse("short").success, false);
    assertEquals(
      commonSchemas.password.safeParse("longenough").success,
      true,
    );
  });

  await t.step("id requires positive integer", () => {
    assertEquals(commonSchemas.id.safeParse(1).success, true);
    assertEquals(commonSchemas.id.safeParse(0).success, false);
    assertEquals(commonSchemas.id.safeParse(-1).success, false);
    assertEquals(commonSchemas.id.safeParse(1.5).success, false);
  });

  await t.step("uuid validates format", () => {
    assertEquals(
      commonSchemas.uuid.safeParse(
        "550e8400-e29b-41d4-a716-446655440000",
      ).success,
      true,
    );
    assertEquals(commonSchemas.uuid.safeParse("not-a-uuid").success, false);
  });

  await t.step("url validates format", () => {
    assertEquals(
      commonSchemas.url.safeParse("https://example.com").success,
      true,
    );
    assertEquals(commonSchemas.url.safeParse("not a url").success, false);
  });

  await t.step("phone accepts valid patterns", () => {
    assertEquals(
      commonSchemas.phone.safeParse("+1 234-567-8901").success,
      true,
    );
    assertEquals(commonSchemas.phone.safeParse("(123) 456-7890").success, true);
    assertEquals(commonSchemas.phone.safeParse("abc").success, false);
  });
});
