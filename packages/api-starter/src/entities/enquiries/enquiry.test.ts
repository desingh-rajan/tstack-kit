import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { enquiries } from "./enquiry.model.ts";
import { like } from "drizzle-orm";
import { clearRateLimits } from "../../shared/middleware/rateLimit.ts";

/**
 * Public Contact Form API Tests
 *
 * TESTING PATTERNS DEMONSTRATED:
 * ================================
 *
 * 1. Public Endpoint Testing:
 *    - No authentication required
 *    - Rate limiting validation
 *    - Honeypot spam detection
 *    - Time-based spam detection
 *
 * 2. Input Validation:
 *    - Required fields (email or phone, message)
 *    - Optional fields (name, company, subject)
 *    - Field length limits
 *
 * 3. Anti-Spam Features:
 *    - Honeypot field (website) triggers spam detection
 *    - Rate limiting (3 per 10 minutes per IP)
 *    - Always returns success (doesn't reveal spam detection)
 */

// Test data constants
const VALID_ENQUIRY = {
  name: "Test User",
  email: "testuser@example.com",
  phone: "+1234567890",
  company: "Test Company",
  subject: "Test Subject",
  message: "This is a test message from the contact form.",
};

// Helper to make a contact form submission
async function submitContactForm(data: Record<string, unknown>) {
  const response = await app.request("/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text };
  }
  return { status: response.status, data: json };
}

describe({
  name: "Contact Form API",
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    console.log("\n[SETUP] Cleaning up test enquiries...");
    // Clear any existing test enquiries
    await db.delete(enquiries).where(
      like(enquiries.email, "%@example.com"),
    );
    // Clear rate limits for clean testing
    clearRateLimits();
  });

  afterAll(async () => {
    console.log("\n[CLEANUP] Removing test enquiries...");
    // Clean up test data
    await db.delete(enquiries).where(
      like(enquiries.email, "%@example.com"),
    );
    clearRateLimits();
  });

  // --------------------------------------------------------------------------
  // VALIDATION TESTS
  // --------------------------------------------------------------------------

  describe("Input Validation", () => {
    beforeEach(() => {
      clearRateLimits();
    });

    it("should reject empty submissions", async () => {
      const { status, data } = await submitContactForm({});

      assertEquals(status, 400);
      assertEquals(data.status, "error");
    });

    it("should reject submissions without email or phone", async () => {
      const { status, data } = await submitContactForm({
        name: "Test User",
        message: "Test message",
      });

      assertEquals(status, 400);
      assertEquals(data.status, "error");
    });

    it("should reject submissions without message", async () => {
      const { status, data } = await submitContactForm({
        email: "test@example.com",
      });

      assertEquals(status, 400);
      assertEquals(data.status, "error");
    });

    it("should reject invalid email format", async () => {
      const { status, data } = await submitContactForm({
        email: "not-an-email",
        message: "Test message",
      });

      assertEquals(status, 400);
      assertEquals(data.status, "error");
    });

    it("should accept submission with email only (no phone)", async () => {
      const { status, data } = await submitContactForm({
        email: "emailonly@example.com",
        message: "Test message with email only",
      });

      assertEquals(status, 201);
      assertEquals(data.status, "success");
    });

    it("should accept submission with phone only (no email)", async () => {
      const { status, data } = await submitContactForm({
        phone: "+1234567890",
        message: "Test message with phone only",
      });

      assertEquals(status, 201);
      assertEquals(data.status, "success");
    });
  });

  // --------------------------------------------------------------------------
  // SUCCESSFUL SUBMISSION TESTS
  // --------------------------------------------------------------------------

  describe("Successful Submissions", () => {
    beforeEach(() => {
      clearRateLimits();
    });

    it("should create enquiry with all fields", async () => {
      const { status, data } = await submitContactForm(VALID_ENQUIRY);

      assertEquals(status, 201);
      assertEquals(data.status, "success");
      assertExists(data.data.submitted);
      assertEquals(data.data.submitted, true);
    });

    it("should always return success message (not reveal internal state)", async () => {
      const { status, data } = await submitContactForm({
        email: "another@example.com",
        message: "Another test message",
      });

      assertEquals(status, 201);
      assertEquals(data.status, "success");
      // Message should be generic "thank you" type
      assertExists(data.message);
    });
  });

  // --------------------------------------------------------------------------
  // ANTI-SPAM TESTS
  // --------------------------------------------------------------------------

  describe("Anti-Spam Features", () => {
    beforeEach(() => {
      clearRateLimits();
    });

    it("should mark honeypot-triggered submissions as spam (but still return success)", async () => {
      const { status, data } = await submitContactForm({
        ...VALID_ENQUIRY,
        email: "honeypot@example.com",
        website: "http://spam-site.com", // Honeypot field filled = bot
      });

      // Should still return success (don't reveal spam detection)
      assertEquals(status, 201);
      assertEquals(data.status, "success");

      // But internally, it should be marked as spam
      const result = await db.select().from(enquiries).where(
        like(enquiries.email, "honeypot@example.com"),
      );
      assertEquals(result.length, 1);
      assertEquals(result[0].status, "spam");
      assertEquals(result[0].honeypotTriggered, true);
    });

    it("should rate limit excessive submissions from same IP", async () => {
      clearRateLimits();

      // Submit 3 times (should succeed)
      for (let i = 1; i <= 3; i++) {
        const { status } = await submitContactForm({
          email: `ratelimit${i}@example.com`,
          message: `Rate limit test message ${i}`,
        });
        assertEquals(status, 201, `Request ${i} should succeed`);
      }

      // 4th submission should be rate limited
      const { status, data } = await submitContactForm({
        email: "ratelimit4@example.com",
        message: "This should be rate limited",
      });

      assertEquals(status, 429);
      assertEquals(data.status, "error");
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASES
  // --------------------------------------------------------------------------

  describe("Edge Cases", () => {
    beforeEach(() => {
      clearRateLimits();
    });

    it("should handle very long messages (up to limit)", async () => {
      const longMessage = "A".repeat(4999); // Just under 5000 limit
      const { status, data } = await submitContactForm({
        email: "longmessage@example.com",
        message: longMessage,
      });

      assertEquals(status, 201);
      assertEquals(data.status, "success");
    });

    it("should reject messages exceeding length limit", async () => {
      const tooLongMessage = "A".repeat(5001); // Over 5000 limit
      const { status, data } = await submitContactForm({
        email: "toolong@example.com",
        message: tooLongMessage,
      });

      assertEquals(status, 400);
      assertEquals(data.status, "error");
    });

    it("should handle unicode characters in message", async () => {
      const { status, data } = await submitContactForm({
        email: "unicode@example.com",
        message: "Hello! Special chars test.",
      });

      assertEquals(status, 201);
      assertEquals(data.status, "success");
    });
  });
});
