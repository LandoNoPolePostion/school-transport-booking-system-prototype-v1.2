// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./transport.db');

// Schema setup is handled primarily in server.js now for clarity

module.exports = db;



