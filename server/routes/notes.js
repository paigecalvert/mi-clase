const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../db');

// Autosave notes for a class
router.put('/', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    await pool.query(`
      INSERT INTO notes (class_id, content, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (class_id) DO UPDATE SET content = $2, updated_at = NOW()
    `, [id, content ?? '']);

    res.json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

module.exports = router;
