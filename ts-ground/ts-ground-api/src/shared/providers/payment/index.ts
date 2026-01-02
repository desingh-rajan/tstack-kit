/**
 * Payment Provider Module Exports
 *
 * This module provides payment gateway abstraction with:
 * - IPaymentProvider: Interface for all providers
 * - BasePaymentProvider: Abstract class with utilities
 * - NoOpPaymentProvider: Mock provider for development
 * - createPaymentProvider(): Factory for provider selection
 * - paymentProvider: Singleton instance
 */

// Interface and base classes
export * from "./payment-provider.interface.ts";

// Provider implementations
export * from "./razorpay.provider.ts";

// Factory and singleton
export * from "./factory.ts";
