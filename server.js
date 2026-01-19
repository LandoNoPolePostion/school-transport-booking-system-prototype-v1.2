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
});

app.get('/api/bookings', (req, res) => {
    db.all("SELECT * FROM bookings ORDER BY date, start", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

app.post('/api/bookings', (req, res) => {
    const { name, vehicle, event, date, start, end } = req.body;
    db.run("INSERT INTO bookings (name, vehicle, event, date, start, end, created_at) VALUES (?,?,?,?,?,?,?)",
        [name, vehicle, event, date, start, end, new Date().toISOString()],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ id: this.lastID });
        }
    );
});

app.patch('/api/bookings/:id/approve', (req, res) => {
    db.run("UPDATE bookings SET status = 'approved' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

app.delete('/api/bookings/:id', (req, res) => {
    db.run("DELETE FROM bookings WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

app.listen(PORT, () => console.log(`✅ Server running: http://localhost:${PORT}`));

  console.log(`✅ Server running at http://localhost:${PORT}`);
});


