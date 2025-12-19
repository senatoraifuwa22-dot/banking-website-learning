/**
 * Friendly API client for the vanilla JS banking demo.
 *
 * This file purposely contains plenty of comments so beginners can follow
 * each step. The client can talk to a real backend later, but for now it uses
 * an in-memory mock so the UI can already function.
 */

// Feature flag: flip this to true once a real backend exists.
export const USE_BACKEND = false;

import { createToast } from "./ui/toast.js";
import { openContactOfficerModal } from "./ui/contactOfficerModal.js";
import { makeReferenceCode } from "./ui/formatters.js";

// ---------------------------------------------------------------------------
// Shared error + officer helpers
// ---------------------------------------------------------------------------

// Officer details are fetched once and cached for future failures.
let cachedOfficerContact = null;

const fallbackOfficer = {
  name: "Casey Taylor",
  phone: "+1 (555) 010-8899",
  email: "support@demo-bank.test",
};

const fetchOfficerContact = async () => {
  if (cachedOfficerContact) return cachedOfficerContact;

  try {
    const response = await fetch("/shared/officer-contact.json");
    if (!response.ok) throw new Error("Contact lookup failed");
    cachedOfficerContact = await response.json();
  } catch (error) {
    // Quietly fall back so the app never blocks on this request.
    cachedOfficerContact = fallbackOfficer;
  }

  return cachedOfficerContact;
};

/**
 * Centralized failure handler.
 *
 * Every error goes through here so we always show a toast, open the
 * "Contact Officer" modal, and attach a reference code the user can quote.
 */
