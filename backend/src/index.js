import express from 'express';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'laboratorio',
  user: process.env.DB_USER || 'laboratorio_user',
  password: process.env.DB_PASSWORD || 'laboratorio_dev_123'
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/api/personas', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, correo, creado_en FROM personas ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron consultar las personas.' });
  }
});

app.post('/api/personas', async (req, res) => {
  const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
  const correo = typeof req.body.correo === 'string' ? req.body.correo.trim() : '';

  if (!nombre || !correo || nombre.length > 100 || correo.length > 150 || !/^\S+@\S+\.\S+$/.test(correo)) {
    return res.status(400).json({ error: 'Escribe un nombre y un correo válido.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO personas (nombre, correo) VALUES ($1, $2) RETURNING id, nombre, correo, creado_en',
      [nombre, correo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese correo ya está registrado.' });
    }
    console.error(error);
    res.status(500).json({ error: 'No se pudo guardar la persona.' });
  }
});

app.delete('/api/personas/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identificador inválido.' });
  }
  try {
    const result = await pool.query('DELETE FROM personas WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Persona no encontrada.' });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo eliminar la persona.' });
  }
});

async function start() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS personas (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      correo VARCHAR(150) NOT NULL UNIQUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  app.listen(port, '0.0.0.0', () => console.log(`API disponible en el puerto ${port}`));
}

start().catch((error) => {
  console.error('No fue posible iniciar la API o preparar la tabla:', error);
  process.exit(1);
});
