import type { Context } from "hono";
import { paymentService } from "./payment.service.ts";
import {
  CreatePaymentOrderSchema,
  ManualRefundSchema,
  RefundPaymentSchema,
  VerifyPaymentSchema,
} from "./payment.dto.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";

/**
 * Payment Controller
 *
 * Handles payment-related HTTP requests
 */
export class PaymentController {
  /**
   * Create a Razorpay order for checkout
   * POST /payments/create-order
   */
  async createOrder(c: Context) {
    const userId = c.get("userId") as number;
    const body = await c.req.json();

    const validation = CreatePaymentOrderSchema.safeParse(body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors[0].message);
    }

    const result = await paymentService.createPaymentOrder(
      userId,
      validation.data.orderId,
    );

    return c.json(
      ApiResponse.success(result, "Payment order created"),
      201,
    );
  }

  /**
   * Verify payment after Razorpay checkout
   * POST /payments/verify
   */
  async verifyPayment(c: Context) {
    const userId = c.get("userId") as number;
    const body = await c.req.json();

    const validation = VerifyPaymentSchema.safeParse(body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors[0].message);
    }

    const result = await paymentService.verifyPayment(
      userId,
      validation.data.orderId,
      validation.data.razorpayOrderId,
      validation.data.razorpayPaymentId,
      validation.data.razorpaySignature,
    );

    return c.json(ApiResponse.success(result, result.message));
  }

  /**
   * Get payment status for an order
   * GET /payments/:orderId/status
   */
  async getStatus(c: Context) {
    const userId = c.get("userId") as number;
    const orderId = c.req.param("orderId");

    const result = await paymentService.getPaymentStatus(userId, orderId);

    return c.json(ApiResponse.success(result, "Payment status retrieved"));
  }

  /**
   * Create a Razorpay order for guest checkout
   * POST /payments/guest/create-order
   * Requires orderId and email in body for validation
   */
  async createGuestOrder(c: Context) {
    const body = await c.req.json();

    const validation = CreatePaymentOrderSchema.safeParse(body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors[0].message);
    }

    if (!body.email) {
      throw new BadRequestError("Email is required for guest checkout");
    }

    const result = await paymentService.createGuestPaymentOrder(
      validation.data.orderId,
      body.email,
    );

    return c.json(
      ApiResponse.success(result, "Payment order created"),
      201,
    );
  }

  /**
   * Verify payment for guest checkout
   * POST /payments/guest/verify
   * Requires email in body for validation
   */
  async verifyGuestPayment(c: Context) {
    const body = await c.req.json();

    const validation = VerifyPaymentSchema.safeParse(body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors[0].message);
    }

    if (!body.email) {
      throw new BadRequestError("Email is required for guest checkout");
    }

    const result = await paymentService.verifyGuestPayment(
      validation.data.orderId,
      body.email,
      validation.data.razorpayOrderId,
      validation.data.razorpayPaymentId,
      validation.data.razorpaySignature,
    );

    return c.json(ApiResponse.success(result, result.message));
  }
}

/**
 * Admin Payment Controller
 *
 * Handles admin payment operations
 */
export class AdminPaymentController {
  /**
   * Process refund
   * POST /ts-admin/payments/:orderId/refund
   */
  async refund(c: Context) {
    const orderId = c.req.param("orderId");
    const body = await c.req.json().catch(() => ({}));

    const validation = RefundPaymentSchema.safeParse(body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors[0].message);
    }

    const result = await paymentService.refundPayment(
      orderId,
      validation.data.amount,
    );

    return c.json(ApiResponse.success(result, "Refund processed"));
  }

  /**
   * Record manual refund for COD/UPI orders
   * POST /ts-admin/payments/:orderId/manual-refund
   */
  async manualRefund(c: Context) {
    const orderId = c.req.param("orderId");
    const body = await c.req.json().catch(() => ({}));

    const validation = ManualRefundSchema.safeParse(body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors[0].message);
    }

    const result = await paymentService.manualRefund(
      orderId,
      validation.data,
    );

    return c.json(ApiResponse.success(result, "Manual refund recorded"));
  }
}

/**
 * Webhook Controller
 *
 * Handles Razorpay webhooks
 */
export class WebhookController {
  /**
   * Handle Razorpay webhook
   * POST /webhooks/razorpay
   */
  async handleRazorpay(c: Context) {
    const signature = c.req.header("X-Razorpay-Signature") || "";
    const payload = await c.req.text();

    const result = await paymentService.handleWebhook(payload, signature);

    if (!result.handled) {
      return c.json({ status: "ignored" }, 400);
    }

    return c.json({ status: "ok", event: result.event });
  }
}

// Export singleton instances
export const paymentController = new PaymentController();
export const adminPaymentController = new AdminPaymentController();
export const webhookController = new WebhookController();
