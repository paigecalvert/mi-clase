import React, { useState, useEffect } from 'react';
import FlashCardRunner from '../components/FlashCardRunner';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h1: { margin: 0, fontSize: 24, fontWeight: 700 },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center' },
  search: {
    border: '1px solid #dee2e6', borderRadius: 8, padding: '8px 14px',
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 200,
  },
  randomBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '9px 18px', fontSize: 14, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
  },
  empty: { textAlign: 'center', color: '#6c757d', padding: '48px 0', fontSize: 16 },
  group: { marginBottom: 24 },
  groupHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #f0f0f0',
  },
  groupLeft: { display: 'flex', alignItems: 'baseline', gap: 8 },
  groupLabel: {
    fontWeight: 700, fontSize: 13, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  count: { fontSize: 13, color: '#adb5bd' },
  flashBtn: {
    background: 'none', border: '1px solid #a7c957', borderRadius: 6,
    color: '#386641', cursor: 'pointer', padding: '3px 10px', fontSize: 12, fontWeight: 600,
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
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function MyVocabulary() {
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [flashcards, setFlashcards] = useState(null); // { title, words } | null

  useEffect(() => {
    fetch('/api/vocabulary/all').then(r => r.json()).then(data => {
      setVocab(data);
      setLoading(false);
    });
  }, []);

  const openRandom = () => {
    const withTranslation = vocab.filter(w => w.english_translation?.trim());
    const words = shuffle(withTranslation).slice(0, 10);
    setFlashcards({ title: 'Random Flashcards', words });
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
          <button style={s.randomBtn} onClick={openRandom}>▶ Random flashcards</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          {vocab.length === 0 ? 'No vocabulary words yet. Add words from a class.' : 'No words match your search.'}
        </div>
      ) : (
        sortedDates.map(date => (
          <div key={date} style={s.group}>
            <div style={s.groupHeader}>
              <div style={s.groupLeft}>
                <span style={s.groupLabel}>{formatDate(date)}</span>
                <span style={s.count}>({groups[date].length} word{groups[date].length !== 1 ? 's' : ''})</span>
              </div>
              <button
                style={s.flashBtn}
                onClick={() => setFlashcards({ title: formatDate(date), words: groups[date] })}
              >
                ▶ Flashcards
              </button>
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

      {flashcards && (
        <FlashCardRunner
          words={flashcards.words}
          title={flashcards.title}
          onClose={() => setFlashcards(null)}
        />
      )}
    </>
  );
}
