/**
 * Notification Service Tests
 *
 * Tests for the fire-and-forget notification service.
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { NotificationService } from "./notification.service.ts";

describe("NotificationService", () => {
  describe("initialization", () => {
    it("should handle missing email provider gracefully", async () => {
      // Clear any email-related env vars for this test
      const originalResend = Deno.env.get("RESEND_API_KEY");
      const originalSmtpHost = Deno.env.get("SMTP_HOST");
      const originalAwsRegion = Deno.env.get("AWS_REGION");

      Deno.env.delete("RESEND_API_KEY");
      Deno.env.delete("SMTP_HOST");
      Deno.env.delete("AWS_REGION");

      try {
        const service = new NotificationService();

        // Should not throw - just logs warning
        await service.sendWelcomeEmail("test@example.com", "Test User");

        // If we get here without error, the graceful handling works
        assertEquals(true, true);
      } finally {
        // Restore env vars
        if (originalResend) Deno.env.set("RESEND_API_KEY", originalResend);
        if (originalSmtpHost) Deno.env.set("SMTP_HOST", originalSmtpHost);
        if (originalAwsRegion) Deno.env.set("AWS_REGION", originalAwsRegion);
      }
    });

    it("should export singleton instance", async () => {
      // Import the singleton
      const { notificationService } = await import(
        "./notification.service.ts"
      );

      assertEquals(typeof notificationService, "object");
      assertEquals(typeof notificationService.sendWelcomeEmail, "function");
      assertEquals(
        typeof notificationService.sendOrderConfirmationEmail,
        "function",
      );
    });
  });

  describe("method signatures", () => {
    it("should have all expected methods", () => {
      const service = new NotificationService();

      // Auth emails
      assertEquals(typeof service.sendWelcomeEmail, "function");
      assertEquals(typeof service.sendVerificationEmail, "function");
      assertEquals(typeof service.sendPasswordResetEmail, "function");

      // Order emails
      assertEquals(typeof service.sendOrderConfirmationEmail, "function");
      assertEquals(typeof service.sendOrderProcessingEmail, "function");
      assertEquals(typeof service.sendOrderShippedEmail, "function");
      assertEquals(typeof service.sendOrderDeliveredEmail, "function");
      assertEquals(typeof service.sendOrderCancelledEmail, "function");
    });
  });

  describe("fire-and-forget behavior", () => {
    it("should not throw when sending email without provider", async () => {
      // Ensure no provider is configured
      const originalResend = Deno.env.get("RESEND_API_KEY");
      Deno.env.delete("RESEND_API_KEY");

      try {
        const service = new NotificationService();

        // All these should complete without throwing
        await service.sendWelcomeEmail("test@example.com", "User");
        await service.sendVerificationEmail(
          "test@example.com",
          "User",
          "https://verify.example.com",
        );
        await service.sendPasswordResetEmail(
          "test@example.com",
          "User",
          "https://reset.example.com",
        );

        // Order emails
        await service.sendOrderConfirmationEmail("test@example.com", {
          userName: "User",
          orderNumber: "ORD-001",
          orderDate: "Jan 1, 2025",
          items: [{ name: "Test", quantity: 1, price: 100 }],
          subtotal: 100,
          shipping: 0,
          tax: 0,
          total: 100,
          shippingAddress: {
            fullName: "Test User",
            addressLine1: "123 Test St",
            city: "Test City",
            state: "TS",
            postalCode: "12345",
            country: "India",
          },
        });

        await service.sendOrderProcessingEmail("test@example.com", {
          userName: "User",
          orderNumber: "ORD-001",
          shippingAddress: {
            fullName: "Test User",
            addressLine1: "123 Test St",
            city: "Test City",
            state: "TS",
            postalCode: "12345",
            country: "India",
          },
        });

        await service.sendOrderShippedEmail("test@example.com", {
          userName: "User",
          orderNumber: "ORD-001",
          shippingAddress: {
            fullName: "Test User",
            addressLine1: "123 Test St",
            city: "Test City",
            state: "TS",
            postalCode: "12345",
            country: "India",
          },
        });

        await service.sendOrderDeliveredEmail("test@example.com", {
          userName: "User",
          orderNumber: "ORD-001",
          shippingAddress: {
            fullName: "Test User",
            addressLine1: "123 Test St",
            city: "Test City",
            state: "TS",
            postalCode: "12345",
            country: "India",
          },
        });

        await service.sendOrderCancelledEmail("test@example.com", {
          userName: "User",
          orderNumber: "ORD-001",
          cancelledBy: "user",
        });

        // All passed without throwing
        assertEquals(true, true);
      } finally {
        if (originalResend) Deno.env.set("RESEND_API_KEY", originalResend);
      }
    });
  });
});