export const handleFailure = async (errorLike, context = "") => {
  const reference = errorLike?.requestId || makeReferenceCode();
  const normalizedError = {
    errorCode: errorLike?.errorCode || "CONTACT_OFFICER",
    message: errorLike?.message || "Something went wrong. Please contact support.",
    requestId: reference,
  };

  // Show a quick toast so the user immediately knows something failed.
  createToast(`${normalizedError.message} (Ref: ${reference})`, { type: "error" });

  // Open the modal with officer details and the reference number.
  const officer = await fetchOfficerContact();
  openContactOfficerModal({ officer, referenceCode: reference, reason: context });

  // Throw so callers can short-circuit their workflows.
  throw normalizedError;
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

// In-memory state keeps everything lightweight. Refreshing the page resets it.
const mockState = {
  users: [
    {
      id: "user-1",
      email: "demo@bank.test",
      password: "password123",
      name: "Demo Customer",
    },
  ],
  tokens: new Map(),
  accounts: [
    {
      id: "acct-1",
      userId: "user-1",
      name: "Everyday Checking",
      number: "1234567890",
      balance: 4280.75,
      currency: "USD",
    },
    {
      id: "acct-2",
      userId: "user-1",
      name: "Savings Vault",
      number: "9876543210",
      balance: 13250.35,
      currency: "USD",
    },
  ],
  transactions: [
    {
      id: "tx-1",
      accountId: "acct-1",
      description: "Coffee shop",
      amount: -8.75,
      createdAt: Date.now() - 1000 * 60 * 60 * 4,
    },
    {
      id: "tx-2",
      accountId: "acct-1",
      description: "Direct deposit",
      amount: 1800,
      createdAt: Date.now() - 1000 * 60 * 60 * 26,
    },
    {
      id: "tx-3",
      accountId: "acct-2",
      description: "Transfer to checking",
      amount: -200,
      createdAt: Date.now() - 1000 * 60 * 60 * 30,
    },
  ],
  transfers: new Map(),
};

const makeId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const requireAuth = async (authToken) => {
  const userId = mockState.tokens.get(authToken);
  if (!userId) {
    await handleFailure({ errorCode: "UNAUTHORIZED", message: "Please sign in to continue." }, "Authentication");
  }
  const user = mockState.users.find((u) => u.id === userId);
  if (!user) {
    await handleFailure({ errorCode: "UNAUTHORIZED", message: "Session expired. Please log in again." }, "Authentication");
  }
  return user;
};

// ---------------------------------------------------------------------------
// Mock endpoints
// ---------------------------------------------------------------------------

const mockAuth = {
  register: async ({ email, password, name }) => {
    if (!email || !password) {
      await handleFailure({ errorCode: "VALIDATION", message: "Email and password are required." }, "Registration");
    }

    const existing = mockState.users.find((user) => user.email === email);
    if (existing) {
      await handleFailure({ errorCode: "EMAIL_IN_USE", message: "This email is already registered." }, "Registration");
    }

    const newUser = { id: makeId("user"), email, password, name: name || "New Customer" };
    mockState.users.push(newUser);

    // New customers start with a blank checking account for the demo.
    mockState.accounts.push({
      id: makeId("acct"),
      userId: newUser.id,
      name: "New Checking",
      number: `${Math.floor(Math.random() * 9e9) + 1e9}`,
      balance: 0,
      currency: "USD",
    });

    const token = makeId("token");
    mockState.tokens.set(token, newUser.id);
    return { user: { id: newUser.id, email: newUser.email, name: newUser.name }, token };
  },
  login: async ({ email, password }) => {
    const user = mockState.users.find((u) => u.email === email && u.password === password);
    if (!user) {
      await handleFailure({ errorCode: "INVALID_CREDENTIALS", message: "Incorrect email or password." }, "Login");
    }

    const token = makeId("token");
    mockState.tokens.set(token, user.id);
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  },
  me: async (authToken) => {
    const user = await requireAuth(authToken);
    return { user: { id: user.id, email: user.email, name: user.name } };
  },
};

const mockAccounts = async (authToken) => {
  const user = await requireAuth(authToken);
  return mockState.accounts.filter((acct) => acct.userId === user.id);
};

const mockTransactions = async (authToken, { accountId } = {}) => {
  const user = await requireAuth(authToken);
  const accounts = mockState.accounts.filter((acct) => acct.userId === user.id);
  const allowedAccountIds = accounts.map((acct) => acct.id);

  return mockState.transactions
    .filter((tx) => (accountId ? tx.accountId === accountId : allowedAccountIds.includes(tx.accountId)))
    .sort((a, b) => b.createdAt - a.createdAt);
};

const mockTransfer = {
  initiate: async (authToken, { fromAccountId, toAccountId, amount }) => {
    const user = await requireAuth(authToken);

    if (!fromAccountId || !toAccountId || !amount) {
      await handleFailure({ errorCode: "VALIDATION", message: "Please fill in all transfer fields." }, "Initiate transfer");
    }

    const fromAccount = mockState.accounts.find((acct) => acct.id === fromAccountId && acct.userId === user.id);
    if (!fromAccount) {
      await handleFailure({ errorCode: "ACCOUNT_NOT_FOUND", message: "Source account not found." }, "Initiate transfer");
    }

    if (Number(amount) > fromAccount.balance) {
      await handleFailure({ errorCode: "INSUFFICIENT_FUNDS", message: "Insufficient funds for this transfer." }, "Initiate transfer");
    }

    const transferId = makeId("transfer");
    mockState.transfers.set(transferId, {
      id: transferId,
      userId: user.id,
      fromAccountId,
      toAccountId,
      amount: Number(amount),
      status: "PENDING_OTP",
      otp: null,
      createdAt: Date.now(),
    });

    return { transferId, status: "PENDING_OTP" };
  },
  sendOtp: async (authToken, { transferId }) => {
    const transfer = mockState.transfers.get(transferId);
    await requireAuth(authToken);

    if (!transfer) {
      await handleFailure({ errorCode: "TRANSFER_NOT_FOUND", message: "Transfer could not be located." }, "Send OTP");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    transfer.otp = {
      code,
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    // In a real app this would be sent via SMS/email. Here we return it for convenience.
    return { status: "OTP_SENT", code };
  },
  verifyOtp: async (authToken, { transferId, code }) => {
    const transfer = mockState.transfers.get(transferId);
    await requireAuth(authToken);

    if (!transfer || !transfer.otp) {
      await handleFailure({ errorCode: "TRANSFER_NOT_FOUND", message: "Transfer could not be located." }, "Verify OTP");
    }

    const now = Date.now();
    if (transfer.otp.expiresAt < now) {
      await handleFailure({ errorCode: "OTP_EXPIRED", message: "The one-time passcode has expired." }, "Verify OTP");
    }

    if (transfer.otp.attempts >= 5) {
      await handleFailure({ errorCode: "OTP_LOCKED", message: "Too many attempts. Please contact your officer." }, "Verify OTP");
    }

    if (transfer.otp.code !== code) {
      transfer.otp.attempts += 1;
      await handleFailure({ errorCode: "OTP_INVALID", message: "Invalid passcode. Please try again." }, "Verify OTP");
    }

    transfer.status = "VERIFIED";
    return { status: "VERIFIED" };
  },
  confirm: async (authToken, { transferId, note }) => {
    const transfer = mockState.transfers.get(transferId);
    const user = await requireAuth(authToken);

    if (!transfer) {
      await handleFailure({ errorCode: "TRANSFER_NOT_FOUND", message: "Transfer could not be located." }, "Confirm transfer");
    }

    if (transfer.status !== "VERIFIED") {
      await handleFailure({ errorCode: "OTP_REQUIRED", message: "Please verify the passcode before confirming." }, "Confirm transfer");
    }

    const fromAccount = mockState.accounts.find((acct) => acct.id === transfer.fromAccountId && acct.userId === user.id);
    if (!fromAccount) {
      await handleFailure({ errorCode: "ACCOUNT_NOT_FOUND", message: "Source account not found." }, "Confirm transfer");
    }

    if (transfer.amount > fromAccount.balance) {
      await handleFailure({ errorCode: "INSUFFICIENT_FUNDS", message: "Insufficient funds for this transfer." }, "Confirm transfer");
    }

    fromAccount.balance -= transfer.amount;

    const toAccount = mockState.accounts.find((acct) => acct.id === transfer.toAccountId);
    if (toAccount) {
      toAccount.balance += transfer.amount;
    }

    const receiptId = makeId("tx");
    mockState.transactions.push({
      id: receiptId,
      accountId: fromAccount.id,
      description: note || "Transfer",
      amount: -transfer.amount,
      createdAt: Date.now(),
    });

    transfer.status = "COMPLETED";

    return {
      transferId,
      receipt: {
        id: receiptId,
        fromAccount: fromAccount.number,
        toAccount: toAccount?.number || transfer.toAccountId,
        amount: transfer.amount,
        currency: fromAccount.currency,
        createdAt: Date.now(),
        reference: makeReferenceCode(),
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Public API request router
// ---------------------------------------------------------------------------

/**
 * Lightweight request wrapper so calling code has a single entry point.
 *
 * @param {Object} options
 * @param {string} options.path - API path such as "/auth/login".
 * @param {string} [options.method="GET"] - HTTP verb (only relevant once a backend exists).
 * @param {Object} [options.body] - Payload for POST/PUT requests.
 * @param {string} [options.authToken] - Session token for authenticated requests.
 */
export const apiRequest = async ({ path, method = "GET", body, authToken } = {}) => {
  try {
    if (!USE_BACKEND) {
      return await routeMockRequest({ path, method: method.toUpperCase(), body, authToken });
    }

    // Placeholder for future backend support.
    const response = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      await handleFailure(errorPayload || { message: `Request failed with ${response.status}` }, path);
    }

    return response.json();
  } catch (error) {
    // Ensure unexpected issues are still reported consistently.
    if (error?.errorCode) throw error;
    await handleFailure({ message: error.message || "Unexpected error" }, path);
  }
};

const routeMockRequest = async ({ path, method, body = {}, authToken }) => {
  const normalizedPath = path.replace(/^\/+/, "");

  switch (true) {
    case normalizedPath === "auth/register" && method === "POST":
      return mockAuth.register(body);
    case normalizedPath === "auth/login" && method === "POST":
      return mockAuth.login(body);
    case normalizedPath === "auth/me" && method === "GET":
      return mockAuth.me(authToken);

    case normalizedPath === "accounts" && method === "GET":
      return mockAccounts(authToken);

    case normalizedPath.startsWith("transactions") && method === "GET": {
      const url = new URL(`https://demo.local/${normalizedPath}`);
      const accountId = url.searchParams.get("accountId");
      return mockTransactions(authToken, { accountId });
    }

    case normalizedPath === "transfer/initiate" && method === "POST":
      return mockTransfer.initiate(authToken, body);
    case normalizedPath === "transfer/send-otp" && method === "POST":
      return mockTransfer.sendOtp(authToken, body);
    case normalizedPath === "transfer/verify-otp" && method === "POST":
      return mockTransfer.verifyOtp(authToken, body);
    case normalizedPath === "transfer/confirm" && method === "POST":
      return mockTransfer.confirm(authToken, body);

    default:
      await handleFailure({ message: `Unknown endpoint: ${path}` }, "Unknown request");
  }
};

