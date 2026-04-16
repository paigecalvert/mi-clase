const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../db');

// Get vocab for a class
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM vocabulary WHERE class_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// Add a vocab word
router.post('/', async (req, res) => {
  try {
    const { spanish_word, english_translation } = req.body;
    if (!spanish_word) return res.status(400).json({ error: 'spanish_word is required' });

    const { rows } = await pool.query(
      'INSERT INTO vocabulary (class_id, spanish_word, english_translation) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, spanish_word.trim(), (english_translation || '').trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add vocabulary word' });
  }
});

// Delete a vocab word
router.delete('/:wordId', async (req, res) => {
  try {
    await pool.query('DELETE FROM vocabulary WHERE id = $1 AND class_id = $2', [
      req.params.wordId,
      req.params.id,
    ]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vocabulary word' });
  }
});

// All vocabulary across all classes
router.get('/all', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT v.*, TO_CHAR(c.class_date, 'YYYY-MM-DD') AS class_date
      FROM vocabulary v
      JOIN classes c ON c.id = v.class_id
      ORDER BY c.class_date DESC, v.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all vocabulary' });
  }
});

module.exports = router;
