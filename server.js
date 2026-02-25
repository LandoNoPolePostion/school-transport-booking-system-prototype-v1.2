const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database(path.join(__dirname, 'transport.db'));

db.serialize(() => {
    // Ensure the basic table exists
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        vehicle TEXT,
        event TEXT,
        date TEXT,
        start TEXT,
        end TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT
    )`);

    // AUTO-FIX: Check if status column exists, if not, add it
    db.run("ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending'", (err) => {
        if (err) {
            console.log("Database column 'status' is already present.");
        } else {
            console.log("Fixed Database: Added 'status' column.");
        }
    });
});

// GET all bookings
app.get('/api/bookings', (req, res) => {
    db.all("SELECT * FROM bookings ORDER BY date, start", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST a new booking
app.post('/api/bookings', (req, res) => {
    const { name, vehicle, event, date, start, end } = req.body;
    db.run("INSERT INTO bookings (name, vehicle, event, date, start, end, created_at) VALUES (?,?,?,?,?,?,?)",
        [name, vehicle, event, date, start, end, new Date().toISOString()],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// PATCH to approve a booking
app.patch('/api/bookings/:id/approve', (req, res) => {
    const { id } = req.params;
    db.run("UPDATE bookings SET status = 'approved' WHERE id = ?", [id], function(err) {
        if (err) {
            console.error("Approval Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// DELETE a booking
app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM bookings WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
