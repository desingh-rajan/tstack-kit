/**
 * Email Templates Index
 *
 * Export all email templates from a single location.
 */

// Shared utilities and types
export {
  bodyStyles,
  containerStyles,
  formatAddressHtml,
  formatAddressText,
  formatCurrency,
  generateItemsTableHtml,
  generateItemsText,
  getHeader,
  type OrderItemData,
  type ShippingAddressData,
} from "./shared.ts";

// Auth templates
export {
  type VerificationEmailData,
  verificationEmailTemplate,
} from "./verification.ts";

export {
  type PasswordResetEmailData,
  passwordResetEmailTemplate,
} from "./password-reset.ts";

export { type WelcomeEmailData, welcomeEmailTemplate } from "./welcome.ts";

// Order templates
export {
  type OrderConfirmationEmailData,
  orderConfirmationEmailTemplate,
  type OrderItem,
} from "./order-confirmation.ts";

export {
  type OrderProcessingEmailData,
  orderProcessingEmailTemplate,
} from "./order-processing.ts";

export {
  type OrderShippedEmailData,
  orderShippedEmailTemplate,
} from "./order-shipped.ts";

export {
  type OrderDeliveredEmailData,
  orderDeliveredEmailTemplate,
} from "./order-delivered.ts";

export {
  type OrderCancelledEmailData,
  orderCancelledEmailTemplate,
} from "./order-cancelled.ts";

export {
  type OrderRefundedEmailData,
  orderRefundedEmailTemplate,
} from "./order-refunded.ts";

export {
  type AdminOrderNotificationEmailData,
  adminOrderNotificationEmailTemplate,
} from "./admin-order-notification.ts";

export type { EmailTemplate } from "./shared.ts";
