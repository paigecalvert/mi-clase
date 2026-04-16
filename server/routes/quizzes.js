const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { getLicenseField } = require('../replicated');

// Block all quiz routes when quiz_feature license field is not enabled.
// Fails open when the SDK is unreachable (local dev without Replicated).
router.use(async (req, res, next) => {
  try {
    const field = await getLicenseField('quiz_feature');
    if (field.value !== 'true') {
      return res.status(403).json({ error: 'quiz_feature_disabled' });
    }
  } catch {
    // SDK unavailable — allow access so local dev still works
  }
  next();
});

// List all quizzes (summary)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT q.*, COUNT(qw.id)::int AS word_count
      FROM quizzes q
      LEFT JOIN quiz_words qw ON qw.quiz_id = q.id
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get a single quiz with words
router.get('/:id', async (req, res) => {
  try {
    const { rows: [quiz] } = await pool.query('SELECT * FROM quizzes WHERE id = $1', [req.params.id]);
    if (!quiz) return res.status(404).json({ error: 'Not found' });
    const { rows: words } = await pool.query(
      'SELECT * FROM quiz_words WHERE quiz_id = $1 ORDER BY id ASC',
      [req.params.id]
    );
    res.json({ ...quiz, words });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Create a quiz with words
router.post('/', async (req, res) => {
  try {
    const { name, words = [] } = req.body;
    const { rows: [quiz] } = await pool.query(
      'INSERT INTO quizzes (name) VALUES ($1) RETURNING *',
      [name || 'Untitled Quiz']
    );
    const created = [];
    for (const w of words) {
      const { rows: [word] } = await pool.query(
        'INSERT INTO quiz_words (quiz_id, spanish_word, english_translation) VALUES ($1, $2, $3) RETURNING *',
        [quiz.id, w.spanish_word, w.english_translation || '']
      );
      created.push(word);
    }
    res.status(201).json({ ...quiz, words: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update quiz name and/or last score
router.patch('/:id', async (req, res) => {
  try {
    const { name, last_score_correct, last_score_total } = req.body;
    const { rows: [quiz] } = await pool.query(`
      UPDATE quizzes SET
        name = COALESCE($1, name),
        last_score_correct = COALESCE($2::int, last_score_correct),
        last_score_total = COALESCE($3::int, last_score_total),
        updated_at = NOW()
      WHERE id = $4 RETURNING *
    `, [name ?? null, last_score_correct ?? null, last_score_total ?? null, req.params.id]);
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete a quiz
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM quizzes WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Add a word to a quiz
router.post('/:id/words', async (req, res) => {
  try {
    const { spanish_word, english_translation } = req.body;
    const { rows: [word] } = await pool.query(
      'INSERT INTO quiz_words (quiz_id, spanish_word, english_translation) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, spanish_word, english_translation || '']
    );
    res.status(201).json(word);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add word' });
  }
});

// Remove a word from a quiz
router.delete('/:id/words/:wordId', async (req, res) => {
  try {
    await pool.query('DELETE FROM quiz_words WHERE id = $1 AND quiz_id = $2', [
      req.params.wordId,
      req.params.id,
    ]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove word' });
  }
});

module.exports = router;
