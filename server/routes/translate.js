const express = require('express');
const router = express.Router();

const LIBRE_TRANSLATE_URL = process.env.LIBRE_TRANSLATE_URL || 'http://localhost:5000';

router.post('/', async (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'word is required' });

  const { source = 'es', target = 'en' } = req.body;

  try {
    const response = await fetch(`${LIBRE_TRANSLATE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: word,
        source,
        target,
        format: 'text',
        ...(process.env.LIBRE_TRANSLATE_API_KEY
          ? { api_key: process.env.LIBRE_TRANSLATE_API_KEY }
          : {}),
      }),
    });

    if (!response.ok) {
      console.warn('[translate] LibreTranslate returned', response.status);
      return res.json({ translation: '' });
    }

    const data = await response.json();
    res.json({ translation: data.translatedText ?? '' });
  } catch (err) {
    // LibreTranslate not running — silently return empty so the UI stays functional
    console.warn('[translate] LibreTranslate unavailable:', err.message);
    res.json({ translation: '' });
  }
});

module.exports = router;
