const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../db');
const { uploadFile, getFileStream, deleteFile } = require('../storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

function toArray(f) {
  if (!f) return [];
  return Array.isArray(f) ? f : [f];
}

async function hwWithFiles(rows) {
  if (!rows.length) return [];
  const { rows: files } = await pool.query(
    'SELECT * FROM homework_files WHERE homework_id = ANY($1::int[]) ORDER BY created_at ASC',
    [rows.map(h => h.id)]
  );
  const byId = {};
  for (const f of files) {
    if (!byId[f.homework_id]) byId[f.homework_id] = [];
    byId[f.homework_id].push(f);
  }
  return rows.map(h => ({ ...h, files: byId[h.id] || [] }));
}

// List homework for a class
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM homework WHERE class_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(await hwWithFiles(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch homework' });
  }
});

// Create a homework entry (with optional file uploads)
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO homework (class_id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, title || '', description || '']
    );
    const hwId = rows[0].id;

    const uploaded = [];
    for (const file of toArray(req.files?.file)) {
      const ext = path.extname(file.name);
      const key = `homework/${req.params.id}/${hwId}/${uuidv4()}${ext}`;
      await uploadFile(key, file.data, file.mimetype);
      const { rows: fr } = await pool.query(
        'INSERT INTO homework_files (homework_id, filename, object_key) VALUES ($1, $2, $3) RETURNING *',
        [hwId, file.name, key]
      );
      uploaded.push(fr[0]);
    }

    res.status(201).json({ ...rows[0], files: uploaded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create homework' });
  }
});

// Update homework title/description
router.patch('/:hwId', async (req, res) => {
  try {
    const { title, description } = req.body;
    const { rows } = await pool.query(
      'UPDATE homework SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [title ?? '', description ?? '', req.params.hwId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update homework' });
  }
});

// Add files to an existing homework entry
router.post('/:hwId/files', async (req, res) => {
  try {
    const added = [];
    for (const file of toArray(req.files?.file)) {
      const ext = path.extname(file.name);
      const key = `homework/${req.params.id || 'x'}/${req.params.hwId}/${uuidv4()}${ext}`;
      await uploadFile(key, file.data, file.mimetype);
      const { rows: fr } = await pool.query(
        'INSERT INTO homework_files (homework_id, filename, object_key) VALUES ($1, $2, $3) RETURNING *',
        [req.params.hwId, file.name, key]
      );
      added.push(fr[0]);
    }
    res.status(201).json(added);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Download a file
router.get('/:hwId/files/:fileId/download', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM homework_files WHERE id = $1', [req.params.fileId]);
    if (!rows[0]) return res.status(404).json({ error: 'File not found' });
    const stream = await getFileStream(rows[0].object_key);
    res.setHeader('Content-Disposition', `attachment; filename="${rows[0].filename}"`);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete a single file
router.delete('/:hwId/files/:fileId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM homework_files WHERE id = $1', [req.params.fileId]);
    if (rows[0]?.object_key) await deleteFile(rows[0].object_key).catch(() => {});
    await pool.query('DELETE FROM homework_files WHERE id = $1', [req.params.fileId]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Delete a homework entry (cascades to files in DB, also cleans up storage)
router.delete('/:hwId', async (req, res) => {
  try {
    const { rows: files } = await pool.query(
      'SELECT * FROM homework_files WHERE homework_id = $1',
      [req.params.hwId]
    );
    for (const f of files) await deleteFile(f.object_key).catch(() => {});
    await pool.query('DELETE FROM homework WHERE id = $1', [req.params.hwId]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete homework' });
  }
});

// All homework across all classes (used by MyHomework page)
router.get('/all', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT h.*, TO_CHAR(c.class_date, 'YYYY-MM-DD') AS class_date
      FROM homework h
      JOIN classes c ON c.id = h.class_id
      ORDER BY c.class_date DESC, h.created_at ASC
    `);
    res.json(await hwWithFiles(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all homework' });
  }
});

module.exports = router;
