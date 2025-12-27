// A tiny, in-memory data store for the learning project.
// Keeping everything in JS arrays makes it easy to see how data flows
// before wiring up a real database later in the course.

const users = [];
const accounts = [];
const transactions = [];
const transfers = [];
const audits = [];

// Helper: generate a simple unique-ish id for each collection.
const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

// CRUD helpers used across collections.
const addItem = (collection, prefix, item) => {
  const record = { id: createId(prefix), ...item };
  collection.push(record);
  return record;
};

const findItem = (collection, id) => collection.find((entry) => entry.id === id);

const updateItem = (collection, id, updates) => {
  const item = findItem(collection, id);
  if (!item) return null;
  Object.assign(item, updates);
  return item;
};

const removeItem = (collection, id) => {
  const index = collection.findIndex((entry) => entry.id === id);
  if (index === -1) return false;
  collection.splice(index, 1);
  return true;
};

module.exports = {
  // Raw collections (useful for quick reads in lessons).
  users,
  accounts,
  transactions,
  transfers,
  audits,

  // Users
  listUsers: () => [...users],
  addUser: (user) => addItem(users, 'usr', user),
  updateUser: (id, updates) => updateItem(users, id, updates),
  removeUser: (id) => removeItem(users, id),

  // Accounts
  listAccounts: () => [...accounts],
  addAccount: (account) => addItem(accounts, 'acct', account),
  updateAccount: (id, updates) => updateItem(accounts, id, updates),
  removeAccount: (id) => removeItem(accounts, id),

  // Transactions
  listTransactions: () => [...transactions],
  addTransaction: (transaction) => addItem(transactions, 'txn', transaction),
  updateTransaction: (id, updates) => updateItem(transactions, id, updates),
  removeTransaction: (id) => removeItem(transactions, id),

  // Transfers
  listTransfers: () => [...transfers],
  addTransfer: (transfer) => addItem(transfers, 'trf', transfer),
  updateTransfer: (id, updates) => updateItem(transfers, id, updates),
  removeTransfer: (id) => removeItem(transfers, id),

  // Audits
  listAudits: () => [...audits],
  addAudit: (audit) => addItem(audits, 'aud', audit),
  updateAudit: (id, updates) => updateItem(audits, id, updates),
  removeAudit: (id) => removeItem(audits, id)
};
