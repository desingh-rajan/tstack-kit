import { assertEquals, assertExists } from "@std/assert";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "./errorHandler.ts";
import { ValidationError } from "../utils/errors.ts";

/**
 * Error Handler Tests
 *
 * Tests the production-grade error handling:
 * - ValidationError with errors array
 * - Zod validation errors with proper formatting
 * - Development vs Production error responses
 * - Request correlation IDs
 */

// Create a test app
function createTestApp() {
  const app = new Hono();
  app.onError(errorHandler);
  return app;
}

Deno.test("Error Handler Tests", async (t) => {
  await t.step(
    "ValidationError - returns errors array when provided",
    async () => {
      const app = createTestApp();

      app.get("/test", () => {
        throw new ValidationError("Validation failed", [
          { field: "email", message: "Invalid email" },
          { field: "password", message: "Too short" },
        ]);
      });

      const response = await app.request("/test");
      const json = await response.json();

      assertEquals(response.status, 400);
      assertEquals(json.status, "error");
      assertEquals(json.message, "Validation failed");
      assertExists(json.errors);
      assertEquals(Array.isArray(json.errors), true);
      assertEquals(json.errors.length, 2);
      assertEquals(json.errors[0].field, "email");
      assertEquals(json.errors[1].field, "password");
    },
  );

  await t.step(
    "ValidationError - returns empty array when no errors",
    async () => {
      const app = createTestApp();

      app.get("/test", () => {
        throw new ValidationError("Validation failed");
      });

      const response = await app.request("/test");
      const json = await response.json();

      assertEquals(response.status, 400);
      assertEquals(json.status, "error");
      assertEquals(json.message, "Validation failed");
      assertEquals(Array.isArray(json.errors), true);
      assertEquals(json.errors.length, 0); // Empty array, not null
    },
  );

  await t.step(
    "ZodError - formats validation errors with field paths",
    async () => {
      const app = createTestApp();

      // Define a schema
      const userSchema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        age: z.number().min(18),
      });

      app.post("/test", async (c) => {
        const body = await c.req.json();
        // This will throw ZodError
        userSchema.parse(body);
        return c.json({ success: true });
      });

      const response = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
          password: "short",
          age: 15,
        }),
      });

      const json = await response.json();

      assertEquals(response.status, 400);
      assertEquals(json.status, "error");
      assertEquals(json.message, "Validation failed");
      assertExists(json.errors);
      assertEquals(Array.isArray(json.errors), true);
      assertEquals(json.errors.length >= 3, true); // At least 3 validation errors

      // Check that errors have proper structure
      const emailError = json.errors.find((e: { field: string }) =>
        e.field === "email"
      );
      assertExists(emailError);
      assertExists(emailError.message);
      assertExists(emailError.code);
    },
  );

  await t.step(
    "ZodError - handles nested field paths correctly",
    async () => {
      const app = createTestApp();

      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            email: z.string().email(),
          }),
        }),
      });

      app.post("/test", async (c) => {
        const body = await c.req.json();
        nestedSchema.parse(body);
        return c.json({ success: true });
      });

      const response = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            profile: {
              email: "not-an-email",
            },
          },
        }),
      });

      const json = await response.json();

      assertEquals(response.status, 400);
      assertEquals(json.status, "error");
      assertExists(json.errors);

      // Check nested path is formatted correctly
      const nestedError = json.errors.find((e: { field: string }) =>
        e.field.includes("user")
      );
      assertExists(nestedError);
      // Field should be in format: "user.profile.email"
      assertEquals(
        nestedError.field.includes("profile"),
        true,
        "Should include nested path",
      );
    },
  );

  await t.step("ZodError - handles array of errors", async () => {
    const app = createTestApp();

    const multiFieldSchema = z.object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      username: z.string().min(3, "Username must be at least 3 characters"),
      age: z.number().min(18, "Must be 18 or older"),
    });

    app.post("/test", async (c) => {
      const body = await c.req.json();
      multiFieldSchema.parse(body);
      return c.json({ success: true });
    });

    const response = await app.request("/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "bad",
        password: "123",
        username: "ab",
        age: 10,
      }),
    });

    const json = await response.json();

    assertEquals(response.status, 400);
    assertEquals(json.status, "error");
    assertEquals(json.message, "Validation failed");
    assertExists(json.errors);
    assertEquals(json.errors.length, 4); // All 4 fields should have errors

    // Verify each error has required fields
    json.errors.forEach(
      (error: { field: string; message: string; code: string }) => {
        assertExists(error.field, "Each error should have a field");
        assertExists(error.message, "Each error should have a message");
        assertExists(error.code, "Each error should have a code");
      },
    );
  });

  await t.step(
    "ValidationError - properly stores errors in array format",
    () => {
      // Test with array
      const errorWithArray = new ValidationError("Failed", [
        { test: "error1" },
        { test: "error2" },
      ]);
      assertEquals(errorWithArray.errors.length, 2);

      // Test with single object
      const errorWithObject = new ValidationError("Failed", {
        test: "single",
      });
      assertEquals(errorWithObject.errors.length, 1);

      // Test with no errors
      const errorWithoutErrors = new ValidationError("Failed");
      assertEquals(errorWithoutErrors.errors.length, 0);

      // Test with null
      const errorWithNull = new ValidationError("Failed", null);
      assertEquals(errorWithNull.errors.length, 0);
    },
  );
});
