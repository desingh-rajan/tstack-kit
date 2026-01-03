/**
 * Resend Email Provider
 *
 * Implementation of IEmailProvider using Resend's HTTP API.
 * This is more reliable than SMTP for Resend.
 *
 * @example
 * ```typescript
 * const provider = new ResendProvider({
 *   from: "noreply@example.com",
 *   apiKey: "re_xxxxx",
 * });
 * ```
 */

import {
  BaseEmailProvider,
  type EmailOptions,
  type EmailProviderConfig,
  type EmailResult,
} from "./email-provider.interface.ts";

/**
 * Resend-specific configuration
 */
export interface ResendConfig extends EmailProviderConfig {
  /** Resend API key */
  apiKey: string;
}

/**
 * Resend Email Provider using HTTP API
 */
export class ResendProvider extends BaseEmailProvider {
  readonly name = "resend";
  private apiKey: string;

  constructor(config: ResendConfig) {
    super(config);
    this.apiKey = config.apiKey;
  }

  /**
   * Send an email via Resend API
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

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from,
          to: to,
          cc: this.normalizeAddresses(options.cc),
          bcc: this.normalizeAddresses(options.bcc),
          reply_to: this.normalizeAddress(options.replyTo) ||
            this.normalizeAddress(this.config.replyTo),
          subject: options.subject,
          text: options.text || this.htmlToText(options.html),
          html: options.html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[ResendProvider] Send failed:`, data);
        return {
          success: false,
          error: data.message || data.error || "Failed to send email",
          raw: data,
        };
      }

      console.log(`[ResendProvider] Email sent successfully:`, data.id);
      return {
        success: true,
        messageId: data.id,
        raw: data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown error";
      console.error(`[ResendProvider] Send failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        raw: error,
      };
    }
  }

  /**
   * Verify Resend API connection
   */
  async verify(): Promise<boolean> {
    try {
      const response = await fetch("https://api.resend.com/domains", {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error(
        `[ResendProvider] Verify failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return false;
    }
  }

  /**
   * Close connection (no-op for HTTP API)
   */
  async close(): Promise<void> {
    // No connection to close for HTTP API
  }
}

/**
 * Create ResendProvider from environment variables
 */
export function createResendProviderFromEnv(): ResendProvider | null {
  const apiKey = Deno.env.get("RESEND_API_KEY") ||
    Deno.env.get("SMTP_PASS"); // Fallback to SMTP_PASS if using Resend

  if (!apiKey || !apiKey.startsWith("re_")) {
    return null;
  }

  const from = Deno.env.get("EMAIL_FROM") || "onboarding@resend.dev";
  const replyTo = Deno.env.get("EMAIL_REPLY_TO");

  return new ResendProvider({
    from,
    replyTo,
    apiKey,
  });
}
