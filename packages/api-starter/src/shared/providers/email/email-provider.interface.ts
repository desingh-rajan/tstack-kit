/**
 * Email Provider Interface
 *
 * Abstract interface for email providers (SMTP, Resend, SendGrid, SES, etc.)
 * Allows swapping email providers without changing application code.
 *
 * @example
 * ```typescript
 * const provider = new SmtpProvider(config);
 * await provider.send({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   html: "<h1>Welcome to our platform</h1>",
 * });
 * ```
 */

/**
 * Email recipient with optional name
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: string | Uint8Array;
  contentType?: string;
  encoding?: "base64" | "utf-8";
}

/**
 * Options for sending an email
 */
export interface EmailOptions {
  /** Recipient email address or addresses */
  to: string | string[] | EmailAddress | EmailAddress[];

  /** Email subject line */
  subject: string;

  /** HTML content of the email */
  html: string;

  /** Plain text fallback (auto-generated from HTML if not provided) */
  text?: string;

  /** Sender email (defaults to configured FROM address) */
  from?: string | EmailAddress;

  /** Reply-to address */
  replyTo?: string | EmailAddress;

  /** CC recipients */
  cc?: string | string[] | EmailAddress | EmailAddress[];

  /** BCC recipients */
  bcc?: string | string[] | EmailAddress | EmailAddress[];

  /** Email attachments */
  attachments?: EmailAttachment[];

  /** Custom headers */
  headers?: Record<string, string>;

  /** Provider-specific metadata/tags */
  metadata?: Record<string, string>;
}

/**
 * Result of sending an email
 */
export interface EmailResult {
  /** Whether the email was sent successfully */
  success: boolean;

  /** Provider-specific message ID */
  messageId?: string;

  /** Error message if send failed */
  error?: string;

  /** Raw provider response for debugging */
  raw?: unknown;
}

/**
 * Email provider configuration
 */
export interface EmailProviderConfig {
  /** Default sender address */
  from: string | EmailAddress;

  /** Default reply-to address */
  replyTo?: string | EmailAddress;

  /** Provider-specific configuration */
  [key: string]: unknown;
}

/**
 * Email Provider Interface
 *
 * All email providers must implement this interface.
 */
export interface IEmailProvider {
  /**
   * Provider name for logging/debugging
   */
  readonly name: string;

  /**
   * Send an email
   *
   * @param options - Email options
   * @returns Result indicating success/failure
   */
  send(options: EmailOptions): Promise<EmailResult>;

  /**
   * Send multiple emails (batch)
   *
   * Default implementation sends sequentially.
   * Providers may override for bulk API support.
   *
   * @param emails - Array of email options
   * @returns Array of results
   */
  sendBatch?(emails: EmailOptions[]): Promise<EmailResult[]>;

  /**
   * Verify provider configuration/connection
   *
   * @returns True if provider is properly configured
   */
  verify?(): Promise<boolean>;
}

/**
 * Base class for email providers with common functionality
 */
export abstract class BaseEmailProvider implements IEmailProvider {
  abstract readonly name: string;
  protected config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    this.config = config;
  }

  abstract send(options: EmailOptions): Promise<EmailResult>;

  /**
   * Default batch implementation - sends emails sequentially
   * Override in provider for bulk API support
   */
  async sendBatch(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    for (const email of emails) {
      results.push(await this.send(email));
    }
    return results;
  }

  /**
   * Normalize email address to string format
   */
  protected normalizeAddress(
    address: string | EmailAddress | undefined,
  ): string | undefined {
    if (!address) return undefined;
    if (typeof address === "string") return address;
    return address.name ? `${address.name} <${address.email}>` : address.email;
  }

  /**
   * Normalize multiple addresses to array of strings
   */
  protected normalizeAddresses(
    addresses:
      | string
      | string[]
      | EmailAddress
      | EmailAddress[]
      | (string | EmailAddress)[]
      | undefined,
  ): string[] {
    if (!addresses) return [];
    const arr = Array.isArray(addresses) ? addresses : [addresses];
    return arr.map((a) => this.normalizeAddress(a)!).filter(Boolean);
  }

  /**
   * Get default from address
   */
  protected getFrom(options: EmailOptions): string {
    return this.normalizeAddress(options.from) ||
      this.normalizeAddress(this.config.from) ||
      "";
  }

  /**
   * Strip HTML tags for plain text fallback
   */
  protected htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}
