# 03 - Backend API (Express)

This folder contains the starting point for the backend portion of the banking project. It is intentionally lightweight so you can focus on learning the Express fundamentals before adding authentication, validation, and real persistence.

## Quick start

```bash
cd banking-website/03-backend-api
npm install
npm start
```

The server listens on port `3001` by default. Set the `PORT` environment variable to override it:

```bash
PORT=4000 npm start
```

## Current endpoints

- `GET /health` — returns `{ ok: true, ts }` so you can confirm the API is running.
- Every request receives an `x-request-id` header so errors and logs can be correlated easily.

## Project structure

- `src/server.js` — sets up Express, seeds the in-memory database, and wires the error handler.
- `src/db/memoryDb.js` — simple arrays plus CRUD helpers to mock a database.
- `src/db/seed.js` — seeds one admin, one customer, starter accounts, and example transactions.
- `src/middleware/errorHandler.js` — ensures all errors share the format `{ errorCode, message, requestId }`.

## Notes for learners

- Express is the only dependency to keep focus on core concepts.
- Data is stored in memory and resets every time you restart the server.
- Errors follow the format `{ errorCode, message, requestId }`. You can also send your own
  `x-request-id` header to trace logs across multiple calls.
- More routes will be added in later steps—this is just the foundation.
