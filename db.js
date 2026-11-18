// db.js – SQLite in-memory database with users table
const sqlite3 = require('sqlite3').verbose();

// In-memory DB works on Vercel serverless.
// For local persistence: new sqlite3.Database('./auth.db')
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
  } else {
    console.log('Connected to in-memory SQLite database');
  }
});

// Create users table
const initSql = `
CREATE TABLE IF NOT EXISTS users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT    NOT NULL UNIQUE,
  name     TEXT    NOT NULL,
  password TEXT    NOT NULL
);
`;

db.exec(initSql, (err) => {
  if (err) {
    console.error('Failed to create users table:', err.message);
  } else {
    console.log('Users table is ready');
  }
});

module.exports = db;
