import { getAuthToken, isLoggedIn } from "./auth.js";
import { apiRequest } from "./apiClient.js";
import { formatCurrency, maskAccountNumber } from "./ui/formatters.js";
import { createToast } from "./ui/toast.js";

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const findFirst = (...selectors) => selectors.map((selector) => document.querySelector(selector)).find(Boolean);

const describeAccount = (account = {}) => {
  const name = account.name || "Account";
  const number = maskAccountNumber(account.number);
  return `${name} (${number})`;
};

const buildAccountOption = (account) => {
  const option = document.createElement("option");
  option.value = account.id;
  const balanceLabel = formatCurrency(account.balance, { currency: account.currency || "USD" });
  option.textContent = `${describeAccount(account)} — ${balanceLabel}`;
  return option;
};

const populateFromAccounts = (selectEl, accounts = []) => {
  if (!selectEl) return;

  selectEl.innerHTML = "";

  if (!Array.isArray(accounts) || accounts.length === 0) {
    const placeholder = document.createElement("option");
    placeholder.textContent = "No accounts available";
    placeholder.value = "";
    selectEl.appendChild(placeholder);
    selectEl.disabled = true;
    return;
  }

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select an account";
  selectEl.appendChild(defaultOption);

  accounts.forEach((account) => selectEl.appendChild(buildAccountOption(account)));
};

const populateDestinationAccounts = (selectEl, accounts = [], excludeId) => {
  if (!selectEl) return;

  selectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select an internal account (optional)";
  selectEl.appendChild(placeholder);

  accounts
    .filter((account) => account.id !== excludeId)
    .forEach((account) => selectEl.appendChild(buildAccountOption(account)));
};

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export const initTransfer = async () => {
  if (!isLoggedIn()) {
    createToast("Please log in to make a transfer.", { type: "warning" });
    window.location.href = "../../01-static-html-css/pages/login.html";
    return;
  }

  const form = document.querySelector('form[aria-label="Transfer form"]') || document.querySelector("form");
  if (!form) {
    console.warn("[Banking Demo] Transfer form not found; skipping initTransfer.");
    return;
  }

  const fromSelect = findFirst("#from-account", "[data-from-account]", "select[name='from-account']");
  const toSelect = findFirst("#to-account", "[data-to-account]", "select[name='to-account']");
  const externalAccountInput = findFirst(
    "#account-number",
    "[data-external-account]",
    "input[name='external-account']",
    "input[name='account-number']",
    "[data-to-account-external]"
  );
  const amountInput = findFirst("#transfer-amount", "[data-transfer-amount]", "input[name='amount']");
  const noteInput = findFirst("#transfer-note", "[data-transfer-note]", "input[name='note']");
  const submitButton = form.querySelector('button[type="submit"]') || form.querySelector("button");

  const authToken = getAuthToken();
  let accounts = [];

  try {
    accounts = await apiRequest({ path: "/accounts", authToken });
  } catch (error) {
    console.error("[Banking Demo] Failed to load accounts for transfer page.", error);
    return;
  }

  if (fromSelect) {
    populateFromAccounts(fromSelect, accounts);
  } else {
    console.warn("[Banking Demo] From-account select not found; transfer form may not function fully.");
  }

  if (toSelect) {
    populateDestinationAccounts(toSelect, accounts, fromSelect?.value);
  }

  if (fromSelect && toSelect) {
    fromSelect.addEventListener("change", () => populateDestinationAccounts(toSelect, accounts, fromSelect.value));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!fromSelect) {
      createToast("Please refresh the page and try again (source account missing).", { type: "error" });
      return;
    }

    const fromAccountId = fromSelect.value;
    const destinationId = toSelect?.value || "";
    const externalAccount = externalAccountInput?.value?.trim() || "";
    const amount = Number(amountInput?.value || 0);
    const note = noteInput?.value?.trim();

    if (!fromAccountId) {
      createToast("Please select the account to transfer from.", { type: "warning" });
      return;
    }

    if (!destinationId && !externalAccount) {
      createToast("Please select an internal account or enter an external account.", { type: "warning" });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      createToast("Please enter a valid amount greater than 0.", { type: "warning" });
      amountInput?.focus();
      return;
    }

    const fromAccount = accounts.find((account) => account.id === fromAccountId);
    if (!fromAccount) {
      createToast("The selected source account is unavailable.", { type: "error" });
      return;
    }

    if (amount > Number(fromAccount.balance || 0)) {
      createToast("Cannot transfer more than the available balance.", { type: "warning" });
      amountInput?.focus();
      return;
    }

    const destinationAccount = accounts.find((account) => account.id === destinationId);
    const toAccountValue = destinationId || externalAccount;

    const setSubmitting = (state) => {
      if (!submitButton) return;
      submitButton.disabled = state;
      if (state) {
        submitButton.dataset.originalText = submitButton.dataset.originalText || submitButton.textContent;
        submitButton.textContent = "Submitting...";
      } else if (submitButton.dataset.originalText) {
        submitButton.textContent = submitButton.dataset.originalText;
      }
    };

    setSubmitting(true);

    try {
      const response = await apiRequest({
        path: "/transfers",
        method: "POST",
        authToken,
        body: {
          fromAccountId,
          ...(destinationId ? { toAccountId: destinationId } : { toAccount: externalAccount }),
          amount,
          ...(note ? { note } : {}),
        },
      });

      const reference = response?.reference || response?.referenceCode || response?.receipt?.reference || "Pending";
      const formattedAmount = formatCurrency(amount, { currency: fromAccount.currency || "USD" });
      const fromLabel = describeAccount(fromAccount);
      const toLabel = destinationAccount ? describeAccount(destinationAccount) : toAccountValue;

      createToast(`Sent ${formattedAmount} from ${fromLabel} to ${toLabel}. Ref: ${reference}`, {
        type: "success",
      });

      form.reset();
      if (fromSelect.options.length > 0) {
        fromSelect.value = "";
      }
      populateDestinationAccounts(toSelect, accounts, fromSelect?.value);
    } catch (error) {
      console.error("[Banking Demo] Transfer submission failed.", error);
    } finally {
      setSubmitting(false);
    }
  });
};
