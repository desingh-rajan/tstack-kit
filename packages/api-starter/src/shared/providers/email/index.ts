/**
 * Email Provider Module
 *
 * Provides email sending capabilities with provider abstraction.
 * Supports Resend, AWS SES, and SMTP (Gmail, SendGrid, Mailgun, etc.)
 *
 * @example
 * ```typescript
 * import { createEmailProvider, EmailService } from "@/shared/providers/email";
 *
 * // Using factory function (recommended - auto-detects provider)
 * const provider = createEmailProvider();
 * if (provider) {
 *   const emailService = new EmailService(provider, {
 *     appName: "My App",
 *     appUrl: "https://myapp.com",
 *   });
 *
 *   // Send verification email
 *   await emailService.sendVerificationEmail(
 *     "user@example.com",
 *     "John",
 *     "https://myapp.com/verify?token=abc123"
 *   );
 * }
 * ```
 */

// Provider interface and base class
export {
  BaseEmailProvider,
  type EmailAddress,
  type EmailAttachment,
  type EmailOptions,
  type EmailProviderConfig,
  type EmailResult,
  type IEmailProvider,
} from "./email-provider.interface.ts";

// Factory (recommended - auto-detects provider)
export {
  createEmailProvider,
  type EmailProviderType,
  getConfiguredProviderType,
  isEmailConfigured,
} from "./factory.ts";

// SMTP Provider (Gmail, SendGrid, Mailgun, etc.)
export {
  createSmtpProviderFromEnv,
  type SmtpConfig,
  SmtpProvider,
} from "./smtp.provider.ts";

// Resend Provider (HTTP API)
export {
  createResendProviderFromEnv,
  type ResendConfig,
  ResendProvider,
} from "./resend.provider.ts";

// AWS SES Provider (HTTP API)
export {
  createSesProviderFromEnv,
  type SesConfig,
  SesProvider,
} from "./ses.provider.ts";

// Email Service
export {
  createEmailServiceFromEnv,
  EmailService,
  type EmailServiceConfig,
} from "./email.service.ts";

// Templates
export {
  bodyStyles,
  containerStyles,
  type EmailTemplate,
  formatAddressHtml,
  formatAddressText,
  formatCurrency,
  generateItemsTableHtml,
  generateItemsText,
  getHeader,
  type OrderCancelledEmailData,
  orderCancelledEmailTemplate,
  type OrderConfirmationEmailData,
  orderConfirmationEmailTemplate,
  type OrderDeliveredEmailData,
  orderDeliveredEmailTemplate,
  type OrderItem,
  type OrderItemData,
  type OrderProcessingEmailData,
  orderProcessingEmailTemplate,
  type OrderShippedEmailData,
  orderShippedEmailTemplate,
  type PasswordResetEmailData,
  passwordResetEmailTemplate,
  type ShippingAddressData,
  type VerificationEmailData,
  verificationEmailTemplate,
  type WelcomeEmailData,
  welcomeEmailTemplate,
} from "./templates/index.ts";
