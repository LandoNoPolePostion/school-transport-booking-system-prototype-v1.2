-- SQLite schema for bookings (using start/end times)
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  start TEXT NOT NULL, -- HH:MM
  end TEXT NOT NULL, -- HH:MM
  created_at TEXT NOT NULL
);


