import React, { useEffect, useState } from 'react';
import QuizModal from '../components/QuizModal';
import QuizRunner from '../components/QuizRunner';

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h1: { margin: 0, fontSize: 24, fontWeight: 700 },
  btn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 20px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },
  empty: { textAlign: 'center', color: '#6c757d', padding: '48px 0', fontSize: 16 },
  locked: {
    textAlign: 'center', padding: '48px 24px',
    background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 12,
  },
  lockedTitle: { fontSize: 18, fontWeight: 700, color: '#795548', marginBottom: 8 },
  lockedMsg: { color: '#8d6e63', fontSize: 15 },
  card: {
    background: '#fff', border: '1px solid #e9ecef', borderRadius: 12,
    padding: '18px 20px', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 16,
  },
  cardMain: { flex: 1 },
  cardName: { fontWeight: 700, fontSize: 16, marginBottom: 4 },
  cardMeta: { fontSize: 13, color: '#6c757d' },
  cardBtns: { display: 'flex', gap: 8 },
  playBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 6,
    padding: '5px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
  },
  editBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 8,
    padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#495057',
  },
  deleteBtn: {
    background: 'none', border: 'none', color: '#adb5bd',
    cursor: 'pointer', fontSize: 18, padding: '0 4px',
  },
};

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editQuiz, setEditQuiz] = useState(null);
  const [runQuiz, setRunQuiz] = useState(null);

  const fetchQuizzes = () =>
    fetch('/api/quizzes').then(async res => {
      if (res.status === 403) { setLocked(true); setLoading(false); return; }
      setQuizzes(await res.json());
      setLoading(false);
    });

  useEffect(() => { fetchQuizzes(); }, []);

  const deleteQuiz = (id) => {
    if (!confirm('Delete this quiz?')) return;
    fetch(`/api/quizzes/${id}`, { method: 'DELETE' }).then(fetchQuizzes);
  };

  const handleComplete = (correct, total) => {
    if (!runQuiz) return;
    fetch(`/api/quizzes/${runQuiz.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_score_correct: correct, last_score_total: total }),
    }).then(fetchQuizzes);
  };

  if (loading) return <p style={{ color: '#6c757d' }}>Loading…</p>;

  if (locked) return (
    <div style={s.locked}>
      <div style={s.lockedTitle}>Quizzes not available</div>
      <div style={s.lockedMsg}>
        The quiz feature is not included in your current license. Contact your administrator to enable it.
      </div>
    </div>
  );

  return (
    <>
      <div style={s.header}>
        <h1 style={s.h1}>My Quizzes</h1>
        <button style={s.btn} onClick={() => setShowCreate(true)}>+ New Quiz</button>
      </div>

      {quizzes.length === 0 ? (
        <div style={s.empty}>No quizzes yet. Create one from your vocabulary words!</div>
      ) : (
        quizzes.map(q => (
          <div key={q.id} style={s.card}>
            <div style={s.cardMain}>
              <div style={s.cardName}>{q.name}</div>
              <div style={s.cardMeta}>
                {q.word_count} word{q.word_count !== 1 ? 's' : ''}
                {q.last_score_total > 0 && ` · Last score: ${q.last_score_correct}/${q.last_score_total}`}
              </div>
            </div>
            <div style={s.cardBtns}>
              <button style={s.playBtn} onClick={() => {
                fetch(`/api/quizzes/${q.id}`).then(r => r.json()).then(setRunQuiz);
              }}>▶ Play</button>
              <button style={s.editBtn} onClick={() => setEditQuiz(q)}>Edit</button>
              <button style={s.deleteBtn} onClick={() => deleteQuiz(q.id)}>✕</button>
            </div>
          </div>
        ))
      )}

      {showCreate && (
        <QuizModal
          quiz={null}
          onClose={() => setShowCreate(false)}
          onSave={() => { setShowCreate(false); fetchQuizzes(); }}
        />
      )}

      {editQuiz && (
        <QuizModal
          quiz={editQuiz}
          onClose={() => setEditQuiz(null)}
          onSave={() => { setEditQuiz(null); fetchQuizzes(); }}
        />
      )}

      {runQuiz && (
        <QuizRunner
          quiz={runQuiz}
          onClose={() => setRunQuiz(null)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
