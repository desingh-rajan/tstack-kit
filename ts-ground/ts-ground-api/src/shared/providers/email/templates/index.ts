/**
 * Email Templates Index
 *
 * Export all email templates from a single location.
 */

export {
  type VerificationEmailData,
  verificationEmailTemplate,
} from "./verification.ts";

export {
  type PasswordResetEmailData,
  passwordResetEmailTemplate,
} from "./password-reset.ts";

export { type WelcomeEmailData, welcomeEmailTemplate } from "./welcome.ts";

export {
  type OrderConfirmationEmailData,
  orderConfirmationEmailTemplate,
  type OrderItem,
} from "./order-confirmation.ts";

export type { EmailTemplate } from "./verification.ts";
