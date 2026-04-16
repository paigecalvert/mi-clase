import React, { useEffect, useState } from 'react';
import ClassEntry from '../components/ClassEntry';

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h1: { margin: 0, fontSize: 24, fontWeight: 700 },
  btn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 20px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },
  empty: { textAlign: 'center', color: '#6c757d', padding: '48px 0', fontSize: 16 },

  // Modal overlay
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
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
  addBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '9px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
};

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchClasses = () =>
    fetch('/api/classes')
      .then(r => r.json())
      .then(data => { setClasses(data); setLoading(false); });

  useEffect(() => { fetchClasses(); }, []);

  const openModal = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const addClass = () => {
    if (!date) return;
    fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_date: date }),
    }).then(() => { closeModal(); fetchClasses(); });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const deleteClass = (id) => {
    if (!confirm('Delete this class and all its data?')) return;
    fetch(`/api/classes/${id}`, { method: 'DELETE' }).then(fetchClasses);
  };

  if (loading) return <p style={{ color: '#6c757d' }}>Loading…</p>;

  return (
    <>
      <div style={s.header}>
        <h1 style={s.h1}>My Classes</h1>
        <button style={s.btn} onClick={openModal}>+ Add a Class</button>
      </div>

      {classes.length === 0 ? (
        <div style={s.empty}>No classes yet. Add your first class to get started!</div>
      ) : (
        classes.map(cls => (
          <ClassEntry key={cls.id} cls={cls} onDelete={deleteClass} onUpdate={fetchClasses} />
        ))
      )}

      {showModal && (
        <div style={s.overlay} onClick={handleOverlayClick}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Add a Class</h2>
            <label style={s.label} htmlFor="class-date">Select the class date</label>
            <input
              id="class-date"
              type="date"
              style={s.dateInput}
              value={date}
              onChange={e => setDate(e.target.value)}
              autoFocus
            />
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={closeModal}>Cancel</button>
              <button style={s.addBtn} onClick={addClass} disabled={!date}>Add class</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
