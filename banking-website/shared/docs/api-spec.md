# API spec (draft for upcoming Express server)

Base URL (planned): `http://localhost:3000/api`. Routes are designed to match the static and JS-enhanced pages; implementation is pending in `03-backend-api`.

## Error format (all endpoints)
Errors are consistent so the frontend can display friendly messages.
```json
{
  "errorCode": "ACCOUNT_NOT_FOUND",
  "message": "Account 12345 was not found",
  "requestId": "7c9f1201"
}
```

## Auth
- **POST `/auth/register`**
  - Request: `{ "email": "user@example.com", "password": "P@ssw0rd!", "fullName": "Avery Doe" }`
  - Response: `{ "userId": "u_123", "email": "user@example.com", "token": "jwt-token" }`
- **POST `/auth/login`**
  - Request: `{ "email": "user@example.com", "password": "P@ssw0rd!" }`
  - Response: `{ "userId": "u_123", "token": "jwt-token", "expiresIn": 3600 }`

## Accounts & balances
- **GET `/accounts`**
  - Response: `{ "accounts": [{ "id": "acc_checking", "type": "checking", "balance": 2450.12 }, { "id": "acc_savings", "type": "savings", "balance": 5400.00 }] }`
- **GET `/accounts/:id/transactions`**
  - Response: `{ "accountId": "acc_checking", "transactions": [{ "id": "tx_001", "amount": -25.5, "description": "Coffee Bar", "status": "posted" }] }`

## Transfers & receipts
- **POST `/transfers`**
  - Request: `{ "fromAccountId": "acc_checking", "toAccountId": "acc_savings", "amount": 100.00, "memo": "Move to savings" }`
  - Response: `{ "transferId": "tr_789", "status": "confirmed", "receiptUrl": "/receipts/tr_789" }`
- **GET `/receipts/:transferId`**
  - Response: `{ "transferId": "tr_789", "from": "acc_checking", "to": "acc_savings", "amount": 100.00, "confirmedAt": "2024-01-12T15:04:05Z" }`

## Notifications
- **GET `/notifications/preferences`**
  - Response: `{ "email": true, "sms": false, "loginAlerts": true, "largeWithdrawalAlerts": true }`
- **PUT `/notifications/preferences`**
  - Request: `{ "email": true, "sms": true, "loginAlerts": true, "largeWithdrawalAlerts": false }`
  - Response: `{ "saved": true }`

## Profile
- **GET `/profile`**
  - Response: `{ "fullName": "Avery Doe", "phone": "+1-555-123-4567", "address": "100 Main St" }`
- **PATCH `/profile`**
  - Request: `{ "phone": "+1-555-987-6543" }`
  - Response: `{ "updated": true }`

## Admin & audit
- **GET `/admin/users`**
  - Response: `{ "users": [{ "id": "u_123", "email": "user@example.com", "status": "active" }] }`
- **PATCH `/admin/users/:id/status`**
  - Request: `{ "status": "disabled" }`
  - Response: `{ "updated": true }`
- **GET `/admin/audit`**
  - Response: `{ "entries": [{ "id": "audit_001", "actor": "admin@bankly.test", "action": "DISABLE_USER", "timestamp": "2024-01-12T16:00:00Z" }] }`

## Support / contact officer
- **GET `/support/contact-officer`**
  - Response: `{ "name": "Jordan Smith", "email": "officer@bankly.test", "phone": "+1-555-555-0000", "hours": "Mon-Fri 9am-5pm" }`
  - Behavior: the API reads from `shared/officer-contact.json` by default. If the `CONTACT_OFFICER` environment variable points to another JSON file, that file overrides the default. When the file is missing, the API should return an error in the standard format with guidance to fall back to the bundled `shared/officer-contact.json` served by the static site.
