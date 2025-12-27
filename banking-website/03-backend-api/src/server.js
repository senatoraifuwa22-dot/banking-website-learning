// Simple Express server scaffold for the backend API.
// This file will grow over the lessons as you add routes, auth, and more.
const express = require('express');
const memoryDb = require('./db/memoryDb');
const seedDatabase = require('./db/seed');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Parse JSON bodies so req.body works for future routes.
app.use(express.json());

// Seed the in-memory database every time the server boots.
seedDatabase(memoryDb);

// Health check endpoint for uptime monitoring and local checks.
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString()
  });
});

// Place all future routes above this line.
// Centralized error handler keeps responses consistent.
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
