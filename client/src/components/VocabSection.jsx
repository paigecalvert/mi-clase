import React, { useState, useEffect, useRef } from 'react';

const s = {
  section: { marginTop: 24 },
  title: { fontWeight: 700, fontSize: 15, marginBottom: 12, color: '#386641' },
  row: { display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' },
  input: {
    flex: 1, border: '1px solid #dee2e6', borderRadius: 8, padding: '8px 12px',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  translation: {
    flex: 1, border: '1px solid #dee2e6', borderRadius: 8, padding: '8px 12px',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  swapBtn: {
    background: 'none', border: 'none',
    cursor: 'pointer', padding: '0 4px', color: '#386641',
    display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  addBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
  },
  list: { maxHeight: 200, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 },
  item: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', borderBottom: '1px solid #f8f9fa', cursor: 'pointer',
  },
  wordPair: { display: 'flex', gap: 12, fontSize: 14 },
  es: { fontWeight: 600 },
  en: { color: '#6c757d' },
  delBtn: {
    background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer',
    fontSize: 16, lineHeight: 1, padding: 0,
  },
  empty: { color: '#6c757d', fontSize: 13, padding: '12px 14px' },

  // Flashcard modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  flashcard: {
    background: '#fff', borderRadius: 16, padding: '36px 32px 28px',
    width: 320, boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 16,
    background: 'none', border: 'none', color: '#adb5bd',
    cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0,
  },
  cardWord: {
    fontSize: 32, fontWeight: 700, color: '#386641',
    textAlign: 'center', marginBottom: 8,
  },
  cardDivider: {
    width: '100%', borderTop: '1px solid #f0f0f0', margin: '20px 0',
  },
  cardTranslation: {
    fontSize: 22, color: '#495057', textAlign: 'center', marginBottom: 4,
  },
  seeTransBtn: {
    marginTop: 28, background: '#386641', color: '#fff', border: 'none',
    borderRadius: 8, padding: '10px 24px', fontSize: 14,
    cursor: 'pointer', fontWeight: 600,
  },
  hideTransBtn: {
    marginTop: 16, background: 'none', border: '1px solid #dee2e6',
    borderRadius: 8, padding: '8px 20px', fontSize: 14,
    cursor: 'pointer', color: '#6c757d',
  },
};

export default function VocabSection({ classId, onSaving = () => {}, onSaved = () => {} }) {
  const [vocab, setVocab] = useState([]);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [direction, setDirection] = useState('es-en');
  const [translating, setTranslating] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const debounceRef = useRef(null);

  const fetchVocab = () =>
    fetch(`/api/classes/${classId}/vocabulary`)
      .then(r => r.json())
      .then(setVocab);

  useEffect(() => { fetchVocab(); }, [classId]);

  const handleSourceChange = (e) => {
    const val = e.target.value;
    setSource(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setTarget(''); return; }
    debounceRef.current = setTimeout(async () => {
      setTranslating(true);
      try {
        const [src, tgt] = direction === 'es-en' ? ['es', 'en'] : ['en', 'es'];
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: val, source: src, target: tgt }),
        });
        const data = await res.json();
        if (data.translation) setTarget(data.translation);
      } finally {
        setTranslating(false);
      }
    }, 600);
  };

  const swapDirection = () => {
    setDirection(d => d === 'es-en' ? 'en-es' : 'es-en');
    setSource('');
    setTarget('');
  };

  const addWord = async () => {
    if (!source.trim()) return;
    const spanish = direction === 'es-en' ? source : target;
    const english = direction === 'es-en' ? target : source;
    if (!spanish.trim()) return;

    onSaving();
    await fetch(`/api/classes/${classId}/vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spanish_word: spanish, english_translation: english }),
    });
    setSource('');
    setTarget('');
    fetchVocab();
    onSaved();
  };

  const deleteWord = async (id) => {
    onSaving();
    await fetch(`/api/classes/${classId}/vocabulary/${id}`, { method: 'DELETE' });
    fetchVocab();
    onSaved();
  };

  const openCard = (word) => {
    setSelectedWord(word);
    setShowTranslation(false);
  };

  const sourcePlaceholder = direction === 'es-en' ? 'Spanish word…' : 'English word…';
  const targetPlaceholder = translating
    ? 'Translating…'
    : direction === 'es-en' ? 'English translation…' : 'Spanish translation…';

  return (
    <div style={s.section}>
      <div style={s.title}>📚 Vocabulary</div>
      <div style={s.row}>
        <input
          name={direction === 'es-en' ? 'spanish-word' : 'english-word'}
          style={s.input}
          placeholder={sourcePlaceholder}
          value={source}
          onChange={handleSourceChange}
          onKeyDown={e => e.key === 'Enter' && addWord()}
        />
        <button style={s.swapBtn} onClick={swapDirection} title="Swap direction">
          <svg width="24" height="24" viewBox="0 0 107 106" fill="none">
            <path d="M56 57.7073L103.61 57.7073M87.0996 38.9999L103.788 57.6731C103.82 57.7093 103.82 57.764 103.788 57.8002L87.0996 76.4148" stroke="#386641" strokeWidth="5" strokeLinecap="round"/>
            <path d="M59.3498 35.4437L11.7401 35.4437M28.2503 16.7362L11.5617 35.4094C11.5294 35.4456 11.5294 35.5004 11.5618 35.5365L28.2503 54.1511" stroke="#386641" strokeWidth="5" strokeLinecap="round"/>
          </svg>
        </button>
        <input
          name={direction === 'es-en' ? 'english-translation' : 'spanish-translation'}
          style={s.translation}
          placeholder={targetPlaceholder}
          value={target}
          onChange={e => setTarget(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addWord()}
        />
        <button style={s.addBtn} onClick={addWord}>Add</button>
      </div>
      {vocab.length === 0 ? (
        <div style={{ ...s.list, border: 'none' }}>
          <div style={s.empty}>No vocabulary words yet.</div>
        </div>
      ) : (
        <div style={s.list}>
          {vocab.map(w => (
            <div key={w.id} style={s.item} onClick={() => openCard(w)}>
              <div style={s.wordPair}>
                <span style={s.es}>{w.spanish_word}</span>
                {w.english_translation && <span style={s.en}>→ {w.english_translation}</span>}
              </div>
              <button
                style={s.delBtn}
                onClick={e => { e.stopPropagation(); deleteWord(w.id); }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Flashcard popup */}
      {selectedWord && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setSelectedWord(null)}>
          <div style={s.flashcard}>
            <button style={s.closeBtn} onClick={() => setSelectedWord(null)}>✕</button>
            <div style={s.cardWord}>{selectedWord.spanish_word}</div>

            {showTranslation && (
              <>
                <div style={s.cardDivider} />
                <div style={s.cardTranslation}>
                  {selectedWord.english_translation || '—'}
                </div>
              </>
            )}

            {selectedWord.english_translation ? (
              <button
                style={showTranslation ? s.hideTransBtn : s.seeTransBtn}
                onClick={() => setShowTranslation(t => !t)}
              >
                {showTranslation ? 'Hide translation' : 'See translation'}
              </button>
            ) : (
              <p style={{ color: '#adb5bd', fontSize: 13, marginTop: 24 }}>No translation saved.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
