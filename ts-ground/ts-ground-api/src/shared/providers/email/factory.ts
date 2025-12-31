/**
 * Email Provider Factory
 *
 * Auto-detects and creates the appropriate email provider based on
 * environment variables. Supports:
 * - Resend (HTTP API) - recommended for simplicity
 * - AWS SES (HTTP API) - for AWS users
 * - SMTP (any provider) - Gmail, SendGrid, Mailgun, etc.
 *
 * @example
 * ```typescript
 * import { createEmailProvider } from "@/shared/providers/email/factory";
 *
 * const provider = createEmailProvider();
 * if (provider) {
 *   await provider.send({ to: "user@example.com", subject: "Hello", html: "<p>Hi!</p>" });
 * }
 * ```
 */

import type { IEmailProvider } from "./email-provider.interface.ts";
import { createResendProviderFromEnv } from "./resend.provider.ts";
import { createSesProviderFromEnv } from "./ses.provider.ts";
import { createSmtpProviderFromEnv } from "./smtp.provider.ts";

export type EmailProviderType = "resend" | "ses" | "smtp" | "auto";

/**
 * Create email provider based on environment configuration
 *
 * Detection priority:
 * 1. EMAIL_PROVIDER env var (explicit selection)
 * 2. Resend (if SMTP_PASS starts with "re_" or RESEND_API_KEY is set)
 * 3. AWS SES (if EMAIL_PROVIDER=ses or SES_ACCESS_KEY_ID is set)
 * 4. SMTP (fallback for any SMTP_HOST configuration)
 *
 * @returns Email provider instance or null if not configured
 */
export function createEmailProvider(): IEmailProvider | null {
  const explicitProvider = Deno.env.get("EMAIL_PROVIDER")?.toLowerCase() as
    | EmailProviderType
    | undefined;

  // Explicit provider selection
  if (explicitProvider && explicitProvider !== "auto") {
    switch (explicitProvider) {
      case "resend": {
        const provider = createResendProviderFromEnv();
        if (provider) {
          console.log("[EmailFactory] Using Resend provider (explicit)");
          return provider;
        }
        console.warn(
          "[EmailFactory] Resend selected but not configured properly",
        );
        break;
      }
      case "ses": {
        const provider = createSesProviderFromEnv();
        if (provider) {
          console.log("[EmailFactory] Using AWS SES provider (explicit)");
          return provider;
        }
        console.warn(
          "[EmailFactory] AWS SES selected but not configured properly",
        );
        break;
      }
      case "smtp": {
        const provider = createSmtpProviderFromEnv();
        if (provider) {
          console.log("[EmailFactory] Using SMTP provider (explicit)");
          return provider;
        }
        console.warn(
          "[EmailFactory] SMTP selected but not configured properly",
        );
        break;
      }
    }
  }

  // Auto-detection

  // 1. Try Resend (check for re_ prefix in SMTP_PASS or RESEND_API_KEY)
  const resendProvider = createResendProviderFromEnv();
  if (resendProvider) {
    console.log("[EmailFactory] Using Resend provider (auto-detected)");
    return resendProvider;
  }

  // 2. Try AWS SES
  const sesProvider = createSesProviderFromEnv();
  if (sesProvider) {
    console.log("[EmailFactory] Using AWS SES provider (auto-detected)");
    return sesProvider;
  }

  // 3. Try SMTP (Gmail, SendGrid, Mailgun, etc.)
  try {
    const smtpProvider = createSmtpProviderFromEnv();
    if (smtpProvider) {
      console.log("[EmailFactory] Using SMTP provider (auto-detected)");
      return smtpProvider;
    }
  } catch (error) {
    console.warn(
      "[EmailFactory] SMTP provider creation failed:",
      error instanceof Error ? error.message : error,
    );
  }

  console.warn(
    "[EmailFactory] No email provider configured. Set EMAIL_PROVIDER or configure SMTP/Resend/SES credentials.",
  );
  return null;
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return createEmailProvider() !== null;
}

/**
 * Get the configured provider type without creating instance
 */
export function getConfiguredProviderType(): EmailProviderType | null {
  const explicit = Deno.env.get("EMAIL_PROVIDER")?.toLowerCase() as
    | EmailProviderType
    | undefined;
  if (explicit && explicit !== "auto") {
    return explicit;
  }

  // Check for Resend
  const smtpPass = Deno.env.get("SMTP_PASS") || "";
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";
  if (smtpPass.startsWith("re_") || resendKey.startsWith("re_")) {
    return "resend";
  }

  // Check for SES
  if (
    Deno.env.get("SES_ACCESS_KEY_ID") ||
    Deno.env.get("EMAIL_PROVIDER") === "ses"
  ) {
    return "ses";
  }

  // Check for SMTP
  if (Deno.env.get("SMTP_HOST")) {
    return "smtp";
  }

  return null;
}
