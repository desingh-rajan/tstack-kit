import { eq, sql } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { type NewPayment, payments } from "./payment.model.ts";
import { orders } from "../orders/order.model.ts";
import { users } from "../../auth/user.model.ts";
import { addresses } from "../addresses/address.model.ts";
import { products } from "../products/product.model.ts";
import { productVariants } from "../product_variants/product-variant.model.ts";
import {
  type PaymentDetails,
  type PaymentOrder,
  paymentProvider,
} from "../../shared/providers/payment/index.ts";
import { BadRequestError, NotFoundError } from "../../shared/utils/errors.ts";
import { config } from "../../config/env.ts";
import {
  type EmailOptions,
  type EmailResult,
  EmailService,
  type IEmailProvider,
} from "../../shared/providers/email/index.ts";

// Simple no-op email provider for development/testing
class NoOpEmailProvider implements IEmailProvider {
  readonly name = "noop";

  send(options: EmailOptions): Promise<EmailResult> {
    console.log(
      `[Email] Would send to: ${
        JSON.stringify(options.to)
      }, subject: ${options.subject}`,
    );
    return Promise.resolve({ success: true, messageId: `noop-${Date.now()}` });
  }

  sendBatch(emails: EmailOptions[]): Promise<EmailResult[]> {
    return Promise.all(emails.map((e) => this.send(e)));
  }
}

// Create email service instance
const emailProvider = new NoOpEmailProvider();
const emailService = new EmailService(emailProvider, {
  appName: Deno.env.get("APP_NAME") || "TS Mart",
  appUrl: Deno.env.get("APP_URL") || "http://localhost:8000",
});

import type {
  PaymentOrderResponse,
  PaymentStatusResponse,
  PaymentVerifyResponse,
  RefundResponse,
} from "./payment.dto.ts";

/**
 * Payment Service
 *
 * Handles payment operations using the configured payment provider.
 * Provider is auto-detected from environment variables via factory pattern.
 *
 * Operations:
 * - Create payment orders
 * - Verify payment signatures
 * - Update order status on successful payment
 * - Process refunds
 * - Handle webhooks
 */
