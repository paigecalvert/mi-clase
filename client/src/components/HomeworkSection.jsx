import React, { useState, useEffect, useRef } from 'react';

const s = {
  section: { marginTop: 24 },
  title: { fontWeight: 700, fontSize: 15, marginBottom: 12, color: '#386641' },

  // Add form
  form: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  input: {
    border: '1px solid #dee2e6', borderRadius: 8, padding: '8px 12px',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  row: { display: 'flex', gap: 8, alignItems: 'center' },
  fileInput: { flex: 1, fontSize: 13 },
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
  downloadBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 5,
    color: '#386641', cursor: 'pointer', padding: '2px 8px', fontSize: 12,
    textDecoration: 'none', display: 'inline-block',
  },
  fileDelBtn: {
    background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer',
    fontSize: 14, padding: 0, lineHeight: 1,
  },

  // Add more files row
  addFilesRow: { marginTop: 8 },
  addFilesBtn: {
    background: 'none', border: '1px dashed #ced4da', borderRadius: 6,
    color: '#6c757d', cursor: 'pointer', padding: '4px 10px', fontSize: 12,
  },

  empty: { color: '#6c757d', fontSize: 13 },

  // Edit modal
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
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingTo, setUploadingTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const addFormFileRef = useRef(null);
  const addFileRefs = useRef({});

  const fetchHomework = () =>
    fetch(`/api/classes/${classId}/homework`)
      .then(r => r.json())
      .then(setHomework);

  useEffect(() => { fetchHomework(); }, [classId]);

  const addHomework = async () => {
    const files = addFormFileRef.current?.files;
    if (!hwTitle.trim() && !hwDesc.trim() && !files?.length) return;
    setUploading(true);
    onSaving();
    const form = new FormData();
    form.append('title', hwTitle);
    form.append('description', hwDesc);
    if (files) for (const f of files) form.append('file', f);

    await fetch(`/api/classes/${classId}/homework`, { method: 'POST', body: form });
    setHwTitle('');
    setHwDesc('');
    if (addFormFileRef.current) addFormFileRef.current.value = '';
    setUploading(false);
    fetchHomework();
    onSaved();
  };

  const handleAddFiles = async (hwId, fileList) => {
    if (!fileList?.length) return;
    setUploadingTo(hwId);
    onSaving();
    const form = new FormData();
    for (const f of fileList) form.append('file', f);
    await fetch(`/api/classes/${classId}/homework/${hwId}/files`, { method: 'POST', body: form });
    if (addFileRefs.current[hwId]) addFileRefs.current[hwId].value = '';
    setUploadingTo(null);
    fetchHomework();
    onSaved();
  };

  const deleteHw = async (id) => {
    onSaving();
    await fetch(`/api/classes/${classId}/homework/${id}`, { method: 'DELETE' });
    fetchHomework();
    onSaved();
  };

  const deleteFile = async (hwId, fileId) => {
    onSaving();
    await fetch(`/api/classes/${classId}/homework/${hwId}/files/${fileId}`, { method: 'DELETE' });
    fetchHomework();
    onSaved();
  };

  const openEdit = (hw) => {
    setEditing(hw);
    setEditTitle(hw.title || '');
    setEditDesc(hw.description || '');
  };

  const saveEdit = async () => {
    onSaving();
    await fetch(`/api/classes/${classId}/homework/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, description: editDesc }),
    });
    setEditing(null);
    fetchHomework();
    onSaved();
  };

  return (
    <div style={s.section}>
      <div style={s.title}>📋 Homework</div>

      {/* Add form */}
      <div style={s.form}>
        <input
          style={s.input}
          placeholder="Title (optional)"
          value={hwTitle}
          onChange={e => setHwTitle(e.target.value)}
        />
        <input
          style={s.input}
          placeholder="Description (optional)"
          value={hwDesc}
          onChange={e => setHwDesc(e.target.value)}
        />
        <div style={s.row}>
          <input
            style={s.fileInput}
            type="file"
            multiple
            ref={addFormFileRef}
            key={uploading ? 'uploading' : 'idle'}
          />
          <button style={s.addBtn} onClick={addHomework} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Add'}
          </button>
        </div>
      </div>

      {/* Homework list */}
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
                        <a
                          href={`/api/classes/${classId}/homework/${hw.id}/files/${f.id}/download`}
                          style={s.downloadBtn}
                        >
                          Download
                        </a>
                        <button style={s.fileDelBtn} onClick={() => deleteFile(hw.id, f.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={s.addFilesRow}>
                <input
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  ref={el => { addFileRefs.current[hw.id] = el; }}
                  onChange={e => handleAddFiles(hw.id, e.target.files)}
                />
                <button
                  style={s.addFilesBtn}
                  onClick={() => addFileRefs.current[hw.id]?.click()}
                  disabled={uploadingTo === hw.id}
                >
                  {uploadingTo === hw.id ? 'Uploading…' : '+ Add files'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setEditing(null)}>
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
              style={{ ...s.modalInput, marginBottom: 0 }}
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
            />
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
              <button style={s.saveBtn} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
