import React, { useState, useEffect, useRef } from 'react';

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
  quizName: { fontSize: 13, fontWeight: 600, color: '#386641', marginBottom: 4, alignSelf: 'flex-start' },
  word: {
    fontSize: 36, fontWeight: 700, color: '#386641',
    textAlign: 'center', marginBottom: 32,
  },
  answerInput: {
    width: '100%', border: '2px solid #dee2e6', borderRadius: 10,
    padding: '12px 16px', fontSize: 16, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', marginBottom: 16, textAlign: 'center',
  },
  checkBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },
  feedback: (correct) => ({
    fontSize: 15, fontWeight: 500, textAlign: 'center', marginBottom: 20,
    color: correct ? '#6a994e' : '#bc4749',
    background: correct ? '#f2f7ec' : '#fdf0f0',
    borderRadius: 8, padding: '10px 16px', width: '100%', boxSizing: 'border-box',
  }),
  nextBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },

  // Score screen
  scoreBig: {
    fontSize: 56, fontWeight: 700, color: '#386641', lineHeight: 1, marginBottom: 8,
  },
  scorePct: { fontSize: 18, color: '#6c757d', marginBottom: 24 },
  resultsList: {
    width: '100%', maxHeight: 220, overflowY: 'auto',
    border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 24,
  },
  resultRow: {
    display: 'flex', alignItems: 'baseline', gap: 10,
    padding: '8px 14px', borderBottom: '1px solid #f8f9fa', fontSize: 14,
  },
  resultIcon: (correct) => ({ color: correct ? '#386641' : '#bc4749', fontWeight: 700, flexShrink: 0 }),
  resultWord: { fontWeight: 600 },
  resultWrong: { color: '#bc4749', fontSize: 13 },
  closeBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 32px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },
  emptyMsg: { color: '#6c757d', fontSize: 15, marginBottom: 24, textAlign: 'center' },
};

export default function QuizRunner({ quiz, onClose, onComplete }) {
  const words = quiz.words.filter(w => w.english_translation?.trim());
  const [phase, setPhase] = useState(words.length === 0 ? 'empty' : 'question');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (phase === 'question') inputRef.current?.focus();
  }, [phase, index]);

  const current = words[index];

  const check = () => {
    if (!answer.trim()) return;
    const correct =
      answer.trim().toLowerCase() === current.english_translation.trim().toLowerCase();
    setIsCorrect(correct);
    setResults(r => [...r, { word: current, answer: answer.trim(), correct }]);
    setPhase('feedback');
  };

  const next = () => {
    if (index < words.length - 1) {
      setIndex(i => i + 1);
      setAnswer('');
      setPhase('question');
    } else {
      setPhase('complete');
    }
  };

  const handleClose = () => {
    if (phase === 'complete') {
      const correct = results.filter(r => r.correct).length;
      onComplete(correct, words.length);
    }
    onClose();
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div style={s.card}>

        {/* Empty — no words with translations */}
        {phase === 'empty' && (
          <>
            <p style={s.emptyMsg}>This quiz has no words with English translations yet.</p>
            <button style={s.closeBtn} onClick={onClose}>Close</button>
          </>
        )}

        {/* Question */}
        {phase === 'question' && (
          <>
            <div style={s.quizName}>{quiz.name}</div>
            <div style={s.progress}>{index + 1} / {words.length}</div>
            <div style={s.word}>{current.spanish_word}</div>
            <input
              ref={inputRef}
              style={s.answerInput}
              placeholder="English translation…"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && answer.trim() && check()}
            />
            <button style={s.checkBtn} onClick={check} disabled={!answer.trim()}>
              Check answer
            </button>
          </>
        )}

        {/* Feedback */}
        {phase === 'feedback' && (
          <>
            <div style={s.quizName}>{quiz.name}</div>
            <div style={s.progress}>{index + 1} / {words.length}</div>
            <div style={s.word}>{current.spanish_word}</div>
            <div style={s.feedback(isCorrect)}>
              {isCorrect
                ? `✓ Correct! → ${current.english_translation}`
                : `✗ Incorrect. The answer is: ${current.english_translation}`}
            </div>
            <button style={s.nextBtn} onClick={next}>
              {index < words.length - 1 ? 'Next →' : 'See results'}
            </button>
          </>
        )}

        {/* Complete */}
        {phase === 'complete' && (() => {
          const correct = results.filter(r => r.correct).length;
          const pct = Math.round((correct / words.length) * 100);
          return (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Quiz Complete!</div>
              <div style={s.scoreBig}>{correct}/{words.length}</div>
              <div style={s.scorePct}>{pct}% correct</div>
              <div style={s.resultsList}>
                {results.map((r, i) => (
                  <div key={i} style={{ ...s.resultRow, ...(i === results.length - 1 ? { borderBottom: 'none' } : {}) }}>
                    <span style={s.resultIcon(r.correct)}>{r.correct ? '✓' : '✗'}</span>
                    <span style={s.resultWord}>{r.word.spanish_word}</span>
                    {!r.correct && (
                      <span style={s.resultWrong}>you said: {r.answer}</span>
                    )}
                  </div>
                ))}
              </div>
              <button style={s.closeBtn} onClick={handleClose}>Close</button>
            </>
          );
        })()}

      </div>
    </div>
  );
}
