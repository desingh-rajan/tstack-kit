/**
 * Payment Provider Factory
 *
 * Creates the appropriate payment provider based on environment configuration.
 * Auto-detects provider from available environment variables if not explicitly set.
 *
 * IMPORTANT: Uses lazy initialization to ensure environment variables are loaded
 * before the provider is created. The provider is instantiated on first use,
 * not at module import time.
 *
 * Environment Variables:
 * - PAYMENT_PROVIDER: Explicit provider selection (razorpay | stripe | noop)
 * - RAZORPAY_KEY_ID: Auto-detects Razorpay if present
 *
 * Usage:
 * ```typescript
 * import { paymentProvider } from "./factory.ts";
 * const order = await paymentProvider.createOrder({ ... });
 * ```
 */

import {
  type CreateOrderOptions,
  type IPaymentProvider,
  NoOpPaymentProvider,
  type VerifyPaymentOptions,
} from "./payment-provider.interface.ts";
import { RazorpayProvider } from "./razorpay.provider.ts";

/**
 * Create a payment provider instance based on configuration
 * @returns Configured payment provider
 */
export function createPaymentProvider(): IPaymentProvider {
  const explicitProvider = Deno.env.get("PAYMENT_PROVIDER")?.toLowerCase();

  // Explicit provider selection
  if (explicitProvider) {
    switch (explicitProvider) {
      case "razorpay":
        return new RazorpayProvider();

      // Future providers:
      // case "stripe":
      //   return new StripeProvider();
      // case "paypal":
      //   return new PayPalProvider();

      case "noop":
        return new NoOpPaymentProvider();

      default:
        console.warn(
          `[PaymentFactory] Unknown provider "${explicitProvider}", falling back to auto-detect`,
        );
    }
  }

  // Auto-detect based on available credentials
  if (Deno.env.get("RAZORPAY_KEY_ID") && Deno.env.get("RAZORPAY_KEY_SECRET")) {
    console.info("[PaymentFactory] Auto-detected Razorpay from environment");
    return new RazorpayProvider();
  }

  // Future auto-detection:
  // if (Deno.env.get("STRIPE_SECRET_KEY")) {
  //   console.info("[PaymentFactory] Auto-detected Stripe from environment");
  //   return new StripeProvider();
  // }

  // No provider configured - use NoOp for development
  console.warn(
    "[PaymentFactory] No payment provider configured - using NoOp mock provider",
  );
  return new NoOpPaymentProvider();
}

/**
 * Get list of available payment providers based on configured credentials
 * @returns Array of available provider names
 */
export function getAvailablePaymentProviders(): string[] {
  const available: string[] = [];

  if (Deno.env.get("RAZORPAY_KEY_ID") && Deno.env.get("RAZORPAY_KEY_SECRET")) {
    available.push("razorpay");
  }

  // Future:
  // if (Deno.env.get("STRIPE_SECRET_KEY")) {
  //   available.push("stripe");
  // }

  return available;
}

/**
 * Lazy singleton for payment provider
 * Ensures the provider is created AFTER environment variables are loaded
 */
let _paymentProvider: IPaymentProvider | null = null;

/**
 * Get the payment provider instance (lazy initialization)
 * Creates the provider on first call, ensuring env vars are loaded
 * @returns Configured payment provider
 */
export function getPaymentProvider(): IPaymentProvider {
  if (!_paymentProvider) {
    _paymentProvider = createPaymentProvider();
  }
  return _paymentProvider;
}

/**
 * Payment provider singleton (lazy proxy)
 *
 * This object lazily initializes the actual provider on first method call,
 * ensuring environment variables are loaded before provider selection.
 *
 * Use this for most cases to avoid creating multiple instances.
 */
export const paymentProvider: IPaymentProvider = {
  get name(): string {
    return getPaymentProvider().name;
  },

  createOrder(options: CreateOrderOptions) {
    return getPaymentProvider().createOrder(options);
  },

  verifyPayment(options: VerifyPaymentOptions) {
    return getPaymentProvider().verifyPayment(options);
  },

  capturePayment(paymentId: string, amount: number) {
    return getPaymentProvider().capturePayment(paymentId, amount);
  },

  refundPayment(paymentId: string, amount?: number) {
    return getPaymentProvider().refundPayment(paymentId, amount);
  },

  getPaymentDetails(paymentId: string) {
    return getPaymentProvider().getPaymentDetails(paymentId);
  },

  verifyWebhook(payload: string, signature: string) {
    return getPaymentProvider().verifyWebhook(payload, signature);
  },
};
