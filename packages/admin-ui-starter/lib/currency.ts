/**
 * Currency Formatting Utilities
 *
 * Configurable currency formatting.
 * Settings can be configured via:
 * 1. APP_CURRENCY / APP_LOCALE env vars
 * 2. Site settings (future)
 * 3. Defaults to INR / en-IN
 */

// Get currency code from environment or default to INR
const getCurrencyCode = (): string => {
  if (typeof Deno !== "undefined") {
    return Deno.env.get("APP_CURRENCY") || "INR";
  }
  return "INR";
};

// Get locale from environment or default to en-IN
const getLocale = (): string => {
  if (typeof Deno !== "undefined") {
    return Deno.env.get("APP_LOCALE") || "en-IN";
  }
  return "en-IN";
};

/**
 * Format a number or string amount to currency string
 *
 * @param amount - Number or string amount
 * @param options - Optional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: string | number,
  options?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "-";
  }

  try {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      return "-";
    }

    return new Intl.NumberFormat(options?.locale || getLocale(), {
      style: "currency",
      currency: options?.currency || getCurrencyCode(),
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(numAmount);
  } catch {
    return "-";
  }
}

/**
 * Format a number with locale-specific thousand separators
 *
 * @param value - Number or string value
 * @param options - Optional formatting options
 * @returns Formatted number string
 */
export function formatNumber(
  value: string | number,
  options?: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  try {
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return "-";
    }

    return new Intl.NumberFormat(options?.locale || getLocale(), {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(numValue);
  } catch {
    return "-";
  }
}