export class PaymentService {
  /**
   * Create a Razorpay order for an existing order
   *
   * Called when user clicks "Pay Now"
   */
  async createPaymentOrder(
    userId: number,
    orderId: string,
  ): Promise<PaymentOrderResponse> {
    // Get order
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    const orderRecord = order[0];

    // Verify order belongs to user
    if (orderRecord.userId !== userId) {
      throw new NotFoundError("Order not found");
    }

    // Check order status - must be pending
    if (orderRecord.status !== "pending") {
      throw new BadRequestError(
        `Cannot create payment for order with status "${orderRecord.status}"`,
      );
    }

    // Check if payment already exists and is captured
    const existingPayment = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (
      existingPayment.length > 0 && existingPayment[0].status === "captured"
    ) {
      throw new BadRequestError("Order already paid");
    }

    // Get user details for prefill
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Get shipping address for contact
    let contact: string | undefined;
    if (orderRecord.shippingAddressId) {
      const address = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, orderRecord.shippingAddressId))
        .limit(1);
      if (address.length > 0) {
        contact = address[0].phone;
      }
    }

    // Convert amount to smallest unit (e.g. cents for USD, paise for INR)
    const amountInSmallestUnit = Math.round(
      parseFloat(orderRecord.totalAmount) * 100,
    );

    // Create payment order via provider
    let razorpayOrder: PaymentOrder;
    try {
      razorpayOrder = await paymentProvider.createOrder({
        amount: amountInSmallestUnit,
        currency: config.currency,
        receipt: orderRecord.orderNumber,
        notes: {
          orderId: orderId,
          orderNumber: orderRecord.orderNumber,
          userId: String(userId),
        },
      });
    } catch (error) {
      console.error("[PaymentService] Failed to create Razorpay order:", error);
      throw new BadRequestError("Failed to create payment order");
    }

    // Store payment record
    const paymentData: NewPayment = {
      orderId: orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: orderRecord.totalAmount,
      currency: config.currency,
      status: "created",
    };

    // Store payment record and update order atomically
    await db.transaction(async (tx) => {
      // Upsert payment record (in case of retry)
      if (existingPayment.length > 0) {
        await tx
          .update(payments)
          .set({
            razorpayOrderId: razorpayOrder.id,
            status: "created",
            razorpayPaymentId: null,
            razorpaySignature: null,
            errorCode: null,
            errorDescription: null,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, existingPayment[0].id));
      } else {
        await tx.insert(payments).values(paymentData);
      }

      // Update order with Razorpay order ID
      await tx
        .update(orders)
        .set({
          razorpayOrderId: razorpayOrder.id,
          paymentMethod: "razorpay",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    });

    // Get provider-specific key for frontend (Razorpay-specific)
    const providerKeyId =
      (paymentProvider as unknown as { keyId?: string }).keyId ||
      Deno.env.get("RAZORPAY_KEY_ID") ||
      "";

    return {
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: providerKeyId,
      amount: amountInSmallestUnit,
      currency: config.currency,
      orderId: orderId,
      orderNumber: orderRecord.orderNumber,
      prefill: {
        email: user[0]?.email,
        contact: contact,
      },
    };
  }

  /**
   * Verify payment after Razorpay checkout returns
   *
   * This is called by the frontend after successful payment
   */
  async verifyPayment(
    userId: number,
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<PaymentVerifyResponse> {
    // Get order
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    const orderRecord = order[0];

    // Verify order belongs to user
    if (orderRecord.userId !== userId) {
      throw new NotFoundError("Order not found");
    }

    // Verify Razorpay order ID matches
    if (orderRecord.razorpayOrderId !== razorpayOrderId) {
      throw new BadRequestError("Invalid Razorpay order ID");
    }

    // Verify signature via provider
    const isValid = await paymentProvider.verifyPayment({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      // Update payment as failed
      await this.updatePaymentFailed(
        orderId,
        razorpayOrderId,
        "invalid_signature",
        "Signature verification failed",
      );

      throw new BadRequestError("Payment verification failed");
    }

    // Get payment details from provider
    let paymentDetails: PaymentDetails | undefined;
    try {
      paymentDetails = await paymentProvider.getPaymentDetails(
        razorpayPaymentId,
      );
    } catch (error) {
      console.error("[PaymentService] Failed to get payment details:", error);
    }

    // Update payment and order atomically
    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          razorpayPaymentId: razorpayPaymentId,
          razorpaySignature: razorpaySignature,
          status: "captured",
          method: paymentDetails?.method,
          bank: paymentDetails?.bank,
          wallet: paymentDetails?.wallet,
          vpa: paymentDetails?.vpa,
          cardLast4: paymentDetails?.card?.last4,
          cardNetwork: paymentDetails?.card?.network,
          cardType: paymentDetails?.card?.type,
          email: paymentDetails?.email,
          contact: paymentDetails?.contact,
          paidAt: new Date(),
          razorpayResponse: paymentDetails?.raw as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(payments.razorpayOrderId, razorpayOrderId));

      // Update order status
      await tx
        .update(orders)
        .set({
          razorpayPaymentId: razorpayPaymentId,
          paymentStatus: "paid",
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    });

    // Send order confirmation email
    await this.sendOrderConfirmationEmail(orderId);

    return {
      success: true,
      orderId: orderId,
      orderNumber: orderRecord.orderNumber,
      paymentId: razorpayPaymentId,
      status: "captured",
      message: "Payment successful",
    };
  }

  /**
   * Update payment as failed
   */
  private async updatePaymentFailed(
    orderId: string,
    razorpayOrderId: string,
    errorCode: string,
    errorDescription: string,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          status: "failed",
          errorCode: errorCode,
          errorDescription: errorDescription,
          failedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.razorpayOrderId, razorpayOrderId));

      await tx
        .update(orders)
        .set({
          paymentStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    });
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(
    userId: number,
    orderId: string,
  ): Promise<PaymentStatusResponse> {
    // Get order
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    const orderRecord = order[0];

    // Verify order belongs to user
    if (orderRecord.userId !== userId) {
      throw new NotFoundError("Order not found");
    }

    // Get payment record
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    const response: PaymentStatusResponse = {
      orderId: orderId,
      orderNumber: orderRecord.orderNumber,
      paymentStatus: orderRecord.paymentStatus,
    };

    if (payment.length > 0) {
      response.payment = {
        id: payment[0].id,
        razorpayPaymentId: payment[0].razorpayPaymentId,
        amount: payment[0].amount,
        currency: payment[0].currency,
        method: payment[0].method,
        status: payment[0].status,
        paidAt: payment[0].paidAt?.toISOString() || null,
      };
    }

    return response;
  }

  /**
   * Process refund (admin only)
   */
  async refundPayment(
    orderId: string,
    amount?: number,
  ): Promise<RefundResponse> {
    // Get order
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    const orderRecord = order[0];

    // Check payment status
    if (orderRecord.paymentStatus !== "paid") {
      throw new BadRequestError("Order has not been paid");
    }

    // Get payment record
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (payment.length === 0 || !payment[0].razorpayPaymentId) {
      throw new BadRequestError("No payment found for this order");
    }

    const paymentRecord = payment[0];
    const razorpayPaymentId = payment[0].razorpayPaymentId!; // Non-null assertion - guaranteed by check above

    // Calculate refund amount in paise
    const refundAmountInPaise = amount
      ? Math.round(amount * 100)
      : Math.round(parseFloat(paymentRecord.amount) * 100);

    // Process refund via payment provider
    let refundResult;
    try {
      refundResult = await paymentProvider.refundPayment(
        razorpayPaymentId,
        refundAmountInPaise,
      );
    } catch (error) {
      console.error("[PaymentService] Refund failed:", error);
      throw new BadRequestError("Refund failed");
    }

    // Update payment and order atomically
    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          status: "refunded",
          refundedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentRecord.id));

      await tx
        .update(orders)
        .set({
          paymentStatus: "refunded",
          status: "refunded",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    });

    return {
      success: refundResult.success,
      refundId: refundResult.refundId,
      amount: refundResult.amount / 100, // Convert paise to INR
      status: refundResult.status,
    };
  }

  /**
   * Handle Razorpay webhook
   */
  async handleWebhook(
    payload: string,
    signature: string,
  ): Promise<{ handled: boolean; event?: string }> {
    // Verify webhook via provider
    const webhookEvent = await paymentProvider.verifyWebhook(
      payload,
      signature,
    );

    if (!webhookEvent) {
      return { handled: false };
    }

    console.log(`[PaymentService] Webhook event: ${webhookEvent.event}`);

    switch (webhookEvent.event) {
      case "payment.captured": {
        // Payment successful - update order if not already updated
        const capturedOrderId = webhookEvent.orderId;
        const capturedPayment = webhookEvent.payment;
        if (capturedOrderId && capturedPayment) {
          const order = await db
            .select()
            .from(orders)
            .where(eq(orders.razorpayOrderId, capturedOrderId))
            .limit(1);

          if (order.length > 0 && order[0].paymentStatus !== "paid") {
            await db.transaction(async (tx) => {
              await tx
                .update(payments)
                .set({
                  razorpayPaymentId: capturedPayment.id,
                  status: "captured",
                  method: capturedPayment.method,
                  bank: capturedPayment.bank,
                  wallet: capturedPayment.wallet,
                  vpa: capturedPayment.vpa,
                  paidAt: new Date(),
                  razorpayResponse: webhookEvent.raw as Record<string, unknown>,
                  updatedAt: new Date(),
                })
                .where(eq(payments.razorpayOrderId, capturedOrderId));

              await tx
                .update(orders)
                .set({
                  razorpayPaymentId: capturedPayment.id,
                  paymentStatus: "paid",
                  status: "confirmed",
                  updatedAt: new Date(),
                })
                .where(eq(orders.id, order[0].id));
            });

            // Send confirmation email
            await this.sendOrderConfirmationEmail(order[0].id);
          }
        }
        break;
      }

      case "payment.failed": {
        // Payment failed
        const failedOrderId = webhookEvent.orderId;
        if (failedOrderId) {
          const order = await db
            .select()
            .from(orders)
            .where(eq(orders.razorpayOrderId, failedOrderId))
            .limit(1);

          await db.transaction(async (tx) => {
            await tx
              .update(payments)
              .set({
                status: "failed",
                failedAt: new Date(),
                razorpayResponse: webhookEvent.raw as Record<string, unknown>,
                updatedAt: new Date(),
              })
              .where(eq(payments.razorpayOrderId, failedOrderId));

            if (order.length > 0) {
              await tx
                .update(orders)
                .set({
                  paymentStatus: "failed",
                  updatedAt: new Date(),
                })
                .where(eq(orders.id, order[0].id));
            }
          });
        }
        break;
      }

      case "refund.created":
      case "refund.processed": {
        // Refund processed
        const refundOrderId = webhookEvent.orderId;
        if (refundOrderId) {
          const order = await db
            .select()
            .from(orders)
            .where(eq(orders.razorpayOrderId, refundOrderId))
            .limit(1);

          await db.transaction(async (tx) => {
            await tx
              .update(payments)
              .set({
                status: "refunded",
                refundedAt: new Date(),
                razorpayResponse: webhookEvent.raw as Record<string, unknown>,
                updatedAt: new Date(),
              })
              .where(eq(payments.razorpayOrderId, refundOrderId));

            if (order.length > 0) {
              await tx
                .update(orders)
                .set({
                  paymentStatus: "refunded",
                  status: "refunded",
                  updatedAt: new Date(),
                })
                .where(eq(orders.id, order[0].id));
            }
          });
        }
        break;
      }
    }

    return { handled: true, event: webhookEvent.event };
  }

  // ==================== GUEST PAYMENT METHODS ====================

  /**
   * Create a Razorpay order for a guest order
   * Validates guest ownership via email
   */
  async createGuestPaymentOrder(
    orderId: string,
    email: string,
  ): Promise<PaymentOrderResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    const orderRecord = order[0];

    if (!orderRecord.isGuest) {
      throw new NotFoundError("Order not found");
    }

    if (orderRecord.guestEmail?.toLowerCase().trim() !== normalizedEmail) {
      throw new NotFoundError("Order not found");
    }

    if (orderRecord.status !== "pending") {
      throw new BadRequestError(
        `Cannot create payment for order with status "${orderRecord.status}"`,
      );
    }

    const existingPayment = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (
      existingPayment.length > 0 && existingPayment[0].status === "captured"
    ) {
      throw new BadRequestError("Order already paid");
    }

    // Use guest phone as contact
    const contact = orderRecord.guestPhone ?? undefined;

    const amountInSmallestUnit = Math.round(
      parseFloat(orderRecord.totalAmount) * 100,
    );

    let razorpayOrder: PaymentOrder;
    try {
      razorpayOrder = await paymentProvider.createOrder({
        amount: amountInSmallestUnit,
        currency: config.currency,
        receipt: orderRecord.orderNumber,
        notes: {
          orderId: orderId,
          orderNumber: orderRecord.orderNumber,
          guestEmail: normalizedEmail,
        },
      });
    } catch (error) {
      console.error("[PaymentService] Failed to create Razorpay order:", error);
      throw new BadRequestError("Failed to create payment order");
    }

    const paymentData: NewPayment = {
      orderId: orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: orderRecord.totalAmount,
      currency: config.currency,
      status: "created",
    };

    // Store payment record and update order atomically
    await db.transaction(async (tx) => {
      if (existingPayment.length > 0) {
        await tx
          .update(payments)
          .set({
            razorpayOrderId: razorpayOrder.id,
            status: "created",
            razorpayPaymentId: null,
            razorpaySignature: null,
            errorCode: null,
            errorDescription: null,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, existingPayment[0].id));
      } else {
        await tx.insert(payments).values(paymentData);
      }

      await tx
        .update(orders)
        .set({
          razorpayOrderId: razorpayOrder.id,
          paymentMethod: "razorpay",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    });

    const providerKeyId =
      (paymentProvider as unknown as { keyId?: string }).keyId ||
      Deno.env.get("RAZORPAY_KEY_ID") ||
      "";

    return {
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: providerKeyId,
      amount: amountInSmallestUnit,
      currency: config.currency,
      orderId: orderId,
      orderNumber: orderRecord.orderNumber,
      prefill: {
        email: normalizedEmail,
        contact: contact,
      },
    };
  }

  /**
   * Verify payment for a guest order
   * Uses email instead of userId for ownership verification
   */
  async verifyGuestPayment(
    orderId: string,
    email: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<PaymentVerifyResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    const orderRecord = order[0];

    if (!orderRecord.isGuest) {
      throw new NotFoundError("Order not found");
    }

    if (orderRecord.guestEmail?.toLowerCase().trim() !== normalizedEmail) {
      throw new NotFoundError("Order not found");
    }

    if (orderRecord.razorpayOrderId !== razorpayOrderId) {
      throw new BadRequestError("Invalid Razorpay order ID");
    }

    const isValid = await paymentProvider.verifyPayment({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      await this.updatePaymentFailed(
        orderId,
        razorpayOrderId,
        "invalid_signature",
        "Signature verification failed",
      );

      throw new BadRequestError("Payment verification failed");
    }

    let paymentDetails: PaymentDetails | undefined;
    try {
      paymentDetails = await paymentProvider.getPaymentDetails(
        razorpayPaymentId,
      );
    } catch (error) {
      console.error("[PaymentService] Failed to get payment details:", error);
    }

    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          razorpayPaymentId: razorpayPaymentId,
          razorpaySignature: razorpaySignature,
          status: "captured",
          method: paymentDetails?.method,
          bank: paymentDetails?.bank,
          wallet: paymentDetails?.wallet,
          vpa: paymentDetails?.vpa,
          cardLast4: paymentDetails?.card?.last4,
          cardNetwork: paymentDetails?.card?.network,
          cardType: paymentDetails?.card?.type,
          email: paymentDetails?.email,
          contact: paymentDetails?.contact,
          paidAt: new Date(),
          razorpayResponse: paymentDetails?.raw as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(payments.razorpayOrderId, razorpayOrderId));

      await tx
        .update(orders)
        .set({
          razorpayPaymentId: razorpayPaymentId,
          paymentStatus: "paid",
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    });

    // Send confirmation email (non-blocking)
    this.sendOrderConfirmationEmail(orderId).catch((err) => {
      console.error(
        "[PaymentService] Failed to send guest confirmation email:",
        err,
      );
    });

    return {
      success: true,
      orderId: orderId,
      orderNumber: orderRecord.orderNumber,
      paymentId: razorpayPaymentId,
      status: "captured",
      message: "Payment successful",
    };
  }

  /**
   * Manual refund for non-Razorpay orders (COD, UPI, etc.)
   * Admin only - restores stock atomically
   */
  async manualRefund(
    orderId: string,
    data: { reason?: string; transactionRef: string; refundDate: string },
  ): Promise<RefundResponse> {
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundError("Order not found");
    }

    const orderRecord = order[0];

    if (orderRecord.paymentStatus !== "paid") {
      throw new BadRequestError("Order has not been paid");
    }

    if (orderRecord.status === "refunded") {
      throw new BadRequestError("Order has already been refunded");
    }

    if (
      orderRecord.paymentMethod === "razorpay" && orderRecord.razorpayPaymentId
    ) {
      throw new BadRequestError(
        "This is a Razorpay order. Use the standard refund option instead.",
      );
    }

    const refundAmount = parseFloat(orderRecord.totalAmount);

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const refundNote = [
      `[Manual Refund - ${
        data.refundDate || new Date().toISOString().split("T")[0]
      }]`,
      `Reason: ${data.reason || "Admin initiated manual refund"}`,
      `Amount: ${refundAmount.toFixed(2)}`,
      `Txn Ref: ${data.transactionRef}`,
      `Method: ${orderRecord.paymentMethod || "Manual"}`,
    ].join(" | ");

    const updatedNotes = orderRecord.adminNotes
      ? `${orderRecord.adminNotes}\n${refundNote}`
      : refundNote;

    await db.transaction(async (tx) => {
      const payment = await tx
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);

      if (payment.length > 0) {
        await tx
          .update(payments)
          .set({
            status: "refunded",
            refundedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment[0].id));
      }

      await tx
        .update(orders)
        .set({
          paymentStatus: "refunded",
          status: "refunded",
          adminNotes: updatedNotes,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      for (const item of items) {
        if (item.variantId) {
          await tx
            .update(productVariants)
            .set({
              stockQuantity:
                sql`${productVariants.stockQuantity} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, item.variantId));
        } else {
          await tx
            .update(products)
            .set({
              stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }
    });

    return {
      success: true,
      refundId: `manual-${data.transactionRef}`,
      amount: refundAmount,
      status: "processed",
    };
  }

  /**
   * Send order confirmation email
   */
  private async sendOrderConfirmationEmail(orderId: string): Promise<void> {
    try {
      // Get order with items
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (order.length === 0) return;

      const orderRecord = order[0];

      // Get recipient email - from user or guest email
      let recipientEmail: string | null = null;
      if (orderRecord.isGuest) {
        recipientEmail = orderRecord.guestEmail;
      } else if (orderRecord.userId) {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, orderRecord.userId))
          .limit(1);
        recipientEmail = user[0]?.email ?? null;
      }

      if (!recipientEmail) return;

      // Get order items
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Build order items for email
      const emailItems = items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.totalPrice),
      }));

      // Get shipping address
      const shippingAddress = orderRecord.shippingAddressSnapshot as {
        fullName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      } | null;

      if (!shippingAddress) {
        console.warn(
          "[PaymentService] No shipping address snapshot, skipping email",
        );
        return;
      }

      // Send email
      await emailService.sendOrderConfirmationEmail(recipientEmail, {
        userName: shippingAddress.fullName || recipientEmail,
        orderNumber: orderRecord.orderNumber,
        orderDate: orderRecord.createdAt.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        items: emailItems,
        subtotal: parseFloat(orderRecord.subtotal),
        shipping: parseFloat(orderRecord.shippingAmount),
        tax: parseFloat(orderRecord.taxAmount),
        total: parseFloat(orderRecord.totalAmount),
        shippingAddress: {
          fullName: shippingAddress.fullName,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
      });

      console.log(
        `[PaymentService] Order confirmation email sent for ${orderRecord.orderNumber}`,
      );
    } catch (error) {
      console.error(
        "[PaymentService] Failed to send confirmation email:",
        error,
      );
      // Don't throw - email failure shouldn't fail the payment
    }
  }
}

// Import order items for email
import { orderItems } from "../orders/order-item.model.ts";

// Export singleton
export const paymentService = new PaymentService();
