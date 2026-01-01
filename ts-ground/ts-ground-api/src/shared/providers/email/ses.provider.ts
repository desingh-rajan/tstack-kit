/**
 * AWS SES Email Provider
 *
 * Implementation of IEmailProvider using AWS SES HTTP API.
 * Uses AWS Signature V4 for authentication.
 *
 * @example
 * ```typescript
 * const provider = new SesProvider({
 *   from: "noreply@example.com",
 *   accessKeyId: "AKIA...",
 *   secretAccessKey: "...",
 *   region: "us-east-1",
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
 * AWS SES-specific configuration
 */
export interface SesConfig extends EmailProviderConfig {
  /** AWS Access Key ID */
  accessKeyId: string;

  /** AWS Secret Access Key */
  secretAccessKey: string;

  /** AWS Region (e.g., us-east-1, eu-west-1) */
  region: string;
}

/**
 * AWS SES Email Provider using HTTP API with Signature V4
 */
export class SesProvider extends BaseEmailProvider {
  readonly name = "ses";
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;

  constructor(config: SesConfig) {
    super(config);
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.region = config.region;
  }

  /**
   * Create AWS Signature V4 headers
   */
  private async sign(
    method: string,
    url: string,
    body: string,
    headers: Record<string, string>,
  ): Promise<Record<string, string>> {
    const urlObj = new URL(url);
    const host = urlObj.host;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);

    const service = "ses";
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope =
      `${dateStamp}/${this.region}/${service}/aws4_request`;

    // Create canonical headers
    const canonicalHeaders = Object.entries({
      ...headers,
      host,
      "x-amz-date": amzDate,
    })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`)
      .join("\n") + "\n";

    const signedHeaders = Object.keys({
      ...headers,
      host,
      "x-amz-date": amzDate,
    })
      .map((k) => k.toLowerCase())
      .sort()
      .join(";");

    // Hash the payload
    const payloadHash = await this.sha256(body);

    // Create canonical request
    const canonicalRequest = [
      method,
      urlObj.pathname,
      urlObj.search.slice(1),
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    // Create string to sign
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      await this.sha256(canonicalRequest),
    ].join("\n");

    // Calculate signature
    const signingKey = await this.getSignatureKey(
      dateStamp,
      this.region,
      service,
    );
    const signature = await this.hmacHex(signingKey, stringToSign);

    // Create authorization header
    const authorization =
      `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...headers,
      "x-amz-date": amzDate,
      Authorization: authorization,
    };
  }

  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private async hmac(
    key: ArrayBuffer | Uint8Array,
    message: string,
  ): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const keyData = key instanceof Uint8Array ? key : new Uint8Array(key);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  }

  private async hmacHex(
    key: ArrayBuffer | Uint8Array,
    message: string,
  ): Promise<string> {
    const result = await this.hmac(key, message);
    return Array.from(new Uint8Array(result))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private async getSignatureKey(
    dateStamp: string,
    region: string,
    service: string,
  ): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const kDate = await this.hmac(
      encoder.encode(`AWS4${this.secretAccessKey}`),
      dateStamp,
    );
    const kRegion = await this.hmac(kDate, region);
    const kService = await this.hmac(kRegion, service);
    return this.hmac(kService, "aws4_request");
  }

  /**
   * Send an email via AWS SES API
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

      // Build SES SendEmail request
      const params = new URLSearchParams();
      params.append("Action", "SendEmail");
      params.append("Version", "2010-12-01");
      params.append("Source", from);

      to.forEach((addr, i) => {
        params.append(`Destination.ToAddresses.member.${i + 1}`, addr);
      });

      const cc = this.normalizeAddresses(options.cc);
      cc.forEach((addr, i) => {
        params.append(`Destination.CcAddresses.member.${i + 1}`, addr);
      });

      const bcc = this.normalizeAddresses(options.bcc);
      bcc.forEach((addr, i) => {
        params.append(`Destination.BccAddresses.member.${i + 1}`, addr);
      });

      params.append("Message.Subject.Data", options.subject);
      params.append("Message.Subject.Charset", "UTF-8");

      if (options.html) {
        params.append("Message.Body.Html.Data", options.html);
        params.append("Message.Body.Html.Charset", "UTF-8");
      }

      if (options.text) {
        params.append("Message.Body.Text.Data", options.text);
        params.append("Message.Body.Text.Charset", "UTF-8");
      } else if (options.html) {
        params.append(
          "Message.Body.Text.Data",
          this.htmlToText(options.html),
        );
        params.append("Message.Body.Text.Charset", "UTF-8");
      }

      const replyTo = this.normalizeAddress(options.replyTo) ||
        this.normalizeAddress(this.config.replyTo);
      if (replyTo) {
        params.append("ReplyToAddresses.member.1", replyTo);
      }

      const url = `https://email.${this.region}.amazonaws.com/`;
      const body = params.toString();

      const headers = await this.sign("POST", url, body, {
        "Content-Type": "application/x-www-form-urlencoded",
      });

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`[SesProvider] Send failed:`, responseText);
        // Parse error from XML response
        const errorMatch = responseText.match(/<Message>([^<]+)<\/Message>/);
        return {
          success: false,
          error: errorMatch?.[1] || "Failed to send email",
          raw: responseText,
        };
      }

      // Parse message ID from XML response
      const messageIdMatch = responseText.match(
        /<MessageId>([^<]+)<\/MessageId>/,
      );
      const messageId = messageIdMatch?.[1] || "sent";

      console.log(`[SesProvider] Email sent successfully:`, messageId);
      return {
        success: true,
        messageId,
        raw: responseText,
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown error";
      console.error(`[SesProvider] Send failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        raw: error,
      };
    }
  }

  /**
   * Verify SES connection
   */
  async verify(): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append("Action", "GetSendQuota");
      params.append("Version", "2010-12-01");

      const url = `https://email.${this.region}.amazonaws.com/`;
      const body = params.toString();

      const headers = await this.sign("POST", url, body, {
        "Content-Type": "application/x-www-form-urlencoded",
      });

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      return response.ok;
    } catch (error) {
      console.error(
        `[SesProvider] Verify failed: ${
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
 * Create SesProvider from environment variables
 *
 * Uses AWS credentials if available. Can be triggered by:
 * - EMAIL_PROVIDER=ses (explicit)
 * - SES_ACCESS_KEY_ID set (explicit SES config)
 * - AWS_ACCESS_KEY_ID set (fallback - uses general AWS credentials)
 */
export function createSesProviderFromEnv(): SesProvider | null {
  const accessKeyId = Deno.env.get("SES_ACCESS_KEY_ID") ||
    Deno.env.get("AWS_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("SES_SECRET_ACCESS_KEY") ||
    Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const region = Deno.env.get("AWS_REGION") ||
    Deno.env.get("SES_REGION") ||
    "ap-south-1";

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  const from = Deno.env.get("EMAIL_FROM");
  const replyTo = Deno.env.get("EMAIL_REPLY_TO");

  if (!from) {
    console.warn("[SesProvider] EMAIL_FROM is required for SES");
    return null;
  }

  return new SesProvider({
    from,
    replyTo,
    accessKeyId,
    secretAccessKey,
    region,
  });
}
