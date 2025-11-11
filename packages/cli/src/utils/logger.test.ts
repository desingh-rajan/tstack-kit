import { assertEquals } from "@std/assert";
import { Logger } from "./logger.ts";

// Note: Testing logger is tricky because it outputs to console
// We'll test that methods don't throw errors rather than testing output

Deno.test("Logger.success - logs without error", () => {
  // Should not throw
  Logger.success("Test success message");
});

Deno.test("Logger.error - logs without error", () => {
  // Should not throw
  Logger.error("Test error message");
});

Deno.test("Logger.warning - logs without error", () => {
  // Should not throw
  Logger.warning("Test warning message");
});

Deno.test("Logger.info - logs without error", () => {
  // Should not throw
  Logger.info("Test info message");
});

Deno.test("Logger.step - logs without error", () => {
  // Should not throw
  Logger.step("Test step message");
});

Deno.test("Logger.title - logs without error", () => {
  // Should not throw
  Logger.title("Test Title");
});

Deno.test("Logger.subtitle - logs without error", () => {
  // Should not throw
  Logger.subtitle("Test Subtitle");
});

Deno.test("Logger.plain - logs without error", () => {
  // Should not throw
  Logger.plain("Plain text");
});

Deno.test("Logger.code - logs without error", () => {
  // Should not throw
  Logger.code("some code");
});

Deno.test("Logger.newLine - logs without error", () => {
  // Should not throw
  Logger.newLine();
});

Deno.test("Logger.banner - logs without error", () => {
  // Should not throw
  Logger.banner();
});

Deno.test("Logger.divider - logs without error", () => {
  // Should not throw
  Logger.divider();
});

Deno.test("Logger - handles empty strings", () => {
  // All should handle empty strings without throwing
  Logger.success("");
  Logger.error("");
  Logger.warning("");
  Logger.info("");
  Logger.step("");
  Logger.title("");
  Logger.subtitle("");
  Logger.plain("");
  Logger.code("");
});

Deno.test("Logger - handles special characters", () => {
  // Should handle special chars without throwing
  Logger.info("Test with émojis 🚀 and ünïcödé");
  Logger.success("Special chars: @#$%^&*()");
});

Deno.test("Logger - handles long messages", () => {
  const longMessage = "a".repeat(1000);
  // Should not throw with very long messages
  Logger.info(longMessage);
});

// Test that all methods exist
Deno.test("Logger - has all expected methods", () => {
  assertEquals(typeof Logger.success, "function");
  assertEquals(typeof Logger.error, "function");
  assertEquals(typeof Logger.warning, "function");
  assertEquals(typeof Logger.info, "function");
  assertEquals(typeof Logger.step, "function");
  assertEquals(typeof Logger.title, "function");
  assertEquals(typeof Logger.subtitle, "function");
  assertEquals(typeof Logger.plain, "function");
  assertEquals(typeof Logger.code, "function");
  assertEquals(typeof Logger.newLine, "function");
  assertEquals(typeof Logger.banner, "function");
  assertEquals(typeof Logger.divider, "function");
});
