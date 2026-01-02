/**
 * Email Provider Tests
 *
 * Tests for the email provider abstraction and service.
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  BaseEmailProvider,
  type EmailOptions,
  type EmailProviderConfig as _EmailProviderConfig,
  type EmailResult,
  type IEmailProvider as _IEmailProvider,
} from "./email-provider.interface.ts";
import { EmailService } from "./email.service.ts";
import {
  orderConfirmationEmailTemplate,
  passwordResetEmailTemplate,
  verificationEmailTemplate,
  welcomeEmailTemplate,
} from "./templates/index.ts";

/**
 * Mock Email Provider for testing
 */
class MockEmailProvider extends BaseEmailProvider {
  readonly name = "mock";
  public sentEmails: EmailOptions[] = [];
  public shouldFail = false;
  public failureMessage = "Mock failure";

  constructor() {
    super({ from: "test@example.com" });
  }

  send(options: EmailOptions): Promise<EmailResult> {
    if (this.shouldFail) {
      return Promise.resolve({
        success: false,
        error: this.failureMessage,
      });
    }

    this.sentEmails.push(options);
    return Promise.resolve({
      success: true,
      messageId: `mock-${Date.now()}`,
    });
  }

  verify(): Promise<boolean> {
    return Promise.resolve(!this.shouldFail);
  }

  reset(): void {
    this.sentEmails = [];
    this.shouldFail = false;
  }
}

describe("Email Provider Interface", () => {
  describe("BaseEmailProvider", () => {
    it("should normalize single email address string", () => {
      const provider = new MockEmailProvider();
      const result = provider["normalizeAddress"]("test@example.com");
      assertEquals(result, "test@example.com");
    });

    it("should normalize email address object without name", () => {
      const provider = new MockEmailProvider();
      const result = provider["normalizeAddress"]({
        email: "test@example.com",
      });
      assertEquals(result, "test@example.com");
    });

    it("should normalize email address object with name", () => {
      const provider = new MockEmailProvider();
      const result = provider["normalizeAddress"]({
        email: "test@example.com",
        name: "John Doe",
      });
      assertEquals(result, "John Doe <test@example.com>");
    });

    it("should normalize multiple addresses", () => {
      const provider = new MockEmailProvider();
      const result = provider["normalizeAddresses"]([
        "test1@example.com",
        { email: "test2@example.com", name: "Jane" },
      ]);
      assertEquals(result, ["test1@example.com", "Jane <test2@example.com>"]);
    });

    it("should strip HTML to plain text", () => {
      const provider = new MockEmailProvider();
      const html = "<h1>Hello</h1> <p>World</p>";
      const result = provider["htmlToText"](html);
      assertEquals(result, "Hello World");
    });
  });
});

