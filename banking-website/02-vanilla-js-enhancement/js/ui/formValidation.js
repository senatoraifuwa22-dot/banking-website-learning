/**
 * Simple, reusable form validation helpers.
 * The goal is to keep logic approachable for beginners.
 */

/**
 * Ensure a value is present (non-empty after trimming).
 * @returns {string|null} Error message or null if valid.
 */
export const required = (value) => {
  if (value === null || value === undefined) return "This field is required.";
  if (value.toString().trim() === "") return "This field is required.";
  return null;
};

/**
 * Ensure a string meets a minimum length.
 * Usage: minLength(3)(value)
 */
export const minLength = (min) => (value) => {
  if (value === null || value === undefined) return `Please enter at least ${min} characters.`;
  return value.toString().trim().length >= min
    ? null
    : `Please enter at least ${min} characters.`;
};

/**
 * Basic email check. Empty values are treated as valid so you can combine with `required`.
 */
export const email = (value) => {
  if (value === null || value === undefined || value.toString().trim() === "") return null;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(value.toString().trim()) ? null : "Please enter a valid email address.";
};

/**
 * Validate currency/amount style input (positive numbers).
 */
export const amount = (value) => {
  if (value === null || value === undefined || value.toString().trim() === "") return null;
  const numeric = Number(value.toString().replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(numeric)) return "Please enter a valid amount.";
  if (numeric <= 0) return "Amount must be greater than zero.";
  return null;
};

/**
 * Apply validation rules declared via data attributes.
 *
 * Example markup:
 * <input name="email" data-validate="required|email">
 * <input name="name" data-validate="required|minLength:2">
 *
 * @param {HTMLFormElement} formEl
 * @returns {{ ok: boolean, errors: Array<{field: string, message: string}> }}
 */
export const validateForm = (formEl) => {
  const errors = [];
  if (!(formEl instanceof HTMLFormElement)) {
    return { ok: false, errors: [{ field: "form", message: "Invalid form element." }] };
  }

  // Map rule names to validator functions.
  const validators = {
    required,
    email,
    amount,
    minLength: (value, arg) => minLength(Number(arg || 0))(value),
  };

  const fields = formEl.querySelectorAll("[data-validate]");

  fields.forEach((field) => {
    const rawRules = field.dataset.validate || "";
    const value = field.value ?? "";

    rawRules.split("|").forEach((ruleChunk) => {
      if (!ruleChunk.trim()) return;

      // Support arguments like "minLength:3".
      const [ruleName, arg] = ruleChunk.split(":");
      const validator = validators[ruleName];
      if (!validator) return;

      const message = validator(value, arg);
      if (message) {
        const fieldLabel = field.name || field.id || "Field";
        errors.push({ field: fieldLabel, message });

        // Provide basic inline feedback for accessibility.
        field.setAttribute("aria-invalid", "true");
        field.dataset.error = message;
      } else {
        field.removeAttribute("aria-invalid");
        delete field.dataset.error;
      }
    });
  });

  return { ok: errors.length === 0, errors };
};
