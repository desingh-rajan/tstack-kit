/**
 * SMTP Email Provider
 *
 * Implementation of IEmailProvider using SMTP protocol.
 * Works with any SMTP server (Resend, SendGrid, Gmail, Mailgun, etc.)
 *
 * @example
 * ```typescript
 * const provider = new SmtpProvider({
 *   from: "noreply@example.com",
 *   host: "smtp.resend.com",
 *   port: 587,
 *   username: "resend",
 *   password: "re_xxxxx",
 *   secure: false,
 * });
 * ```
 */

import { SMTPClient } from "denomailer";
import {
  BaseEmailProvider,
  type EmailOptions,
  type EmailProviderConfig,
  type EmailResult,
} from "./email-provider.interface.ts";

/**
 * SMTP-specific configuration
 */
export interface SmtpConfig extends EmailProviderConfig {
  /** SMTP server hostname */
  host: string;

  /** SMTP server port (typically 587 for TLS, 465 for SSL, 25 for unencrypted) */
  port: number;

  /** SMTP username */
  username: string;

  /** SMTP password or API key */
  password: string;

  /** Use TLS/SSL connection */
  secure?: boolean;

  /** Connection timeout in milliseconds */
  timeout?: number;
}

/**
 * SMTP Email Provider using denomailer
 */
export class SmtpProvider extends BaseEmailProvider {
  readonly name = "smtp";
  private client: SMTPClient;
  private smtpConfig: SmtpConfig;

  constructor(config: SmtpConfig) {
    super(config);
    this.smtpConfig = config;

    this.client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: config.secure ?? config.port === 465,
        auth: {
          username: config.username,
          password: config.password,
        },
      },
    });
  }

  /**
   * Send an email via SMTP
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const to = this.normalizeAddresses(options.to);
      const from = this.getFrom(options);

      if (!from) {
        return {
          success: false,
          error: "No sender address configured",
        };
      }

      if (to.length === 0) {
        return {
          success: false,
          error: "No recipient address provided",
        };
      }

      const result = await this.client.send({
        from: from,
        to: to,
        cc: this.normalizeAddresses(options.cc),
        bcc: this.normalizeAddresses(options.bcc),
        replyTo: this.normalizeAddress(options.replyTo) ||
          this.normalizeAddress(this.config.replyTo),
        subject: options.subject,
        content: options.text || this.htmlToText(options.html),
        html: options.html,
        // Note: attachments would need additional handling for denomailer format
      });

      return {
        success: true,
        messageId: typeof result === "object" && result !== null
          ? String((result as { messageId?: string }).messageId || "sent")
          : "sent",
        raw: result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown error";
      console.error(`[SmtpProvider] Send failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        raw: error,
      };
    }
  }

  /**
   * Verify SMTP connection
   */
  async verify(): Promise<boolean> {
    try {
      // denomailer doesn't have a direct verify method
      // We'll attempt a connection test by creating a new client
      const testClient = new SMTPClient({
        connection: {
          hostname: this.smtpConfig.host,
          port: this.smtpConfig.port,
          tls: this.smtpConfig.secure ?? this.smtpConfig.port === 465,
          auth: {
            username: this.smtpConfig.username,
            password: this.smtpConfig.password,
          },
        },
      });

      // Close the test connection
      await testClient.close();
      return true;
    } catch (error) {
      console.error(
        `[SmtpProvider] Verify failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return false;
    }
  }

  /**
   * Close SMTP connection (call when shutting down)
   */
  async close(): Promise<void> {
    await this.client.close();
  }
}

/**
 * Create SMTP provider from environment variables
 *
 * Required env vars:
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_USER
 * - SMTP_PASS
 * - EMAIL_FROM
 *
 * Optional:
 * - SMTP_SECURE (true/false)
 * - EMAIL_REPLY_TO
 */
export function createSmtpProviderFromEnv(): SmtpProvider {
  const host = Deno.env.get("SMTP_HOST");
  const port = Deno.env.get("SMTP_PORT");
  const username = Deno.env.get("SMTP_USER");
  const password = Deno.env.get("SMTP_PASS");
  const from = Deno.env.get("EMAIL_FROM");

  if (!host || !port || !username || !password || !from) {
    throw new Error(
      "Missing required SMTP environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM",
    );
  }

  return new SmtpProvider({
    host,
    port: parseInt(port, 10),
    username,
    password,
    from,
    secure: Deno.env.get("SMTP_SECURE") === "true",
    replyTo: Deno.env.get("EMAIL_REPLY_TO"),
  });
}
