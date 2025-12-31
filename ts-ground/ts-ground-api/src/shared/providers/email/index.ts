/**
 * Email Provider Module
 *
 * Provides email sending capabilities with provider abstraction.
 *
 * @example
 * ```typescript
 * import { SmtpProvider, EmailService, createSmtpProviderFromEnv } from "@/shared/providers/email";
 *
 * // Using factory function (recommended)
 * const provider = createSmtpProviderFromEnv();
 * const emailService = new EmailService(provider, {
 *   appName: "My App",
 *   appUrl: "https://myapp.com",
 * });
 *
 * // Send verification email
 * await emailService.sendVerificationEmail(
 *   "user@example.com",
 *   "John",
 *   "https://myapp.com/verify?token=abc123"
 * );
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

// SMTP Provider
export {
  createSmtpProviderFromEnv,
  type SmtpConfig,
  SmtpProvider,
} from "./smtp.provider.ts";

// Email Service
export {
  createEmailServiceFromEnv,
  EmailService,
  type EmailServiceConfig,
} from "./email.service.ts";

// Templates
export {
  type EmailTemplate,
  type OrderConfirmationEmailData,
  orderConfirmationEmailTemplate,
  type OrderItem,
  type PasswordResetEmailData,
  passwordResetEmailTemplate,
  type VerificationEmailData,
  verificationEmailTemplate,
  type WelcomeEmailData,
  welcomeEmailTemplate,
} from "./templates/index.ts";
