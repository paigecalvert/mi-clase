import React, { useState } from 'react';

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '36px 40px 32px',
    width: 480, boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  progress: { fontSize: 13, color: '#adb5bd', alignSelf: 'flex-end', marginBottom: 32 },
  title: { fontSize: 13, fontWeight: 600, color: '#386641', marginBottom: 4, alignSelf: 'flex-start' },
  word: {
    fontSize: 36, fontWeight: 700, color: '#386641',
    textAlign: 'center', marginBottom: 32,
  },
  revealBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },
  translation: {
    fontSize: 20, fontWeight: 500, color: '#495057', textAlign: 'center',
    background: '#f2f7ec', borderRadius: 10, padding: '14px 24px',
    width: '100%', boxSizing: 'border-box', marginBottom: 24,
  },
  nextBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },
  doneTitle: { fontSize: 22, fontWeight: 700, marginBottom: 12 },
  doneCount: { fontSize: 18, color: '#6c757d', marginBottom: 28 },
  closeBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 32px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },
  emptyMsg: { color: '#6c757d', fontSize: 15, marginBottom: 24, textAlign: 'center' },
};

export default function FlashCardRunner({ words, title, onClose }) {
  const cards = words.filter(w => w.english_translation?.trim());
  const [phase, setPhase] = useState(cards.length === 0 ? 'empty' : 'question');
  const [index, setIndex] = useState(0);

  const current = cards[index];

  const reveal = () => setPhase('revealed');

  const next = () => {
    if (index < cards.length - 1) {
      setIndex(i => i + 1);
      setPhase('question');
    } else {
      setPhase('done');
    }
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.card}>

        {phase === 'empty' && (
          <>
            <p style={s.emptyMsg}>No flashcards available — add English translations to your vocabulary words first.</p>
            <button style={s.closeBtn} onClick={onClose}>Close</button>
          </>
        )}

        {(phase === 'question' || phase === 'revealed') && (
          <>
            <div style={s.title}>{title}</div>
            <div style={s.progress}>{index + 1} / {cards.length}</div>
            <div style={s.word}>{current.spanish_word}</div>

            {phase === 'question' && (
              <button style={s.revealBtn} onClick={reveal}>Reveal translation</button>
            )}

            {phase === 'revealed' && (
              <>
                <div style={s.translation}>{current.english_translation}</div>
                <button style={s.nextBtn} onClick={next}>
                  {index < cards.length - 1 ? 'Next →' : 'Finish'}
                </button>
              </>
            )}
          </>
        )}

        {phase === 'done' && (
          <>
            <div style={s.doneTitle}>All done!</div>
            <div style={s.doneCount}>You reviewed {cards.length} card{cards.length !== 1 ? 's' : ''}.</div>
            <button style={s.closeBtn} onClick={onClose}>Close</button>
          </>
        )}

      </div>
    </div>
  );
}
