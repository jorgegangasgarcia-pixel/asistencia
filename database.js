const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./asistencia.db');

// Crear tabla de asistencia si no existe
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS asistencia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    rut TEXT,
    tipo TEXT,
    hora DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;