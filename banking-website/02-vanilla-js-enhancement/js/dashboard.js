/**
 * Dashboard behavior for the vanilla JS banking demo.
 *
 * This module keeps logic intentionally beginner-friendly with small helpers
 * and plentiful comments so new developers can follow along.
 */

import { getAuthToken, isLoggedIn } from "./auth.js";
import { apiRequest } from "./apiClient.js";
import { formatCurrency, formatDate, maskAccountNumber } from "./ui/formatters.js";
import { createToast } from "./ui/toast.js";

// ---------------------------------------------------------------------------
// Tiny DOM helpers
// ---------------------------------------------------------------------------

/**
 * Try multiple selectors and return the first matching element.
 * This is handy when HTML markup may change slightly over time.
 */
const findFirst = (...selectors) => selectors.map((selector) => document.querySelector(selector)).find(Boolean);

/**
 * Locate a balance element within a summary card by heading text or selectors.
 * Prefers strong tags to avoid overwriting surrounding labels.
 */
const findBalanceElement = (headingText, selectors = []) => {
  const directMatch = findFirst(...selectors);
  if (directMatch) return directMatch;

  const headings = Array.from(document.querySelectorAll(".card__title, h2"));
  const targetHeading = headings.find((heading) =>
    heading?.textContent?.toLowerCase().includes(headingText.toLowerCase())
  );

  const card = targetHeading?.closest(".card") || targetHeading?.parentElement;
  if (!card) return null;

  return card.querySelector("strong") || card.querySelector("[data-balance]") || card.querySelector(".card__body");
};

// ---------------------------------------------------------------------------
// Balance + summary helpers
// ---------------------------------------------------------------------------

/**
 * Sum balances across all accounts.
 * @param {Array} accounts
 * @returns {number}
 */
export const computeTotalBalance = (accounts = []) =>
  accounts.reduce((total, account) => total + Number(account?.balance || 0), 0);

/**
 * Render the top-line summary values (total, checking, savings).
 */
export const renderSummary = (accounts = []) => {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    console.warn("[Banking Demo] No accounts found to render dashboard summary.");
    return;
  }

  const defaultCurrency = accounts[0]?.currency || "USD";
  const formatBalance = (value, currency) => formatCurrency(value, { currency: currency || defaultCurrency });

  const updateBalance = (account, label, selectors, overrideAmount) => {
    const target = findBalanceElement(label, selectors);

    if (!target) {
      console.warn(`[Banking Demo] Could not find ${label} balance element on the page.`);
      return;
    }

    const amount = overrideAmount ?? (account ? Number(account.balance || 0) : 0);
    target.textContent = formatBalance(amount, account?.currency);
  };

  // Total balance across every account.
  const totalBalance = computeTotalBalance(accounts);
  updateBalance(null, "total balance", ["#total-balance", "[data-total-balance]", '[data-role="total-balance"]'], totalBalance);

  // Best-effort lookup for common account types.
  const findAccountByName = (keyword) =>
    accounts.find((account) => account?.name?.toLowerCase().includes(keyword.toLowerCase()));

  const checkingAccount = findAccountByName("checking") || accounts[0];
  const savingsAccount = findAccountByName("saving") || accounts.find((acct) => acct !== checkingAccount);

  updateBalance(checkingAccount, "checking", ["#checking-balance", "[data-checking-balance]", '[data-role="checking-balance"]']);
  updateBalance(savingsAccount, "savings", ["#savings-balance", "[data-savings-balance]", '[data-role="savings-balance"]']);
};

// ---------------------------------------------------------------------------
// Recent transactions rendering
// ---------------------------------------------------------------------------

/**
 * Choose a badge style based on status text.
 */
const getStatusBadgeClass = (status = "") => {
  const normalized = status.toString().toLowerCase();
  if (["success", "completed", "settled"].includes(normalized)) return "badge--success";
  if (["pending", "processing", "in_progress"].includes(normalized)) return "badge--warning";
  if (["failed", "declined", "error"].includes(normalized)) return "badge--danger";
  return "badge--info";
};

/**
 * Safely render the recent transactions table body.
 */
export const renderRecentTransactions = (transactions = [], accounts = []) => {
  const tableBody =
    findFirst("[data-recent-transactions] tbody", "table[aria-label='Recent transactions'] tbody", "#recent-transactions tbody", ".recent-transactions tbody") ||
    document.querySelector("table[aria-label='Recent transactions']")?.querySelector("tbody");

  if (!tableBody) {
    console.warn("[Banking Demo] Recent transactions table body not found; skipping render.");
    return;
  }

  tableBody.innerHTML = "";

  if (!Array.isArray(transactions) || transactions.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 4;
    emptyCell.textContent = "No recent transactions yet.";
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
    return;
  }

  const accountById = accounts.reduce((map, account) => ({ ...map, [account.id]: account }), {});
  const defaultCurrency = accounts[0]?.currency || "USD";

  const sortedTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  sortedTransactions.forEach((transaction) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(transaction.createdAt);

    const descriptionCell = document.createElement("td");
    const account = accountById[transaction.accountId];
    const accountLabel = account?.number ? ` · ${maskAccountNumber(account.number)}` : "";
    descriptionCell.textContent = `${transaction.description || "Transaction"}${accountLabel}`;

    const amountCell = document.createElement("td");
    const currency = account?.currency || defaultCurrency;
    const formattedAmount = formatCurrency(transaction.amount, { currency });
    amountCell.textContent = Number(transaction.amount) >= 0 ? `+${formattedAmount}` : formattedAmount;

    const statusCell = document.createElement("td");
    if (transaction.status) {
      const badge = document.createElement("span");
      badge.className = `badge ${getStatusBadgeClass(transaction.status)}`;
      const readableStatus = transaction.status.toString().replace(/_/g, " ");
      badge.textContent = readableStatus.charAt(0).toUpperCase() + readableStatus.slice(1).toLowerCase();
      statusCell.appendChild(badge);
    } else {
      statusCell.textContent = "—";
    }

    row.append(dateCell, descriptionCell, amountCell, statusCell);
    tableBody.appendChild(row);
  });
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Initialize the dashboard page.
 */
export const initDashboard = async () => {
  // Quick auth gate: if the user is not logged in, redirect them to the login page.
  if (!isLoggedIn()) {
    createToast("Please log in to view your dashboard.", { type: "warning" });
    window.location.href = "../../01-static-html-css/pages/login.html";
    return;
  }

  const authToken = getAuthToken();

  let accounts = [];
  try {
    accounts = await apiRequest({ path: "/accounts", authToken });
    renderSummary(accounts);
  } catch (error) {
    console.error("[Banking Demo] Failed to load accounts for dashboard.", error);
    return;
  }

  try {
    const transactions = await apiRequest({ path: "/transactions", authToken });
    renderRecentTransactions(transactions, accounts);
  } catch (error) {
    console.error("[Banking Demo] Failed to load transactions for dashboard.", error);
  }
};
