import React, { useState, useEffect, useRef } from 'react';
import {
  addHomeworkFiles,
  createHomework,
  createHomeworkFileDownloadUrl,
  deleteHomework,
  deleteHomeworkFile,
  listHomework,
  updateHomework,
} from '../api';

const s = {
  section: { marginTop: 24 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontWeight: 700, fontSize: 15, color: '#386641' },

  addBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
  },

  // Homework list
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: {
    background: '#f8f9fa', borderRadius: 8, padding: '12px 14px', fontSize: 14,
  },
  itemHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  itemMeta: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  itemTitle: { fontWeight: 600, fontSize: 14 },
  itemDesc: { fontSize: 13, color: '#495057', marginTop: 1 },
  itemActions: { display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 },
  iconBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 6,
    color: '#6c757d', cursor: 'pointer', padding: '3px 8px', fontSize: 13, lineHeight: 1.4,
  },
  delBtn: {
    background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer',
    fontSize: 16, padding: '0 0 0 4px', lineHeight: 1,
  },

  // Files within an item
  fileList: { marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 },
  fileRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#fff', borderRadius: 6, padding: '5px 10px', fontSize: 13,
  },
  fileName: { color: '#495057' },
  fileActions: { display: 'flex', gap: 6, alignItems: 'center' },
  fileInput: { width: '100%', fontSize: 13, marginBottom: 14 },
  downloadBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 5,
    color: '#386641', cursor: 'pointer', padding: '2px 8px', fontSize: 12,
    textDecoration: 'none', display: 'inline-block',
  },
  fileDelBtn: {
    background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer',
    fontSize: 14, padding: 0, lineHeight: 1,
  },

  empty: { color: '#6c757d', fontSize: 13 },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 12, padding: '28px 28px 24px',
    width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalTitle: { margin: '0 0 20px', fontSize: 18, fontWeight: 700 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#495057', marginBottom: 6 },
  modalInput: {
    width: '100%', border: '1px solid #dee2e6', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', marginBottom: 14,
  },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 8,
    padding: '9px 18px', fontSize: 14, cursor: 'pointer', color: '#6c757d', fontWeight: 500,
  },
  saveBtn: {
    background: '#386641', color: '#fff', border: 'none', borderRadius: 8,
    padding: '9px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
};

export default function HomeworkSection({ classId, onSaving = () => {}, onSaved = () => {} }) {
  const [homework, setHomework] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const createFileRef = useRef(null);

  const fetchHomework = () =>
    listHomework(classId).then(setHomework);

  useEffect(() => { fetchHomework(); }, [classId]);

  const openCreate = () => {
    setNewTitle('');
    setNewDesc('');
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (creating) return;
    setCreateOpen(false);
    setNewTitle('');
    setNewDesc('');
    if (createFileRef.current) createFileRef.current.value = '';
  };

  const addHomework = async () => {
    const files = createFileRef.current?.files;
    if (!newTitle.trim() && !newDesc.trim() && !files?.length) return;
    setCreating(true);
    onSaving();

    const homework = await createHomework(classId, newTitle, newDesc);
    await addHomeworkFiles(classId, homework.id, files);
    setCreateOpen(false);
    setNewTitle('');
    setNewDesc('');
    if (createFileRef.current) createFileRef.current.value = '';
    setCreating(false);
    fetchHomework();
    onSaved();
  };

  const deleteHw = async (id) => {
    onSaving();
    await deleteHomework(id);
    fetchHomework();
    onSaved();
  };

  const deleteFile = async (hwId, fileId) => {
    onSaving();
    await deleteHomeworkFile(fileId);
    setEditing(current => {
      if (!current || current.id !== hwId) return current;
      return { ...current, files: current.files.filter(file => file.id !== fileId) };
    });
    fetchHomework();
    onSaved();
  };

  const downloadFile = async (file) => {
    const url = await createHomeworkFileDownloadUrl(file.object_key);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openEdit = (hw) => {
    setEditing(hw);
    setEditTitle(hw.title || '');
    setEditDesc(hw.description || '');
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    onSaving();
    await updateHomework(editing.id, editTitle, editDesc);
    setEditing(null);
    setSavingEdit(false);
    fetchHomework();
    onSaved();
  };

  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <div style={s.title}>📋 Homework</div>
        <button style={s.addBtn} onClick={openCreate}>+ Add homework</button>
      </div>

      {homework.length === 0 ? (
        <div style={s.empty}>No homework logged yet.</div>
      ) : (
        <div style={s.list}>
          {homework.map(hw => (
            <div key={hw.id} style={s.item}>
              <div style={s.itemHeader}>
                <div style={s.itemMeta}>
                  {hw.title && <span style={s.itemTitle}>{hw.title}</span>}
                  {hw.description && <span style={s.itemDesc}>{hw.description}</span>}
                  {!hw.title && !hw.description && (
                    <span style={{ color: '#adb5bd', fontSize: 13 }}>No title or description</span>
                  )}
                </div>
                <div style={s.itemActions}>
                  <button style={s.iconBtn} onClick={() => openEdit(hw)} title="Edit">✎</button>
                  <button style={s.delBtn} onClick={() => deleteHw(hw.id)} title="Delete">✕</button>
                </div>
              </div>

              {hw.files.length > 0 && (
                <div style={s.fileList}>
                  {hw.files.map(f => (
                    <div key={f.id} style={s.fileRow}>
                      <span style={s.fileName}>📎 {f.filename}</span>
                      <div style={s.fileActions}>
                        <button style={s.downloadBtn} onClick={() => downloadFile(f)}>Download</button>
                        <button style={s.fileDelBtn} onClick={() => deleteFile(hw.id, f.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && closeCreate()}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Add Homework</h2>
            <label style={s.label} htmlFor="new-hw-title">Title</label>
            <input
              id="new-hw-title"
              style={s.modalInput}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              autoFocus
            />
            <label style={s.label} htmlFor="new-hw-desc">Description</label>
            <input
              id="new-hw-desc"
              style={s.modalInput}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <label style={s.label} htmlFor="new-hw-files">Files</label>
            <input
              id="new-hw-files"
              style={s.fileInput}
              type="file"
              ref={createFileRef}
            />
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={closeCreate} disabled={creating}>Cancel</button>
              <button style={s.saveBtn} onClick={addHomework} disabled={creating}>
                {creating ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && !savingEdit && setEditing(null)}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Edit Homework</h2>
            <label style={s.label} htmlFor="edit-hw-title">Title</label>
            <input
              id="edit-hw-title"
              style={s.modalInput}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              autoFocus
            />
            <label style={s.label} htmlFor="edit-hw-desc">Description</label>
            <input
              id="edit-hw-desc"
              style={s.modalInput}
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
            />
            {editing.files?.length > 0 && (
              <>
                <label style={s.label}>Files</label>
                <div style={{ ...s.fileList, marginBottom: 14 }}>
                  {editing.files.map(file => (
                    <div key={file.id} style={s.fileRow}>
                      <span style={s.fileName}>📎 {file.filename}</span>
                      <div style={s.fileActions}>
                        <button style={s.downloadBtn} onClick={() => downloadFile(file)}>Download</button>
                        <button style={s.fileDelBtn} onClick={() => deleteFile(editing.id, file.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setEditing(null)} disabled={savingEdit}>Cancel</button>
              <button style={s.saveBtn} onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
