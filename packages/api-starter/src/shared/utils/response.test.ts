/**
 * Tests for ApiResponse utility class
 */

import { assertEquals } from "@std/assert";
import { ApiResponse } from "./response.ts";

Deno.test("ApiResponse.success", async (t) => {
  await t.step("returns correct structure", () => {
    const result = ApiResponse.success({ id: 1, name: "test" });

    assertEquals(result.status, "success");
    assertEquals(result.message, "Success");
    assertEquals(result.data, { id: 1, name: "test" });
    assertEquals(typeof result.timestamp, "string");
  });

  await t.step("accepts custom message", () => {
    const result = ApiResponse.success(null, "Created successfully");
    assertEquals(result.message, "Created successfully");
  });

  await t.step("handles null data", () => {
    const result = ApiResponse.success(null);
    assertEquals(result.data, null);
  });

  await t.step("handles array data", () => {
    const result = ApiResponse.success([1, 2, 3]);
    assertEquals(result.data, [1, 2, 3]);
  });

  await t.step("timestamp is valid ISO string", () => {
    const result = ApiResponse.success("ok");
    const date = new Date(result.timestamp);
    assertEquals(isNaN(date.getTime()), false);
  });
});

Deno.test("ApiResponse.error", async (t) => {
  await t.step("returns correct structure", () => {
    const result = ApiResponse.error("Something went wrong");

    assertEquals(result.status, "error");
    assertEquals(result.message, "Something went wrong");
    assertEquals(result.data, null);
    assertEquals(result.errors, null);
  });

  await t.step("uses default message", () => {
    const result = ApiResponse.error();
    assertEquals(result.message, "Error");
  });

  await t.step("includes data and errors when provided", () => {
    const result = ApiResponse.error(
      "Validation failed",
      { field: "email" },
      [{ code: "invalid_email" }],
    );

    assertEquals(result.data, { field: "email" });
    assertEquals(result.errors, [{ code: "invalid_email" }]);
  });
});

Deno.test("ApiResponse.paginated", async (t) => {
  await t.step("returns correct structure for first page", () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = ApiResponse.paginated(items, 1, 10, 25);

    assertEquals(result.status, "success");
    assertEquals(result.data, items);
    assertEquals(result.pagination.page, 1);
    assertEquals(result.pagination.limit, 10);
    assertEquals(result.pagination.pageSize, 10);
    assertEquals(result.pagination.total, 25);
    assertEquals(result.pagination.totalPages, 3);
    assertEquals(result.pagination.hasNext, true);
    assertEquals(result.pagination.hasPrev, false);
  });

  await t.step("calculates last page correctly", () => {
    const result = ApiResponse.paginated([], 3, 10, 25);

    assertEquals(result.pagination.totalPages, 3);
    assertEquals(result.pagination.hasNext, false);
    assertEquals(result.pagination.hasPrev, true);
  });

  await t.step("handles middle page", () => {
    const result = ApiResponse.paginated([], 2, 10, 30);

    assertEquals(result.pagination.hasNext, true);
    assertEquals(result.pagination.hasPrev, true);
  });

  await t.step("handles single page", () => {
    const result = ApiResponse.paginated([{ id: 1 }], 1, 10, 1);

    assertEquals(result.pagination.totalPages, 1);
    assertEquals(result.pagination.hasNext, false);
    assertEquals(result.pagination.hasPrev, false);
  });

  await t.step("handles zero results", () => {
    const result = ApiResponse.paginated([], 1, 10, 0);

    assertEquals(result.pagination.totalPages, 0);
    assertEquals(result.pagination.hasNext, false);
    assertEquals(result.pagination.hasPrev, false);
  });

  await t.step("accepts custom message", () => {
    const result = ApiResponse.paginated([], 1, 10, 0, "Products loaded");
    assertEquals(result.message, "Products loaded");
  });
});
