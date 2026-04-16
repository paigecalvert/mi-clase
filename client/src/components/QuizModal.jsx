import React, { useState, useEffect } from 'react';

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 12, padding: '28px 28px 24px',
    width: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalTitle: { margin: '0 0 20px', fontSize: 18, fontWeight: 700 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#495057', marginBottom: 6 },
  nameInput: {
    width: '100%', border: '1px solid #dee2e6', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', marginBottom: 18,
  },
  modeRow: { display: 'flex', gap: 8, marginBottom: 16 },
  modeBtn: (active) => ({
    flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500,
    border: active ? '2px solid #386641' : '1px solid #dee2e6',
    background: active ? '#f2e8cf' : '#fff',
    color: active ? '#386641' : '#495057',
  }),
  search: {
    width: '100%', border: '1px solid #dee2e6', borderRadius: 8,
    padding: '8px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', marginBottom: 8,
  },
  wordList: { flex: 1, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, minHeight: 0 },
  wordRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderBottom: '1px solid #f8f9fa', fontSize: 14, cursor: 'pointer',
  },
  checkbox: { accentColor: '#386641', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 },
  wordEs: { fontWeight: 600 },
  wordEn: { color: '#6c757d' },
  removeBtn: {
    marginLeft: 'auto', background: 'none', border: 'none', color: '#adb5bd',
    cursor: 'pointer', fontSize: 14, padding: 0, flexShrink: 0,
  },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  count: { fontSize: 13, color: '#6c757d' },
  footerBtns: { display: 'flex', gap: 10 },
  cancelBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 8,
    padding: '9px 18px', fontSize: 14, cursor: 'pointer', color: '#6c757d', fontWeight: 500,
  },
  saveBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '9px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
  regenBtn: {
    background: 'none', border: '1px solid #386641', borderRadius: 8,
    color: '#386641', padding: '6px 14px', fontSize: 13, cursor: 'pointer', marginBottom: 8,
  },
  sectionLabel: { fontSize: 13, fontWeight: 600, color: '#6c757d', marginBottom: 6 },
  divider: { borderTop: '1px solid #f0f0f0', margin: '12px 0' },
  empty: { color: '#adb5bd', fontSize: 13, padding: '12px', textAlign: 'center' },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizModal({ quiz, onClose, onSave }) {
  const isEdit = !!quiz;
  const [name, setName] = useState(quiz?.name || 'Quiz');
  const [wordMode, setWordMode] = useState('manual');
  const [allVocab, setAllVocab] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Create mode state
  const [selected, setSelected] = useState(new Set()); // vocab word ids

  // Edit mode state
  const [quizWords, setQuizWords] = useState([]); // current words in quiz
  const [removedIds, setRemovedIds] = useState(new Set()); // quiz_word ids to remove
  const [addSelected, setAddSelected] = useState(new Set()); // vocab ids to add

  useEffect(() => {
    fetch('/api/vocabulary/all').then(r => r.json()).then(setAllVocab);
    if (isEdit) {
      fetch(`/api/quizzes/${quiz.id}`).then(r => r.json()).then(q => setQuizWords(q.words || []));
    }
  }, []);

  const quizWordSet = new Set(quizWords.filter(w => !removedIds.has(w.id)).map(w => w.spanish_word));

  const vocabWithTranslation = allVocab.filter(w => w.english_translation);

  const generateRandom = () => {
    const pool = vocabWithTranslation.filter(v => !quizWordSet.has(v.spanish_word));
    const picked = shuffle(pool).slice(0, 10);
    if (isEdit) {
      setAddSelected(new Set(picked.map(w => w.id)));
    } else {
      setSelected(new Set(picked.map(w => w.id)));
    }
  };

  const filteredVocab = vocabWithTranslation.filter(v => {
    const q = search.toLowerCase();
    return !q || v.spanish_word.toLowerCase().includes(q) || v.english_translation.toLowerCase().includes(q);
  });

  const toggleWord = (id) => {
    const set = isEdit ? addSelected : selected;
    const setter = isEdit ? setAddSelected : setSelected;
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const removeQuizWord = (id) => {
    setRemovedIds(prev => new Set([...prev, id]));
  };

  const save = async () => {
    setSaving(true);
    try {
      if (!isEdit) {
        const words = vocabWithTranslation.filter(v => selected.has(v.id));
        await fetch('/api/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, words }),
        });
      } else {
        await fetch(`/api/quizzes/${quiz.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        for (const id of removedIds) {
          await fetch(`/api/quizzes/${quiz.id}/words/${id}`, { method: 'DELETE' });
        }
        const toAdd = vocabWithTranslation.filter(v => addSelected.has(v.id));
        for (const w of toAdd) {
          await fetch(`/api/quizzes/${quiz.id}/words`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spanish_word: w.spanish_word, english_translation: w.english_translation }),
          });
        }
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  const activeSet = isEdit ? addSelected : selected;
  const visibleQuizWords = quizWords.filter(w => !removedIds.has(w.id));
  const vocabNotInQuiz = filteredVocab.filter(v => !quizWordSet.has(v.spanish_word));

  const totalSelected = isEdit
    ? visibleQuizWords.length + addSelected.size
    : selected.size;

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <h2 style={s.modalTitle}>{isEdit ? 'Edit Quiz' : 'Create Quiz'}</h2>

        <label style={s.label}>Quiz name</label>
        <input
          style={s.nameInput}
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <div style={s.modeRow}>
          <button style={s.modeBtn(wordMode === 'manual')} onClick={() => setWordMode('manual')}>
            Choose words
          </button>
          <button style={s.modeBtn(wordMode === 'random')} onClick={() => setWordMode('random')}>
            Random (up to 10)
          </button>
        </div>

        {wordMode === 'random' && (
          <button style={s.regenBtn} onClick={generateRandom}>
            {activeSet.size > 0 ? 'Regenerate' : 'Generate random words'}
          </button>
        )}

        <div style={s.wordList}>
          {/* Edit mode: show current quiz words first */}
          {isEdit && visibleQuizWords.length > 0 && (
            <>
              <div style={{ padding: '8px 12px 4px', ...s.sectionLabel }}>In this quiz</div>
              {visibleQuizWords.map(w => (
                <div key={w.id} style={s.wordRow}>
                  <span style={s.wordEs}>{w.spanish_word}</span>
                  {w.english_translation && <span style={s.wordEn}>→ {w.english_translation}</span>}
                  <button style={s.removeBtn} onClick={() => removeQuizWord(w.id)}>✕</button>
                </div>
              ))}
              {(wordMode === 'manual' || addSelected.size > 0) && <div style={s.divider} />}
            </>
          )}

          {/* Word picker */}
          {(wordMode === 'manual' || (wordMode === 'random' && activeSet.size > 0)) && (
            <>
              {isEdit && <div style={{ padding: '8px 12px 4px', ...s.sectionLabel }}>Add words</div>}
              {wordMode === 'manual' && (
                <div style={{ padding: '8px 8px 0' }}>
                  <input
                    style={{ ...s.search, marginBottom: 0 }}
                    placeholder="Search vocabulary…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              )}
              {(isEdit ? vocabNotInQuiz : filteredVocab)
                .filter(v => wordMode === 'random' ? activeSet.has(v.id) : true)
                .map(v => (
                  <div
                    key={v.id}
                    style={{ ...s.wordRow, background: activeSet.has(v.id) ? '#f2e8cf' : '#fff' }}
                    onClick={() => toggleWord(v.id)}
                  >
                    <input
                      type="checkbox"
                      style={s.checkbox}
                      checked={activeSet.has(v.id)}
                      onChange={() => toggleWord(v.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span style={s.wordEs}>{v.spanish_word}</span>
                    <span style={s.wordEn}>→ {v.english_translation}</span>
                  </div>
                ))
              }
              {(isEdit ? vocabNotInQuiz : filteredVocab).length === 0 && (
                <div style={s.empty}>No vocabulary words with translations found.</div>
              )}
            </>
          )}

          {wordMode === 'random' && activeSet.size === 0 && !isEdit && (
            <div style={s.empty}>Click "Generate random words" to pick words automatically.</div>
          )}
        </div>

        <div style={s.footer}>
          <span style={s.count}>{totalSelected} word{totalSelected !== 1 ? 's' : ''} selected</span>
          <div style={s.footerBtns}>
            <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={s.saveBtn} onClick={save} disabled={saving || totalSelected === 0}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
