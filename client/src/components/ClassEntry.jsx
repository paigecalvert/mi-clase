import React, { useState, useEffect, useCallback, useRef } from 'react';
import VocabSection from './VocabSection';
import HomeworkSection from './HomeworkSection';

const s = {
  card: {
    background: '#fff', borderRadius: 12, marginBottom: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', cursor: 'pointer', userSelect: 'none',
  },
  dateLabel: { fontWeight: 700, fontSize: 16 },
  meta: { fontSize: 13, color: '#6c757d', marginTop: 2 },
  controls: { display: 'flex', gap: 8, alignItems: 'center' },
  chevron: { fontSize: 18, color: '#6c757d', transition: 'transform 0.2s' },
  editDateBtn: {
    background: 'none', border: 'none',
    color: '#386641', cursor: 'pointer', padding: '0 0 0 6px', fontSize: 15, lineHeight: 1,
  },
  deleteBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 6,
    color: '#bc4749', cursor: 'pointer', padding: '4px 10px', fontSize: 13,
  },
  savingText: { fontSize: 12, color: '#adb5bd', whiteSpace: 'nowrap' },
  savedText: { fontSize: 12, color: '#386641', whiteSpace: 'nowrap' },
  body: { borderTop: '1px solid #f0f0f0', padding: '20px' },
  sectionTitle: { fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#386641' },
  textarea: {
    width: '100%', minHeight: 120, border: '1px solid #dee2e6', borderRadius: 8,
    padding: 12, fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
    outline: 'none', lineHeight: 1.5,
  },

  // Edit date modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 12, padding: '28px 28px 24px',
    width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalTitle: { margin: '0 0 20px', fontSize: 18, fontWeight: 700 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#495057', marginBottom: 6 },
  dateInput: {
    width: '100%', border: '1px solid #dee2e6', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  cancelBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 8,
    padding: '9px 18px', fontSize: 14, cursor: 'pointer', color: '#6c757d', fontWeight: 500,
  },
  saveBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '9px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ClassEntry({ cls, onDelete, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [editDateOpen, setEditDateOpen] = useState(false);
  const [editDate, setEditDate] = useState('');

  // Save status: 'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState('idle');
  const [dotIdx, setDotIdx] = useState(0);
  const notesTimerRef = useRef(null);
  const saveResetRef = useRef(null);

  // Animate dots while saving
  useEffect(() => {
    if (saveStatus !== 'saving') { setDotIdx(0); return; }
    const id = setInterval(() => setDotIdx(i => (i + 1) % 4), 280);
    return () => clearInterval(id);
  }, [saveStatus]);

  const markSaving = useCallback(() => {
    clearTimeout(saveResetRef.current);
    setSaveStatus('saving');
  }, []);

  const markSaved = useCallback(() => {
    setSaveStatus('saved');
    clearTimeout(saveResetRef.current);
    saveResetRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
  }, []);

  const markSavedAndRefresh = useCallback(() => {
    markSaved();
    onUpdate();
  }, [markSaved, onUpdate]);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/classes/${cls.id}`)
      .then(r => r.json())
      .then(data => setNotes(data.notes || ''));
  }, [open, cls.id]);

  const handleNotesChange = useCallback((e) => {
    const val = e.target.value;
    setNotes(val);
    markSaving();
    clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      fetch(`/api/classes/${cls.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: val }),
      }).then(() => markSaved());
    }, 800);
  }, [cls.id, markSaving, markSaved]);

  const openEditDate = (e) => {
    e.stopPropagation();
    setEditDate(cls.class_date);
    setEditDateOpen(true);
  };

  const saveDate = async () => {
    if (!editDate) return;
    await fetch(`/api/classes/${cls.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_date: editDate }),
    });
    setEditDateOpen(false);
    onUpdate();
  };

  return (
    <div style={s.card}>
      <div style={s.header} onClick={() => setOpen(o => !o)}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={s.dateLabel}>{formatDate(cls.class_date)}</span>
            <button style={s.editDateBtn} onClick={openEditDate} title="Edit date">✎</button>
          </div>
          <div style={s.meta}>
            {cls.vocab_count} vocab word{cls.vocab_count !== 1 ? 's' : ''} ·{' '}
            {cls.homework_count} homework item{cls.homework_count !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={s.controls}>
          {saveStatus === 'saving' && (
            <span style={s.savingText}>Saving{'.'.repeat(dotIdx)}</span>
          )}
          {saveStatus === 'saved' && (
            <span style={s.savedText}>✓ Saved</span>
          )}
          <button style={s.deleteBtn} onClick={e => { e.stopPropagation(); onDelete(cls.id); }}>
            Delete
          </button>
          <span style={{ ...s.chevron, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </div>
      </div>

      {open && (
        <div style={s.body}>
          <section>
            <div style={s.sectionTitle}>📝 Notes</div>
            <textarea
              style={s.textarea}
              value={notes}
              onChange={handleNotesChange}
              placeholder="Take notes from today's class…"
            />
          </section>

          <VocabSection classId={cls.id} onSaving={markSaving} onSaved={markSavedAndRefresh} />
          <HomeworkSection classId={cls.id} onSaving={markSaving} onSaved={markSavedAndRefresh} />
        </div>
      )}

      {/* Edit date modal */}
      {editDateOpen && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setEditDateOpen(false)}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Edit Class Date</h2>
            <label style={s.label} htmlFor="edit-class-date">Select the class date</label>
            <input
              id="edit-class-date"
              type="date"
              style={s.dateInput}
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              autoFocus
            />
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setEditDateOpen(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={saveDate} disabled={!editDate}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
