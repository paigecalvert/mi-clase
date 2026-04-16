require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const { initDb, pool } = require('./db');
const redis = require('./redis');
const { initStorage } = require('./storage');
const { getLicenseInfo, getUpdates } = require('./replicated');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } })); // 50MB limit

// ── Health endpoint ──────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const health = { status: 'ok', database: 'ok', cache: 'ok' };

  try {
    await pool.query('SELECT 1');
  } catch {
    health.database = 'error';
    health.status = 'error';
  }

  try {
    await redis.ping();
  } catch {
    health.cache = 'error';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// ── Replicated SDK proxy ──────────────────────────────────────────────────────
app.get('/api/license', async (req, res) => {
  try { res.json(await getLicenseInfo()); }
  catch { res.json(null); }
});

app.get('/api/updates', async (req, res) => {
  try { res.json(await getUpdates()); }
  catch { res.json([]); }
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/classes', require('./routes/classes'));
app.use('/api/classes/:id/notes', require('./routes/notes'));
app.use('/api/classes/:id/vocabulary', require('./routes/vocabulary'));
app.use('/api/classes/:id/homework', require('./routes/homework'));
app.use('/api/vocabulary', require('./routes/vocabulary'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/translate', require('./routes/translate'));

// ── Serve React frontend ──────────────────────────────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  // Wait for DB with retries (satisfies task 0.6)
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await initDb();
      console.log('[db] connected and schema ready');
      break;
    } catch (err) {
      console.error(`[db] attempt ${attempt}/10 failed: ${err.message}`);
      if (attempt === 10) process.exit(1);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  try {
    await redis.connect();
    console.log('[redis] connected');
  } catch (err) {
    console.warn('[redis] could not connect:', err.message);
  }

  try {
    await initStorage();
    console.log('[minio] storage ready');
  } catch (err) {
    console.warn('[minio] could not connect:', err.message);
  }

  app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
}

start();
