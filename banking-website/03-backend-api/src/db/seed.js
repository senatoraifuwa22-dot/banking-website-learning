// Populate the in-memory database with starter data.
// This keeps early lessons focused on Express fundamentals instead of setup.
function seedDatabase(db) {
  // Clear old data so restarting the server does not duplicate records.
  [db.users, db.accounts, db.transactions, db.transfers, db.audits].forEach(
    (collection) => collection.splice(0, collection.length)
  );

  // Create a simple admin and customer user.
  const adminUser = db.addUser({
    role: 'admin',
    name: 'Bank Admin',
    email: 'admin@example.com'
  });

  const customerUser = db.addUser({
    role: 'customer',
    name: 'Jane Customer',
    email: 'jane@example.com'
  });

  // Starter accounts for the customer.
  const checkingAccount = db.addAccount({
    userId: customerUser.id,
    type: 'checking',
    nickname: 'Daily Checking',
    number: '1001',
    balance: 1500
  });

  const savingsAccount = db.addAccount({
    userId: customerUser.id,
    type: 'savings',
    nickname: 'Rainy Day Savings',
    number: '1002',
    balance: 3200
  });

  const now = new Date().toISOString();

  // Transactions help show history on both accounts.
  db.addTransaction({
    accountId: checkingAccount.id,
    type: 'deposit',
    amount: 1500,
    description: 'Initial paycheck deposit',
    timestamp: now
  });

  db.addTransaction({
    accountId: checkingAccount.id,
    type: 'withdrawal',
    amount: -75,
    description: 'Grocery store',
    timestamp: now
  });

  db.addTransaction({
    accountId: savingsAccount.id,
    type: 'deposit',
    amount: 200,
    description: 'Monthly savings transfer',
    timestamp: now
  });

  // Simple transfer record between the two accounts.
  db.addTransfer({
    fromAccountId: checkingAccount.id,
    toAccountId: savingsAccount.id,
    amount: 200,
    description: 'Move funds to savings',
    timestamp: now
  });

  // Audit log example for admin actions.
  db.addAudit({
    userId: adminUser.id,
    action: 'seed_database',
    detail: 'Initial seed complete',
    timestamp: now
  });

  return {
    adminUser,
    customerUser,
    checkingAccount,
    savingsAccount
  };
}

module.exports = seedDatabase;
