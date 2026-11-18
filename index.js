// index.js – Lab 04: Registration, Login and JWT
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('./db');

// Secret key – move to .env in Lab 8
const JWT_SECRET = process.env.JWT_SECRET || 'my_super_secret_key_lab04';

const app = express();
app.use(cors());
app.use(express.json()); // Task 1: parse JSON bodies

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Lab 04 – JWT Auth API is running.' });
});

// ─── POST /register/ ─────────────────────────────────────────────────────────
// Task 3: Reject existing username with 400; hash password; save user.
app.post('/register/', async (req, res) => {
  const { username, name, password } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ error: 'username, name and password are required' });
  }

  try {
    // Check if username already exists (parameterised query – Task 4 rule)
    const existing = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ?',
        [username],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password (never store plain text – Task 2 rule)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, name, password) VALUES (?, ?, ?)',
        [username, name, hashedPassword],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /login/ ────────────────────────────────────────────────────────────
// Task 4: Return 400 for unknown user / wrong password; return { jwt_token } on success.
app.post('/login/', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    // Fetch user by username
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    // 400 for unknown user
    if (!user) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);

    // 400 for wrong password
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Task 5: Put only username in payload (never the password)
    const payload = { username: user.username };
    const jwt_token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ jwt_token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Export for Vercel serverless
module.exports = app;
