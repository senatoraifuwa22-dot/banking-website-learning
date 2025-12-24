/**
 * Global entry point for the vanilla JS enhancements.
 *
 * Goals for this file:
 * - Detect the current HTML file and import ONLY the JS module needed for it.
 * - Always boot shared UI helpers (toast + modal) so individual pages can use them.
 * - Stay 100% framework-free and extremely well commented for beginners.
 *
 * This script is intended to be loaded with <script type="module"> so we can
 * leverage modern ES module syntax while keeping everything simple.
 */

// -----------------------------------------------------------------------------
// Shared UI bootstrapping (toast + modal)
// -----------------------------------------------------------------------------

/**
 * Ensure the toast container exists so any page can call `createToast(...)`.
 * The dedicated container makes positioning and stacking predictable.
 */
const initToastSystem = () => {
  // Avoid duplicating the container if multiple scripts run.
  let root = document.getElementById("toast-root");
  if (root) return;

  root = document.createElement("div");
  root.id = "toast-root";

  // Accessibility: screen readers should announce toast updates.
  root.setAttribute("aria-live", "polite");
  root.setAttribute("role", "status");

  // A handful of inline styles keeps the demo self-contained.
  root.style.position = "fixed";
  root.style.top = "1rem";
  root.style.right = "1rem";
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.gap = "0.5rem";
  root.style.zIndex = "9999";

  document.body.appendChild(root);
};

/**
 * Ensure the modal root exists. The modal helper will render overlays into it.
 */
const initModalSystem = () => {
  if (document.getElementById("modal-root")) return;

  const modalRoot = document.createElement("div");
  modalRoot.id = "modal-root";
  modalRoot.setAttribute("aria-live", "polite");

  modalRoot.style.position = "fixed";
  modalRoot.style.inset = "0";
  modalRoot.style.zIndex = "9000";
  // Keep the placeholder container from intercepting clicks until a modal overlay exists.
  modalRoot.style.pointerEvents = "none";

  document.body.appendChild(modalRoot);
};

// -----------------------------------------------------------------------------
// Page detection helpers
// -----------------------------------------------------------------------------

/**
 * Grab the current HTML filename from the URL, e.g. "/pages/login.html" -> "login.html".
 * This keeps routing logic decoupled from folder structure.
 */
const getCurrentPage = () => {
  const pathname = window.location.pathname || "";
  const fileName = pathname.split("/").pop() || "index.html";
  return fileName.toLowerCase();
};

/**
 * Shared utility to import a module dynamically and call its initializer (if present).
 * All logic is guarded so missing functions/modules fail gracefully for beginners.
 */
const loadPageModule = async (modulePath, initFnName, label) => {
  try {
    const module = await import(modulePath);
    const initFn = module?.[initFnName];

    if (typeof initFn === "function") {
      initFn();
      console.log(`[Banking Demo] Initialized ${label} module via ${initFnName}().`);
    } else {
      console.log(`[Banking Demo] ${label} page has no JS behavior yet (${initFnName} missing).`);
    }
  } catch (error) {
    console.error(`[Banking Demo] Failed to load ${label} module from ${modulePath}.`, error);
  }
};

// -----------------------------------------------------------------------------
// Routing logic: map filenames to their initialization functions.
// -----------------------------------------------------------------------------

const pageInitializers = {
  "login.html": () => loadPageModule("./js/auth.js", "initLogin", "login"),
  "register.html": () => loadPageModule("./js/auth.js", "initRegister", "register"),
  "dashboard.html": () => loadPageModule("./js/dashboard.js", "initDashboard", "dashboard"),
  "accounts.html": () => loadPageModule("./js/accounts.js", "initAccounts", "accounts"),
  "transactions.html": () =>
    loadPageModule("./js/transactions.js", "initTransactions", "transactions"),
  "transfer.html": () => loadPageModule("./js/transfer.js", "initTransfer", "transfer"),
  "receipt.html": () => loadPageModule("./js/receipt.js", "initReceipt", "receipt"),
  "notifications.html": () =>
    loadPageModule("./js/notifications.js", "initNotifications", "notifications"),
  "profile.html": () => loadPageModule("./js/profile.js", "initProfile", "profile"),
};

/**
 * Admin pages can live under various filenames (e.g. "admin.html", "admin-users.html").
 * We treat any file containing "admin" in its name as an admin page.
 */
const isAdminPage = (pageName, pathname) =>
  pageName.includes("admin") || pathname.toLowerCase().includes("/admin");

// -----------------------------------------------------------------------------
// Boot sequence
// -----------------------------------------------------------------------------

const startApp = async () => {
  // Always prepare shared UI systems first so feature modules can rely on them.
  initToastSystem();
  initModalSystem();

  const pageName = getCurrentPage();
  const pathName = window.location.pathname || "";

  // Admin pages take precedence over specific filename matches.
  if (isAdminPage(pageName, pathName)) {
    await loadPageModule("./js/admin.js", "initAdmin", "admin");
    return;
  }

  const initPage = pageInitializers[pageName];

  if (initPage) {
    await initPage();
  } else {
    console.log(`[Banking Demo] No page-specific JS needed for "${pageName}".`);
  }
};

// Defer boot until the DOM is ready so we can safely manipulate the document.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp, { once: true });
} else {
  startApp();
}
