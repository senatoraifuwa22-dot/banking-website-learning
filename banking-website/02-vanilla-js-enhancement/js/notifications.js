/**
 * Notifications page behavior for the vanilla JS banking demo.
 *
 * Responsibilities:
 * - Require authentication before loading data.
 * - Fetch and render mock notifications.
 * - Provide “mark as read” interactions (single + bulk).
 * - Stay resilient when expected DOM elements are missing.
 */

import { getAuthToken, isLoggedIn } from "./auth.js";
import { apiRequest } from "./apiClient.js";
import { formatDate } from "./ui/formatters.js";
import { createToast } from "./ui/toast.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const findFirst = (...selectors) => selectors.map((selector) => document.querySelector(selector)).find(Boolean);

const getAlertClass = (type = "info") => {
  const normalized = type.toString().toLowerCase();
  if (normalized === "success") return "alert--success";
  if (normalized === "warning") return "alert--warning";
  if (normalized === "danger") return "alert--danger";
  return "alert--info";
};

const getBadgeClass = (type = "info") => {
  const normalized = type.toString().toLowerCase();
  if (normalized === "success") return "badge--success";
  if (normalized === "warning") return "badge--warning";
  if (normalized === "danger") return "badge--danger";
  return "badge--info";
};

const renderEmptyState = (listEl) => {
  listEl.innerHTML = "";
  const empty = document.createElement("li");
  empty.className = "text-muted";
  empty.style.listStyle = "none";
  empty.textContent = "You're all caught up. No new notifications.";
  listEl.appendChild(empty);
};

const renderNotification = (notification) => {
  const item = document.createElement("li");
  item.className = `alert ${getAlertClass(notification.type)}`;
  item.dataset.notificationId = notification.id;
  item.style.cursor = "pointer";

  if (notification.read) {
    item.classList.add("text-muted");
    item.style.opacity = "0.75";
  }

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.gap = "0.75rem";

  const title = document.createElement("p");
  title.className = "alert__title";
  title.textContent = notification.title || "Notification";

  const badge = document.createElement("span");
  badge.className = `badge ${getBadgeClass(notification.type)}`;
  badge.textContent = notification.read ? "Read" : "Unread";
  if (notification.read) {
    badge.classList.add("text-muted");
  }

  header.append(title, badge);

  const message = document.createElement("p");
  message.className = "text-muted";
  message.textContent = notification.message || "";

  const timestamp = document.createElement("p");
  timestamp.className = "text-muted";
  timestamp.style.fontSize = "0.875rem";
  timestamp.textContent = formatDate(notification.timestamp);

  item.append(header, message, timestamp);
  return item;
};

const renderNotifications = (listEl, notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    renderEmptyState(listEl);
    return;
  }

  listEl.innerHTML = "";

  const sorted = [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  sorted.forEach((notification) => {
    listEl.appendChild(renderNotification(notification));
  });
};

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export const initNotifications = async () => {
  if (!isLoggedIn()) {
    createToast("Please log in to view your notifications.", { type: "warning" });
    window.location.href = "../../01-static-html-css/pages/login.html";
    return;
  }

  const listEl =
    findFirst("[data-notifications]", "[data-role='notifications-list']", "ul.list", "[aria-label='Notifications list']") ||
    document.querySelector("ul");

  if (!listEl) {
    console.warn("[Banking Demo] Notifications list container not found; skipping render.");
    return;
  }

  const markAllButton =
    findFirst("[data-mark-all-read]", "button[data-action='mark-all-read']") ||
    Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.toLowerCase().includes("mark all as read")
    );

  const authToken = getAuthToken();
  let notifications = [];

  try {
    notifications = await apiRequest({ path: "/notifications", authToken });
  } catch (error) {
    console.error("[Banking Demo] Failed to load notifications.", error);
    return;
  }

  renderNotifications(listEl, notifications);

  const markNotificationAsRead = async (id) => {
    const current = notifications.find((item) => item.id === id);
    if (!current || current.read) return;

    current.read = true;
    renderNotifications(listEl, notifications);

    try {
      await apiRequest({ path: "/notifications/mark-read", method: "POST", body: { id }, authToken });
    } catch (error) {
      console.error("[Banking Demo] Failed to mark notification as read.", error);
    }
  };

  if (markAllButton) {
    markAllButton.addEventListener("click", async () => {
      if (!notifications.length) return;

      notifications = notifications.map((item) => ({ ...item, read: true }));
      renderNotifications(listEl, notifications);

      try {
        await apiRequest({ path: "/notifications/mark-all-read", method: "POST", authToken });
      } catch (error) {
        console.error("[Banking Demo] Failed to mark all notifications as read.", error);
      }
    });
  }

  listEl.addEventListener("click", (event) => {
    const target = event.target.closest("[data-notification-id]");
    if (!target) return;
    const notificationId = target.dataset.notificationId;
    markNotificationAsRead(notificationId);
  });
};