describe("MockEmailProvider", () => {
  it("should send email successfully", async () => {
    const provider = new MockEmailProvider();
    const result = await provider.send({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    assertEquals(result.success, true);
    assertExists(result.messageId);
    assertEquals(provider.sentEmails.length, 1);
  });

  it("should fail when configured to fail", async () => {
    const provider = new MockEmailProvider();
    provider.shouldFail = true;
    provider.failureMessage = "SMTP error";

    const result = await provider.send({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    assertEquals(result.success, false);
    assertEquals(result.error, "SMTP error");
    assertEquals(provider.sentEmails.length, 0);
  });

  it("should send batch emails", async () => {
    const provider = new MockEmailProvider();
    const results = await provider.sendBatch([
      { to: "user1@example.com", subject: "Test 1", html: "<p>1</p>" },
      { to: "user2@example.com", subject: "Test 2", html: "<p>2</p>" },
    ]);

    assertEquals(results.length, 2);
    assertEquals(results[0].success, true);
    assertEquals(results[1].success, true);
    assertEquals(provider.sentEmails.length, 2);
  });
});

describe("EmailService", () => {
  const config = {
    appName: "Test App",
    appUrl: "https://test.example.com",
    supportEmail: "support@example.com",
  };

  it("should send verification email", async () => {
    const provider = new MockEmailProvider();
    const service = new EmailService(provider, config);

    const result = await service.sendVerificationEmail(
      "user@example.com",
      "John",
      "https://test.example.com/verify?token=abc123",
      24,
    );

    assertEquals(result.success, true);
    assertEquals(provider.sentEmails.length, 1);

    const sent = provider.sentEmails[0];
    assertEquals(sent.to, "user@example.com");
    assertEquals(sent.subject, "Verify your email - Test App");
    assertExists(sent.html);
    assertExists(sent.text);
  });

  it("should send password reset email", async () => {
    const provider = new MockEmailProvider();
    const service = new EmailService(provider, config);

    const result = await service.sendPasswordResetEmail(
      "user@example.com",
      "John",
      "https://test.example.com/reset?token=xyz789",
      1,
    );

    assertEquals(result.success, true);
    assertEquals(provider.sentEmails.length, 1);

    const sent = provider.sentEmails[0];
    assertEquals(sent.subject, "Reset your password - Test App");
  });

  it("should send welcome email", async () => {
    const provider = new MockEmailProvider();
    const service = new EmailService(provider, config);

    const result = await service.sendWelcomeEmail("user@example.com", "John");

    assertEquals(result.success, true);
    assertEquals(provider.sentEmails.length, 1);

    const sent = provider.sentEmails[0];
    assertEquals(sent.subject, "Welcome to Test App!");
  });

  it("should send order confirmation email", async () => {
    const provider = new MockEmailProvider();
    const service = new EmailService(provider, config);

    const result = await service.sendOrderConfirmationEmail(
      "user@example.com",
      {
        userName: "John",
        orderNumber: "ORD-001",
        orderDate: "Dec 31, 2025",
        items: [{ name: "Test Product", quantity: 2, price: 999 }],
        subtotal: 1998,
        shipping: 0,
        tax: 0,
        total: 1998,
        shippingAddress: {
          fullName: "John Doe",
          addressLine1: "123 Main St",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
        },
      },
    );

    assertEquals(result.success, true);
    assertEquals(provider.sentEmails.length, 1);

    const sent = provider.sentEmails[0];
    assertEquals(sent.subject, "Order Confirmed - ORD-001 | Test App");
  });

  it("should send raw email", async () => {
    const provider = new MockEmailProvider();
    const service = new EmailService(provider, config);

    const result = await service.sendRaw(
      "user@example.com",
      "Custom Subject",
      "<p>Custom HTML</p>",
      "Custom text",
    );

    assertEquals(result.success, true);
    assertEquals(provider.sentEmails.length, 1);

    const sent = provider.sentEmails[0];
    assertEquals(sent.subject, "Custom Subject");
    assertEquals(sent.html, "<p>Custom HTML</p>");
    assertEquals(sent.text, "Custom text");
  });
});

describe("Email Templates", () => {
  describe("verificationEmailTemplate", () => {
    it("should generate verification email", () => {
      const template = verificationEmailTemplate({
        userName: "John",
        verificationUrl: "https://example.com/verify?token=abc",
        expiresInHours: 24,
        appName: "Test App",
      });

      assertEquals(template.subject, "Verify your email - Test App");
      assertEquals(template.html.includes("John"), true);
      assertEquals(
        template.html.includes("https://example.com/verify?token=abc"),
        true,
      );
      assertEquals(template.html.includes("24 hours"), true);
      assertEquals(template.text.includes("John"), true);
    });
  });

  describe("passwordResetEmailTemplate", () => {
    it("should generate password reset email", () => {
      const template = passwordResetEmailTemplate({
        userName: "John",
        resetUrl: "https://example.com/reset?token=xyz",
        expiresInHours: 1,
        appName: "Test App",
      });

      assertEquals(template.subject, "Reset your password - Test App");
      assertEquals(template.html.includes("John"), true);
      assertEquals(
        template.html.includes("https://example.com/reset?token=xyz"),
        true,
      );
      assertEquals(template.html.includes("1 hour"), true);
    });
  });

  describe("welcomeEmailTemplate", () => {
    it("should generate welcome email", () => {
      const template = welcomeEmailTemplate({
        userName: "John",
        appName: "Test App",
        appUrl: "https://example.com",
      });

      assertEquals(template.subject, "Welcome to Test App!");
      assertEquals(template.html.includes("John"), true);
      assertEquals(template.html.includes("https://example.com"), true);
    });
  });

  describe("orderConfirmationEmailTemplate", () => {
    it("should generate order confirmation email", () => {
      const template = orderConfirmationEmailTemplate({
        userName: "John",
        orderNumber: "ORD-001",
        orderDate: "Dec 31, 2025",
        items: [
          { name: "Product A", quantity: 1, price: 500 },
          { name: "Product B", variant: "Red", quantity: 2, price: 300 },
        ],
        subtotal: 1100,
        shipping: 50,
        tax: 100,
        total: 1250,
        shippingAddress: {
          fullName: "John Doe",
          addressLine1: "123 Main St",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
        },
        appName: "Test App",
        appUrl: "https://example.com",
      });

      assertEquals(template.subject, "Order Confirmed - ORD-001 | Test App");
      assertEquals(template.html.includes("ORD-001"), true);
      assertEquals(template.html.includes("Product A"), true);
      assertEquals(template.html.includes("Product B"), true);
      assertEquals(template.html.includes("Red"), true);
      assertEquals(template.html.includes("John Doe"), true);
    });

    it("should show FREE shipping when amount is 0", () => {
      const template = orderConfirmationEmailTemplate({
        userName: "John",
        orderNumber: "ORD-001",
        orderDate: "Dec 31, 2025",
        items: [{ name: "Product", quantity: 1, price: 1000 }],
        subtotal: 1000,
        shipping: 0,
        tax: 0,
        total: 1000,
        shippingAddress: {
          fullName: "John Doe",
          addressLine1: "123 Main St",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
        },
        appName: "Test App",
        appUrl: "https://example.com",
      });

      assertEquals(template.html.includes("FREE"), true);
      assertEquals(template.text.includes("FREE"), true);
    });
  });
});
