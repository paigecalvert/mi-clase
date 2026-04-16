const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// List all classes with their notes, vocab count, homework count
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id,
        TO_CHAR(c.class_date, 'YYYY-MM-DD') AS class_date,
        c.created_at,
        COALESCE(n.content, '') AS notes,
        COUNT(DISTINCT v.id) AS vocab_count,
        COUNT(DISTINCT h.id) AS homework_count
      FROM classes c
      LEFT JOIN notes n ON n.class_id = c.id
      LEFT JOIN vocabulary v ON v.class_id = c.id
      LEFT JOIN homework h ON h.class_id = c.id
      GROUP BY c.id, n.content
      ORDER BY c.class_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get a single class with all details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const classRes = await pool.query(
      "SELECT id, TO_CHAR(class_date, 'YYYY-MM-DD') AS class_date, created_at FROM classes WHERE id = $1",
      [id]
    );
    if (classRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const notesRes = await pool.query('SELECT content FROM notes WHERE class_id = $1', [id]);
    const vocabRes = await pool.query('SELECT * FROM vocabulary WHERE class_id = $1 ORDER BY created_at ASC', [id]);
    const hwRes = await pool.query('SELECT * FROM homework WHERE class_id = $1 ORDER BY created_at ASC', [id]);

    res.json({
      ...classRes.rows[0],
      notes: notesRes.rows[0]?.content ?? '',
      vocabulary: vocabRes.rows,
      homework: hwRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// Create a new class
router.post('/', async (req, res) => {
  try {
    const { class_date } = req.body;
    if (!class_date) return res.status(400).json({ error: 'class_date is required' });

    const { rows } = await pool.query(
      'INSERT INTO classes (class_date) VALUES ($1) RETURNING *',
      [class_date]
    );
    // create empty notes row
    await pool.query('INSERT INTO notes (class_id, content) VALUES ($1, $2)', [rows[0].id, '']);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Update a class date
router.patch('/:id', async (req, res) => {
  try {
    const { class_date } = req.body;
    if (!class_date) return res.status(400).json({ error: 'class_date is required' });
    const { rows } = await pool.query(
      "UPDATE classes SET class_date = $1 WHERE id = $2 RETURNING id, TO_CHAR(class_date, 'YYYY-MM-DD') AS class_date, created_at",
      [class_date, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Delete a class
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM classes WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

module.exports = router;
