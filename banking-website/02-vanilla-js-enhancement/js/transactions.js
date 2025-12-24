/**
 * Transactions page behavior for the vanilla JS banking demo.
 *
 * Responsibilities:
 * - Require authentication before loading data.
 * - Fetch and render the user's transactions.
 * - Provide simple client-side filtering (search, type, date range).
 * - Fail gracefully when expected DOM elements are missing.
 */

import { getAuthToken, isLoggedIn } from "./auth.js";
import { apiRequest } from "./apiClient.js";
import { formatCurrency, formatDate } from "./ui/formatters.js";
import { createToast } from "./ui/toast.js";

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/**
 * Try multiple selectors and return the first matching element.
 */
const findFirst = (...selectors) => selectors.map((selector) => document.querySelector(selector)).find(Boolean);

/**
 * Locate the transactions table body using common selectors.
 * @returns {HTMLTableSectionElement|null}
 */
const findTableBody = () =>
  findFirst(
    "[data-transactions] tbody",
    "table[aria-label='Transactions table'] tbody",
    "#transactions tbody",
    ".transactions tbody"
  ) ||
  document.querySelector("table[aria-label='Transactions table']")?.querySelector("tbody");

// ---------------------------------------------------------------------------
// Filtering helpers
// ---------------------------------------------------------------------------

const getTransactionType = (amount) => (Number(amount) >= 0 ? "credit" : "debit");

const normalizeText = (value = "") => value.toString().toLowerCase();

const normalizeFilterType = (value = "all") => {
  const normalized = value.toString().toLowerCase();
  return normalized === "credit" || normalized === "debit" ? normalized : "all";
};

const parseDateInput = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const applyFilters = (transactions = [], filters = {}) => {
  const { search = "", type = "all", from, to } = filters;
  const searchTerm = normalizeText(search.trim());

  return transactions.filter((transaction) => {
    const description = normalizeText(transaction.description || transaction.merchant || "");
    const transactionType = getTransactionType(transaction.amount);
    const createdAt = new Date(transaction.createdAt);

    if (searchTerm && !description.includes(searchTerm)) return false;
    if (type !== "all" && transactionType !== type) return false;

    if (!Number.isNaN(createdAt.getTime())) {
      if (from && createdAt < from) return false;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        if (createdAt > endOfDay) return false;
      }
    }

    return true;
  });
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const buildStatusContent = (status) => {
  if (!status) return document.createTextNode("—");

  const badge = document.createElement("span");
  badge.className = "badge";

  const normalized = status.toString().toLowerCase();
  if (["success", "completed", "posted", "settled"].includes(normalized)) {
    badge.classList.add("badge--success");
  } else if (["pending", "processing", "in_progress"].includes(normalized)) {
    badge.classList.add("badge--info");
  } else if (["failed", "declined", "error"].includes(normalized)) {
    badge.classList.add("badge--danger");
  } else {
    badge.classList.add("badge--info");
  }

  const readable = normalized.replace(/_/g, " ");
  badge.textContent = readable.charAt(0).toUpperCase() + readable.slice(1);
  return badge;
};

const renderTransactions = (tableBody, transactions = []) => {
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!Array.isArray(transactions) || transactions.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 5;
    emptyCell.textContent = "No transactions found.";
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
    return;
  }

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  sorted.forEach((transaction) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(transaction.createdAt);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = transaction.description || transaction.merchant || "Transaction";

    const typeCell = document.createElement("td");
    const type = getTransactionType(transaction.amount);
    typeCell.textContent = type.charAt(0).toUpperCase() + type.slice(1);

    const amountCell = document.createElement("td");
    const formattedAmount = formatCurrency(transaction.amount);
    amountCell.textContent = Number(transaction.amount) >= 0 ? `+${formattedAmount}` : formattedAmount;

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusContent(transaction.status));

    row.append(dateCell, descriptionCell, typeCell, amountCell, statusCell);
    tableBody.appendChild(row);
  });
};

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export const initTransactions = async () => {
  if (!isLoggedIn()) {
    createToast("Please log in to view your transactions.", { type: "warning" });
    window.location.href = "../../01-static-html-css/pages/login.html";
    return;
  }

  const tableBody = findTableBody();
  if (!tableBody) {
    console.warn("[Banking Demo] Transactions table not found; skipping render.");
    return;
  }

  const authToken = getAuthToken();
  let allTransactions = [];

  try {
    allTransactions = await apiRequest({ path: "/transactions", authToken });
  } catch (error) {
    console.error("[Banking Demo] Failed to load transactions.", error);
    return;
  }

  const searchInput = findFirst("#search-text", "[data-filter='search']");
  const typeSelect = findFirst("#type-filter", "[data-filter='type']");
  const fromDateInput = findFirst("#from-date", "[data-filter='from']");
  const toDateInput = findFirst("#to-date", "[data-filter='to']");

  const getFilters = () => ({
    search: searchInput?.value || "",
    type: normalizeFilterType(typeSelect?.value || "all"),
    from: parseDateInput(fromDateInput?.value),
    to: parseDateInput(toDateInput?.value),
  });

  const refresh = () => {
    const filtered = applyFilters(allTransactions, getFilters());
    renderTransactions(tableBody, filtered);
  };

  [searchInput, typeSelect, fromDateInput, toDateInput].forEach((input) => {
    if (!input) return;
    const eventName = input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(eventName, refresh);
  });

  refresh();
};
