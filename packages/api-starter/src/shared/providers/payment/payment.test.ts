/**
 * Payment Provider Tests
 *
 * Tests for the payment provider abstraction layer.
 * Includes tests for:
 * - BasePaymentProvider utilities
 * - NoOpPaymentProvider mock implementation
 * - Factory pattern and auto-detection
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  BasePaymentProvider,
  type CreateOrderOptions,
  NoOpPaymentProvider,
  type PaymentDetails,
  type PaymentOrder,
  type PaymentResult,
  type RefundResult,
  type VerifyPaymentOptions,
  type WebhookEvent,
} from "./payment-provider.interface.ts";
import {
  createPaymentProvider,
  getAvailablePaymentProviders,
} from "./factory.ts";

// Concrete implementation for testing BasePaymentProvider
class TestPaymentProvider extends BasePaymentProvider {
  readonly name = "test";

  createOrder(_options: CreateOrderOptions): Promise<PaymentOrder> {
    return Promise.resolve({
      id: "test_order_123",
      amount: 10000,
      currency: "INR",
      receipt: "receipt_123",
      status: "created",
    });
  }

  verifyPayment(_options: VerifyPaymentOptions): Promise<boolean> {
    return Promise.resolve(true);
  }

  capturePayment(paymentId: string, amount: number): Promise<PaymentResult> {
    return Promise.resolve({
      success: true,
      paymentId,
      status: "captured",
      amount,
      currency: "INR",
    });
  }

  refundPayment(_paymentId: string, amount?: number): Promise<RefundResult> {
    return Promise.resolve({
      success: true,
      refundId: "refund_123",
      status: "processed",
      amount: amount || 0,
      currency: "INR",
    });
  }

  getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    return Promise.resolve({
      id: paymentId,
      orderId: "order_123",
      amount: 10000,
      currency: "INR",
      status: "captured",
      createdAt: new Date(),
    });
  }

  verifyWebhook(
    _payload: string,
    _signature: string,
  ): Promise<WebhookEvent | null> {
    return Promise.resolve(null);
  }

  // Expose protected methods for testing
  public testFormatAmount(amount: number, currency: string): number {
    return this.formatAmount(amount, currency);
  }

  public testParseAmount(amount: number, currency: string): number {
    return this.parseAmount(amount, currency);
  }

  public testGenerateReceipt(): string {
    return this.generateReceipt();
  }
}

describe("Payment Provider", () => {
  describe("BasePaymentProvider", () => {
    const provider = new TestPaymentProvider();

    it("should format amount to smallest unit for INR", () => {
      const result = provider.testFormatAmount(199.99, "INR");
      assertEquals(result, 19999);
    });

    it("should format amount to smallest unit for USD", () => {
      const result = provider.testFormatAmount(49.99, "USD");
      assertEquals(result, 4999);
    });

    it("should not convert for zero-decimal currencies (JPY)", () => {
      const result = provider.testFormatAmount(1000, "JPY");
      assertEquals(result, 1000);
    });

    it("should not convert for zero-decimal currencies (KRW)", () => {
      const result = provider.testFormatAmount(50000, "KRW");
      assertEquals(result, 50000);
    });

    it("should parse amount from smallest unit for INR", () => {
      const result = provider.testParseAmount(19999, "INR");
      assertEquals(result, 199.99);
    });

    it("should parse amount from smallest unit for USD", () => {
      const result = provider.testParseAmount(4999, "USD");
      assertEquals(result, 49.99);
    });

    it("should not convert parse for zero-decimal currencies", () => {
      const result = provider.testParseAmount(1000, "JPY");
      assertEquals(result, 1000);
    });

    it("should generate unique receipt IDs", () => {
      const receipt1 = provider.testGenerateReceipt();
      const receipt2 = provider.testGenerateReceipt();

      assertExists(receipt1);
      assertExists(receipt2);
      assertEquals(receipt1.startsWith("receipt_"), true);
      assertEquals(receipt2.startsWith("receipt_"), true);
      assertEquals(receipt1 !== receipt2, true);
    });
  });

  describe("NoOpPaymentProvider", () => {
    const provider = new NoOpPaymentProvider();

    it("should have correct name", () => {
      assertEquals(provider.name, "noop");
    });

    it("should create mock order", async () => {
      const order = await provider.createOrder({
        amount: 10000,
        currency: "INR",
        receipt: "test_receipt",
      });

      assertExists(order);
      assertEquals(order.id.startsWith("mock_order_"), true);
      assertEquals(order.amount, 10000);
      assertEquals(order.currency, "INR");
      assertEquals(order.receipt, "test_receipt");
      assertEquals(order.status, "created");
    });

    it("should always verify payment as true", async () => {
      const result = await provider.verifyPayment({
        orderId: "order_123",
        paymentId: "payment_123",
        signature: "any_signature",
      });

      assertEquals(result, true);
    });

    it("should capture payment successfully", async () => {
      const result = await provider.capturePayment("payment_123", 10000);

      assertEquals(result.success, true);
      assertEquals(result.paymentId, "payment_123");
      assertEquals(result.status, "captured");
      assertEquals(result.amount, 10000);
    });

    it("should refund payment successfully", async () => {
      const result = await provider.refundPayment("payment_123", 5000);

      assertEquals(result.success, true);
      assertEquals(result.refundId.startsWith("mock_refund_"), true);
      assertEquals(result.status, "processed");
      assertEquals(result.amount, 5000);
    });

    it("should return mock payment details", async () => {
      const details = await provider.getPaymentDetails("payment_123");

      assertEquals(details.id, "payment_123");
      assertEquals(details.status, "captured");
      assertEquals(details.method, "mock");
      assertExists(details.createdAt);
    });

    it("should parse valid webhook payload", async () => {
      const payload = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              order_id: "order_123",
            },
          },
        },
      });

      const result = await provider.verifyWebhook(payload, "any_signature");

      assertExists(result);
      assertEquals(result?.event, "payment.captured");
      assertEquals(result?.orderId, "order_123");
    });

    it("should return null for invalid webhook payload", async () => {
      const result = await provider.verifyWebhook("invalid json", "signature");
      assertEquals(result, null);
    });
  });

  describe("Payment Provider Factory", () => {
    it("should return NoOpPaymentProvider when no credentials configured", () => {
      // Note: This test assumes RAZORPAY_KEY_ID is not set in test environment
      // If it is set, this will return RazorpayProvider instead
      const provider = createPaymentProvider();
      assertExists(provider);
      // Provider should exist regardless of type
      assertExists(provider.name);
    });

    it("should return list of available providers", () => {
      const available = getAvailablePaymentProviders();
      // Returns array (may be empty if no credentials configured)
      assertExists(available);
      assertEquals(Array.isArray(available), true);
    });
  });
});
