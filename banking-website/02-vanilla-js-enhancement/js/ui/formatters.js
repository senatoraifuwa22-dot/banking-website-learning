/**
 * Tiny formatting helpers used across the banking demo.
 * These functions intentionally keep logic readable for newer developers.
 */

/**
 * Convert a number into a localized currency string.
 *
 * @param {number|string} value - Amount to format.
 * @param {Object} options - Optional configuration.
 * @param {string} [options.locale="en-US"] - Locale tag for formatting.
 * @param {string} [options.currency="USD"] - Currency code.
 * @returns {string}
 */
export const formatCurrency = (value, { locale = "en-US", currency = "USD" } = {}) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date value as a friendly human-readable string.
 *
 * @param {Date|string|number} dateInput - Date instance or value parseable by Date.
 * @param {string} [locale="en-US"] - Locale tag.
 */
export const formatDate = (dateInput, locale = "en-US") => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

/**
 * Mask an account number, revealing only the last 4 digits.
 * Non-digit characters are preserved to keep formatting (spaces/hyphens).
 */
export const maskAccountNumber = (accountNumber) => {
  const str = (accountNumber ?? "").toString();
  if (!str) return "••••";

  const digits = str.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  const maskedPart = "•".repeat(Math.max(0, digits.length - last4.length));

  // Re-insert spacing for readability (group in 4s).
  const combined = (maskedPart + last4).match(/.{1,4}/g)?.join(" ") || maskedPart + last4;
  return combined.trim();
};

/**
 * Generate a compact reference code such as "REF-1A2B-3C4D".
 */
export const makeReferenceCode = () => {
  const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${rand()}-${rand()}`;
};
