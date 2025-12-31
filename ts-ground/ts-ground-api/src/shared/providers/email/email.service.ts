/**
 * Email Service
 *
 * High-level email service that wraps the email provider.
 * Provides templated email methods for common use cases.
 *
 * @example
 * ```typescript
 * const emailService = new EmailService(provider);
 *
 * await emailService.sendVerificationEmail(
 *   "user@example.com",
 *   "John",
 *   "https://example.com/verify?token=abc123"
 * );
 * ```
 */

import type {
  EmailResult,
  IEmailProvider,
} from "./email-provider.interface.ts";
import {
  type OrderConfirmationEmailData,
  orderConfirmationEmailTemplate,
  type PasswordResetEmailData,
  passwordResetEmailTemplate,
  type VerificationEmailData,
  verificationEmailTemplate,
  type WelcomeEmailData,
  welcomeEmailTemplate,
} from "./templates/index.ts";

/**
 * Email Service configuration
 */
export interface EmailServiceConfig {
  /** Application name for email templates */
  appName: string;

  /** Application URL for links in emails */
  appUrl: string;

  /** Support email address */
  supportEmail?: string;
}

/**
 * Email Service - high-level email operations
 */
export class EmailService {
  constructor(
    private provider: IEmailProvider,
    private config: EmailServiceConfig,
  ) {}

  /**
   * Send a verification email
   */
  sendVerificationEmail(
    to: string,
    userName: string,
    verificationUrl: string,
    expiresInHours = 24,
  ): Promise<EmailResult> {
    const data: VerificationEmailData = {
      userName,
      verificationUrl,
      expiresInHours,
      appName: this.config.appName,
      supportEmail: this.config.supportEmail,
    };

    const { subject, html, text } = verificationEmailTemplate(data);

    return this.provider.send({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send a password reset email
   */
  sendPasswordResetEmail(
    to: string,
    userName: string,
    resetUrl: string,
    expiresInHours = 1,
  ): Promise<EmailResult> {
    const data: PasswordResetEmailData = {
      userName,
      resetUrl,
      expiresInHours,
      appName: this.config.appName,
      supportEmail: this.config.supportEmail,
    };

    const { subject, html, text } = passwordResetEmailTemplate(data);

    return this.provider.send({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send a welcome email
   */
  sendWelcomeEmail(
    to: string,
    userName: string,
  ): Promise<EmailResult> {
    const data: WelcomeEmailData = {
      userName,
      appName: this.config.appName,
      appUrl: this.config.appUrl,
      supportEmail: this.config.supportEmail,
    };

    const { subject, html, text } = welcomeEmailTemplate(data);

    return this.provider.send({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send an order confirmation email
   */
  sendOrderConfirmationEmail(
    to: string,
    data: Omit<
      OrderConfirmationEmailData,
      "appName" | "appUrl" | "supportEmail"
    >,
  ): Promise<EmailResult> {
    const fullData: OrderConfirmationEmailData = {
      ...data,
      appName: this.config.appName,
      appUrl: this.config.appUrl,
      supportEmail: this.config.supportEmail,
    };

    const { subject, html, text } = orderConfirmationEmailTemplate(fullData);

    return this.provider.send({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send a raw email (for custom templates)
   */
  sendRaw(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<EmailResult> {
    return this.provider.send({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Get the underlying provider (for advanced use)
   */
  getProvider(): IEmailProvider {
    return this.provider;
  }
}

/**
 * Create EmailService from environment variables
 */
export function createEmailServiceFromEnv(
  provider: IEmailProvider,
): EmailService {
  const appName = Deno.env.get("APP_NAME") || "TStack App";
  const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
  const supportEmail = Deno.env.get("SUPPORT_EMAIL");

  return new EmailService(provider, {
    appName,
    appUrl,
    supportEmail,
  });
}
