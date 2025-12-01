const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Define the absolute path for the database file
const DB_PATH = path.join(__dirname, 'transport.db');

// Database setup - Use the absolute path
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log('Connected to the SQLite database at:', DB_PATH);
    }
});

db.run(`CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  event TEXT NOT NULL,
  date TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  created_at TEXT NOT NULL
)`, (err) => {
    if (err) {
        console.error("Error creating table:", err.message);
    }
});

// Helper function to format dates as YYYY-MM-DD (FIXED)
const formatDate = (d) => d.toISOString().split('T')[0];

// Routes
app.get('/api/bookings', (req, res) => {
  const today = formatDate(new Date()); // Now a single string 'YYYY-MM-DD'
  db.all("SELECT * FROM bookings WHERE date >= ? ORDER BY date, start", [today], (err, rows) => {
    if (err) {
        console.error("Error selecting bookings:", err.message);
        return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/bookings', (req, res) => {
  const { name, vehicle, event, date, start, end } = req.body;
  const createdAt = new Date().toISOString();

  db.run("INSERT INTO bookings (name, vehicle, event, date, start, end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, vehicle, event, date, start, end, createdAt],
    function (err) {
      if (err) {
          console.error("Error inserting booking:", err.message);
          return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, name, vehicle, event, date, start, end, created_at: createdAt });
    });
});

// Starts the server ONCE
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

