/**
 * Lightweight modal helper for the banking demo.
 *
 * Goals:
 * - No dependencies or frameworks.
 * - Extremely well-commented for learners.
 * - Accessible defaults (focus trapping, ESC to close, overlay clicks).
 */

let modalRoot; // Lazily created container for all modal content.
let currentOverlay; // The overlay element currently in use.
let restoreFocusEl; // The element that had focus before the modal opened.

/**
 * Make sure we have a single modal root element to render into.
 * Creating it once avoids DOM duplication when the helper is reused.
 */
const ensureModalRoot = () => {
  if (modalRoot) return modalRoot;

  modalRoot = document.getElementById("modal-root");

  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "modal-root";
    modalRoot.setAttribute("aria-live", "polite");
    modalRoot.style.position = "fixed";
    modalRoot.style.inset = "0";
    modalRoot.style.zIndex = "9000";
    // Leave the container inert until an overlay is mounted so it cannot block UI like the navbar.
    modalRoot.style.pointerEvents = "none";
    document.body.appendChild(modalRoot);
  } else {
    // If a server-rendered modal root already exists, make sure it stays inert by default.
    modalRoot.style.pointerEvents = "none";
  }

  return modalRoot;
};

/**
 * Trap focus within the modal dialog so keyboard users do not tab out by accident.
 * This is a simplified version: it keeps focus cycling between the first and last
 * focusable elements we can find.
 */
const trapFocus = (dialogEl, event) => {
  if (event.key !== "Tab") return;

  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ];

  const focusableEls = dialogEl.querySelectorAll(focusableSelectors.join(","));
  if (focusableEls.length === 0) return;

  const first = focusableEls[0];
  const last = focusableEls[focusableEls.length - 1];

  // If Shift+Tab on the first element, jump to the last.
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  }
  // If Tab on the last element, loop back to the first.
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

/**
 * Open a modal with the given content.
 * @param {HTMLElement|string} elementOrHtmlString - Content node or safe HTML.
 */
export const openModal = (elementOrHtmlString) => {
  closeModal(); // Close any existing modal before opening a new one.

  const root = ensureModalRoot();
  root.innerHTML = ""; // Reset any previous content.

  // The overlay dims the background and captures clicks.
  const overlay = document.createElement("div");
  // Class name lets CSS re-enable pointer events only when an overlay is present,
  // keeping the always-mounted #modal-root from blocking the page.
  overlay.classList.add("modal-overlay");
  currentOverlay = overlay;
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(15, 23, 42, 0.55)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.pointerEvents = "auto";

  // Clicking outside the dialog closes it.
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  // The dialog is the actual modal content box.
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.style.background = "white";
  dialog.style.borderRadius = "0.75rem";
  dialog.style.padding = "1.5rem";
  dialog.style.maxWidth = "520px";
  dialog.style.width = "min(90vw, 520px)";
  dialog.style.boxShadow = "0 20px 60px rgba(0,0,0,0.25)";
  dialog.style.position = "relative";
  dialog.style.maxHeight = "90vh";
  dialog.style.overflowY = "auto";

  // Inject supplied content into the dialog.
  if (typeof elementOrHtmlString === "string") {
    dialog.innerHTML = elementOrHtmlString;
  } else if (elementOrHtmlString instanceof HTMLElement) {
    dialog.appendChild(elementOrHtmlString);
  } else {
    dialog.textContent = "Modal content could not be rendered.";
  }

  // Remember the element with focus so we can restore it when closing.
  restoreFocusEl = document.activeElement;

  // Listen for ESC key to close.
  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    } else {
      trapFocus(dialog, event);
    }
  };

  document.addEventListener("keydown", onKeyDown);

  // Store cleanup callback on the overlay for use in closeModal.
  overlay.dataset.keyListener = "true";
  overlay._onKeyDown = onKeyDown;

  overlay.appendChild(dialog);
  root.appendChild(overlay);

  // Prevent background scrolling while modal is open.
  document.body.style.overflow = "hidden";

  // Focus the first focusable element or the dialog itself.
  const focusable = dialog.querySelector(
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
  );
  (focusable || dialog).focus();
};

/**
 * Close the currently open modal (if any) and clean up listeners/state.
 */
export const closeModal = () => {
  if (!currentOverlay) return;

  // Remove the keydown listener we attached during openModal.
  if (currentOverlay._onKeyDown) {
    document.removeEventListener("keydown", currentOverlay._onKeyDown);
  }

  if (modalRoot?.contains(currentOverlay)) {
    modalRoot.removeChild(currentOverlay);
  }

  currentOverlay = null;
  modalRoot = ensureModalRoot();
  modalRoot.innerHTML = "";

  // Restore body scrolling.
  document.body.style.overflow = "";

  // Return focus to the element that had it before the modal opened.
  if (restoreFocusEl && typeof restoreFocusEl.focus === "function") {
    restoreFocusEl.focus();
  }
  restoreFocusEl = null;
};
