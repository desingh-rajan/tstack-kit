/**
 * Tests for pagination utilities
 */

import { assertEquals } from "@std/assert";
import {
  buildPaginationResult,
  calculatePagination,
  generatePageNumbers,
} from "./pagination.ts";

Deno.test("calculatePagination - first page", () => {
  const result = calculatePagination(1, 20, 100);

  assertEquals(result.page, 1);
  assertEquals(result.limit, 20);
  assertEquals(result.offset, 0);
  assertEquals(result.total, 100);
  assertEquals(result.totalPages, 5);
  assertEquals(result.hasPrevious, false);
  assertEquals(result.hasNext, true);
});

Deno.test("calculatePagination - middle page", () => {
  const result = calculatePagination(3, 20, 100);

  assertEquals(result.page, 3);
  assertEquals(result.offset, 40);
  assertEquals(result.hasPrevious, true);
  assertEquals(result.hasNext, true);
});

Deno.test("calculatePagination - last page", () => {
  const result = calculatePagination(5, 20, 100);

  assertEquals(result.page, 5);
  assertEquals(result.offset, 80);
  assertEquals(result.hasPrevious, true);
  assertEquals(result.hasNext, false);
});

Deno.test("calculatePagination - page beyond total", () => {
  const result = calculatePagination(10, 20, 100);

  // Should clamp to last page
  assertEquals(result.page, 5);
  assertEquals(result.offset, 80);
  assertEquals(result.hasNext, false);
});

Deno.test("calculatePagination - page zero or negative", () => {
  const result = calculatePagination(0, 20, 100);

  // Should default to page 1
  assertEquals(result.page, 1);
  assertEquals(result.offset, 0);
});

Deno.test("calculatePagination - invalid page (decimal)", () => {
  const result = calculatePagination(2.7, 20, 100);

  // Should floor to integer
  assertEquals(result.page, 2);
  assertEquals(result.offset, 20);
});

Deno.test("calculatePagination - limit too large", () => {
  const result = calculatePagination(1, 500, 100);

  // Should cap at 100
  assertEquals(result.limit, 100);
  assertEquals(result.totalPages, 1);
});

Deno.test("calculatePagination - limit zero or negative", () => {
  const result = calculatePagination(1, 0, 100);

  // Should default to 1
  assertEquals(result.limit, 1);
  assertEquals(result.totalPages, 100);
});

Deno.test("calculatePagination - zero total", () => {
  const result = calculatePagination(1, 20, 0);

  assertEquals(result.total, 0);
  assertEquals(result.totalPages, 1);
  assertEquals(result.hasPrevious, false);
  assertEquals(result.hasNext, false);
});

Deno.test("calculatePagination - negative total", () => {
  const result = calculatePagination(1, 20, -50);

  // Should sanitize to 0
  assertEquals(result.total, 0);
  assertEquals(result.totalPages, 1);
});

Deno.test("calculatePagination - partial last page", () => {
  const result = calculatePagination(3, 20, 55);

  assertEquals(result.page, 3);
  assertEquals(result.limit, 20);
  assertEquals(result.offset, 40);
  assertEquals(result.totalPages, 3);
  assertEquals(result.hasNext, false);
});

Deno.test("buildPaginationResult - with data", () => {
  const data = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
  ];

  const result = buildPaginationResult(data, 1, 20, 100);

  assertEquals(result.data, data);
  assertEquals(result.page, 1);
  assertEquals(result.limit, 20);
  assertEquals(result.total, 100);
  assertEquals(result.totalPages, 5);
  assertEquals(result.hasPrevious, false);
  assertEquals(result.hasNext, true);
});

Deno.test("buildPaginationResult - empty data", () => {
  const result = buildPaginationResult([], 1, 20, 0);

  assertEquals(result.data, []);
  assertEquals(result.total, 0);
  assertEquals(result.totalPages, 1);
});

Deno.test("generatePageNumbers - few pages (no ellipsis)", () => {
  const pages = generatePageNumbers(2, 5, 7);

  assertEquals(pages, [1, 2, 3, 4, 5]);
});

Deno.test("generatePageNumbers - many pages (with ellipsis)", () => {
  const pages = generatePageNumbers(5, 10, 7);

  assertEquals(pages, [1, "...", 3, 4, 5, 6, 7, "...", 10]);
});

Deno.test("generatePageNumbers - first page of many", () => {
  const pages = generatePageNumbers(1, 10, 7);

  assertEquals(pages, [1, 2, 3, 4, 5, 6, "...", 10]);
});

Deno.test("generatePageNumbers - last page of many", () => {
  const pages = generatePageNumbers(10, 10, 7);

  assertEquals(pages, [1, "...", 5, 6, 7, 8, 9, 10]);
});

Deno.test("generatePageNumbers - second page", () => {
  const pages = generatePageNumbers(2, 10, 7);

  assertEquals(pages, [1, 2, 3, 4, 5, 6, "...", 10]);
});

Deno.test("generatePageNumbers - second to last page", () => {
  const pages = generatePageNumbers(9, 10, 7);

  assertEquals(pages, [1, "...", 5, 6, 7, 8, 9, 10]);
});

Deno.test("generatePageNumbers - single page", () => {
  const pages = generatePageNumbers(1, 1, 7);

  assertEquals(pages, [1]);
});

Deno.test("generatePageNumbers - two pages", () => {
  const pages = generatePageNumbers(1, 2, 7);

  assertEquals(pages, [1, 2]);
});

Deno.test("generatePageNumbers - custom max visible", () => {
  const pages = generatePageNumbers(5, 20, 5);

  assertEquals(pages, [1, "...", 4, 5, 6, "...", 20]);
});
