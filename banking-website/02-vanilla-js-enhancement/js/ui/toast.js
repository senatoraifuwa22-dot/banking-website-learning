/**
 * Simple, reusable toast notifications for the banking demo.
 *
 * This module intentionally uses only vanilla JavaScript so beginners can
 * follow along without needing a framework. Every step is commented in detail.
 */

// A small helper that always returns the same container element.
// If the element does not exist yet we create it on the fly.
const ensureToastRoot = () => {
  let root = document.getElementById("toast-root");

  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";

    // `aria-live` tells screen readers to announce new toasts automatically.
    // `role="status"` provides extra context that the updates are informational.
    root.setAttribute("aria-live", "polite");
    root.setAttribute("role", "status");

    // A single fixed container makes stacking toasts predictable.
    root.style.position = "fixed";
    root.style.top = "1rem";
    root.style.right = "1rem";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.gap = "0.5rem";
    root.style.zIndex = "9999";

    document.body.appendChild(root);
  }

  return root;
};

/**
 * Create and display a toast message.
 *
 * @param {string} message - Human-friendly text to display.
 * @param {Object} options - Optional configuration.
 * @param {"info"|"success"|"warning"|"error"} [options.type="info"] - Visual style.
 * @param {number} [options.durationMs=3500] - How long the toast stays on screen.
 */
export const createToast = (message, { type = "info", durationMs = 3500 } = {}) => {
  const root = ensureToastRoot();

  // Create the outer toast element.
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  // Inline base styles keep the component portable even without a CSS file.
  toast.style.padding = "0.75rem 1rem";
  toast.style.borderRadius = "0.5rem";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
  toast.style.color = "#0f172a";
  toast.style.backgroundColor = {
    info: "#e0f2fe",
    success: "#dcfce7",
    warning: "#fef3c7",
    error: "#fee2e2",
  }[type] || "#e0f2fe";
  toast.style.border = `1px solid ${
    {
      info: "#38bdf8",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    }[type] || "#38bdf8"
  }`;

  // Allow manual dismissal via click for convenience.
  toast.addEventListener("click", () => removeToast(toast));

  // A slight opacity transition makes the disappearance feel smoother.
  toast.style.transition = "opacity 150ms ease, transform 150ms ease";
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  root.appendChild(toast);

  // Automatically remove the toast after the requested duration.
  const timeoutId = window.setTimeout(() => removeToast(toast), durationMs);

  // Store the timeout id so the removal helper can cancel if needed.
  toast.dataset.timeoutId = timeoutId.toString();
};

/**
 * Remove a toast element with a short fade-out animation.
 * @param {HTMLElement} toastEl
 */
const removeToast = (toastEl) => {
  if (!toastEl || toastEl.dataset.closing === "true") return;

  toastEl.dataset.closing = "true";

  // Cancel any pending auto-dismiss timer.
  if (toastEl.dataset.timeoutId) {
    window.clearTimeout(Number(toastEl.dataset.timeoutId));
  }

  toastEl.style.opacity = "0";
  toastEl.style.transform = "translateY(-6px)";

  // Remove from the DOM after the animation completes.
  window.setTimeout(() => {
    if (toastEl.parentElement) {
      toastEl.parentElement.removeChild(toastEl);
    }
  }, 180);
};

// Export the helper for potential manual control in other modules.
export const _removeToast = removeToast;
