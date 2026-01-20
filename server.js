const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------- MARCAR ASISTENCIA -----------------
app.post('/marcar', (req, res) => {
  const { nombre, rut, tipo } = req.body;
  if (!nombre || !rut || !tipo) return res.json({ ok: false, mensaje: 'Faltan datos' });

  const hora = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO asistencia (nombre, rut, tipo, hora) VALUES (?, ?, ?, ?)');
  stmt.run([nombre.trim(), rut.toUpperCase().trim(), tipo, hora], function(err) {
    if(err) return res.json({ ok: false, mensaje: 'Error al guardar asistencia' });
    res.json({ ok: true, mensaje: '✅ Registro guardado' });
  });
  stmt.finalize();
});

// ----------------- HISTORIAL -----------------
app.get('/registros/:rut', (req, res) => {
  const rut = req.params.rut.toUpperCase().trim();
  db.all('SELECT * FROM asistencia WHERE rut = ? ORDER BY hora DESC', [rut], (err, rows) => {
    if(err) return res.json([]);
    res.json(rows);
  });
});

// ----------------- RESUMEN DIARIO -----------------
app.get('/resumen/:rut', (req, res) => {
  const rut = req.params.rut.toUpperCase().trim();
  db.all(`
    SELECT DATE(hora) AS dia,
           MIN(CASE WHEN tipo='entrada' THEN hora END) AS entrada,
           MIN(CASE WHEN tipo='e_almuerzo' THEN hora END) AS e_almuerzo,
           MIN(CASE WHEN tipo='s_almuerzo' THEN hora END) AS s_almuerzo,
           MAX(CASE WHEN tipo='salida' THEN hora END) AS salida
    FROM asistencia
    WHERE rut = ?
    GROUP BY DATE(hora)
    ORDER BY dia DESC
  `, [rut], (err, rows) => {
    if(err) return res.json([]);
    // Calcular horas trabajadas y no trabajadas
    rows = rows.map(r => {
      const entrada = r.entrada ? new Date(r.entrada) : null;
      const salida = r.salida ? new Date(r.salida) : null;
      const horas_trabajadas = entrada && salida ? Math.floor((salida - entrada)/3600000) : 0;
      return { ...r, horas_trabajadas, horas_no_trabajadas: Math.max(8 - horas_trabajadas,0) };
    });
    res.json(rows);
  });
});

// ----------------- RESUMEN MENSUAL ADMIN -----------------
app.get('/resumen-mensual/:mes', (req, res) => {
  const mes = req.params.mes; // Formato YYYY-MM
  db.all(`
    SELECT rut, nombre,
           COUNT(DISTINCT DATE(hora)) AS dias_trabajados,
           SUM(
             CAST(
               (julianday(MAX(hora)) - julianday(MIN(hora))) * 24 AS INTEGER
             )
           ) AS horas_trabajadas
    FROM asistencia
    WHERE strftime('%Y-%m', hora) = ?
    GROUP BY rut, nombre
  `, [mes], (err, rows) => {
    if(err) return res.json([]);
    rows = rows.map(r => ({ ...r, horas_no_trabajadas: Math.max(8*r.dias_trabajados - r.horas_trabajadas,0) }));
    res.json(rows);
  });
});

// ----------------- LOGIN ADMIN -----------------
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = '1234';
  if(usuario === ADMIN_USER && password === ADMIN_PASS) res.json({ ok: true });
  else res.json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});