import React, { useState, useEffect } from 'react';
import QuizModal from '../components/QuizModal';
import QuizRunner from '../components/QuizRunner';

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h1: { margin: 0, fontSize: 24, fontWeight: 700 },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center' },
  search: {
    border: '1px solid #dee2e6', borderRadius: 8, padding: '8px 14px',
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 200,
  },
  addQuizBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '9px 18px', fontSize: 14, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
  },

  // Quiz section
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontWeight: 700, fontSize: 15, color: '#386641' },
  quizList: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 },
  quizCard: {
    background: '#fff', borderRadius: 10, padding: '12px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', gap: 12, fontSize: 14,
  },
  quizName: { fontWeight: 600, flex: 1 },
  quizMeta: { color: '#6c757d', fontSize: 13, whiteSpace: 'nowrap' },
  quizScore: (pct) => ({
    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
    color: pct >= 80 ? '#386641' : pct >= 50 ? '#a7c957' : '#bc4749',
  }),
  quizActions: { display: 'flex', gap: 6 },
  playBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 6,
    padding: '5px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
  },
  editBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 6,
    color: '#6c757d', cursor: 'pointer', padding: '5px 10px', fontSize: 13,
  },
  delBtn: {
    background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer',
    fontSize: 15, padding: '0 0 0 2px',
  },

  // Vocab section
  empty: { textAlign: 'center', color: '#6c757d', padding: '48px 0', fontSize: 16 },
  group: { marginBottom: 24 },
  groupHeader: {
    fontWeight: 700, fontSize: 13, color: '#6c757d', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #f0f0f0',
  },
  list: {
    background: '#fff', borderRadius: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden',
  },
  item: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px', borderBottom: '1px solid #f8f9fa', fontSize: 14,
  },
  wordPair: { display: 'flex', gap: 12 },
  es: { fontWeight: 600 },
  en: { color: '#6c757d' },
  count: { fontSize: 13, color: '#adb5bd', marginLeft: 8 },
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function MyVocabulary() {
  const [vocab, setVocab] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [runningQuiz, setRunningQuiz] = useState(null); // full quiz object with words

  const fetchVocab = () =>
    fetch('/api/vocabulary/all').then(r => r.json()).then(setVocab);

  const fetchQuizzes = () =>
    fetch('/api/quizzes').then(r => r.json()).then(setQuizzes);

  useEffect(() => {
    Promise.all([fetchVocab(), fetchQuizzes()]).then(() => setLoading(false));
  }, []);

  const startQuiz = async (quiz) => {
    const full = await fetch(`/api/quizzes/${quiz.id}`).then(r => r.json());
    setRunningQuiz(full);
  };

  const handleQuizComplete = async (quizId, correct, total) => {
    await fetch(`/api/quizzes/${quizId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_score_correct: correct, last_score_total: total }),
    });
    fetchQuizzes();
  };

  const deleteQuiz = async (id) => {
    if (!confirm('Delete this quiz?')) return;
    await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
    fetchQuizzes();
  };

  if (loading) return <p style={{ color: '#6c757d' }}>Loading…</p>;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? vocab.filter(w =>
        w.spanish_word.toLowerCase().includes(q) ||
        (w.english_translation || '').toLowerCase().includes(q)
      )
    : vocab;

  const groups = {};
  for (const w of filtered) {
    if (!groups[w.class_date]) groups[w.class_date] = [];
    groups[w.class_date].push(w);
  }
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div style={s.header}>
        <h1 style={s.h1}>My Vocabulary</h1>
        <div style={s.headerRight}>
          <input
            style={s.search}
            placeholder="Search words…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button style={s.addQuizBtn} onClick={() => setShowCreateModal(true)}>+ Add a quiz</button>
        </div>
      </div>

      {/* Quizzes */}
      {quizzes.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={s.sectionTitle}>Quizzes</div>
          <div style={{ height: 8 }} />
          <div style={s.quizList}>
            {quizzes.map(qz => {
              const hasScore = qz.last_score_total != null;
              const pct = hasScore ? Math.round((qz.last_score_correct / qz.last_score_total) * 100) : null;
              return (
                <div key={qz.id} style={s.quizCard}>
                  <span style={s.quizName}>{qz.name}</span>
                  <span style={s.quizMeta}>{qz.word_count} word{qz.word_count !== 1 ? 's' : ''}</span>
                  {hasScore
                    ? <span style={s.quizScore(pct)}>Last: {qz.last_score_correct}/{qz.last_score_total}</span>
                    : <span style={{ ...s.quizMeta }}>Not attempted</span>
                  }
                  <div style={s.quizActions}>
                    <button style={s.playBtn} onClick={() => startQuiz(qz)}>▶ Start</button>
                    <button style={s.editBtn} onClick={() => setEditingQuiz(qz)}>✎</button>
                    <button style={s.delBtn} onClick={() => deleteQuiz(qz.id)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vocabulary */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          {vocab.length === 0 ? 'No vocabulary words yet. Add words from a class.' : 'No words match your search.'}
        </div>
      ) : (
        sortedDates.map(date => (
          <div key={date} style={s.group}>
            <div style={s.groupHeader}>
              {formatDate(date)}
              <span style={s.count}>({groups[date].length} word{groups[date].length !== 1 ? 's' : ''})</span>
            </div>
            <div style={s.list}>
              {groups[date].map((w, i) => (
                <div
                  key={w.id}
                  style={{ ...s.item, ...(i === groups[date].length - 1 ? { borderBottom: 'none' } : {}) }}
                >
                  <div style={s.wordPair}>
                    <span style={s.es}>{w.spanish_word}</span>
                    {w.english_translation && <span style={s.en}>→ {w.english_translation}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showCreateModal && (
        <QuizModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => { setShowCreateModal(false); fetchQuizzes(); }}
        />
      )}

      {editingQuiz && (
        <QuizModal
          quiz={editingQuiz}
          onClose={() => setEditingQuiz(null)}
          onSave={() => { setEditingQuiz(null); fetchQuizzes(); }}
        />
      )}

      {runningQuiz && (
        <QuizRunner
          quiz={runningQuiz}
          onClose={() => setRunningQuiz(null)}
          onComplete={(correct, total) => {
            handleQuizComplete(runningQuiz.id, correct, total);
            setRunningQuiz(null);
          }}
        />
      )}
    </>
  );
}
