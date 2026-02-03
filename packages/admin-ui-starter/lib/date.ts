/**
 * Date Formatting Utilities
 *
 * Configurable date formatting with timezone support.
 * Timezone can be set via:
 * 1. APP_TIMEZONE env var
 * 2. Site settings (future)
 * 3. Defaults to UTC
 */

// Get timezone from environment or default to UTC
const getTimezone = (): string => {
  if (typeof Deno !== "undefined") {
    return Deno.env.get("APP_TIMEZONE") || "UTC";
  }
  return "UTC";
};

// Get locale from environment or default to en-IN
const getLocale = (): string => {
  if (typeof Deno !== "undefined") {
    return Deno.env.get("APP_LOCALE") || "en-IN";
  }
  return "en-IN";
};

/**
 * Format a date value to a localized date string
 *
 * @param date - Date string, Date object, or timestamp
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return "-";
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: getTimezone(),
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    };

    return dateObj.toLocaleDateString(getLocale(), defaultOptions);
  } catch {
    return "-";
  }
}

/**
 * Format a date value to a localized date-time string
 *
 * @param date - Date string, Date object, or timestamp
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date-time string
 */
export function formatDateTime(
  date: string | Date | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return "-";
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: getTimezone(),
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    };

    return dateObj.toLocaleString(getLocale(), defaultOptions);
  } catch {
    return "-";
  }
}

/**
 * Format a date to ISO date string (YYYY-MM-DD)
 *
 * @param date - Date string, Date object, or timestamp
 * @returns ISO date string
 */
export function toISODateString(date: string | Date | number): string {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return "";
    }

    return dateObj.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Parse a DD/MM/YYYY date string to YYYY-MM-DD
 *
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns ISO date string (YYYY-MM-DD) or empty string if invalid
 */
export function parseDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";

  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";

  const [, day, month, year] = match;
  const paddedDay = day.padStart(2, "0");
  const paddedMonth = month.padStart(2, "0");

  // Validate the date
  const dateObj = new Date(`${year}-${paddedMonth}-${paddedDay}`);
  if (isNaN(dateObj.getTime())) return "";

  return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Format a YYYY-MM-DD date to DD/MM/YYYY
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date string in DD/MM/YYYY format
 */
export function formatToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
