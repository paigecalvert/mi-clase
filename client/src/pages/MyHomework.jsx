import React, { useState, useEffect } from 'react';

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h1: { margin: 0, fontSize: 24, fontWeight: 700 },
  search: {
    border: '1px solid #dee2e6', borderRadius: 8, padding: '8px 14px',
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 240,
  },
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
    padding: '12px 16px', borderBottom: '1px solid #f8f9fa', fontSize: 14,
  },
  itemTitle: { fontWeight: 600 },
  itemDesc: { fontSize: 13, color: '#495057', marginTop: 2 },
  fileList: { marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 },
  fileRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 },
  fileName: { color: '#6c757d' },
  downloadBtn: {
    background: 'none', border: '1px solid #dee2e6', borderRadius: 5,
    color: '#2d6a4f', cursor: 'pointer', padding: '2px 8px', fontSize: 12,
    textDecoration: 'none', display: 'inline-block',
  },
  count: { fontSize: 13, color: '#adb5bd', marginLeft: 8 },
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function MyHomework() {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/homework/all')
      .then(r => r.json())
      .then(data => { setHomework(data); setLoading(false); });
  }, []);

  if (loading) return <p style={{ color: '#6c757d' }}>Loading…</p>;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? homework.filter(hw =>
        (hw.title || '').toLowerCase().includes(q) ||
        (hw.description || '').toLowerCase().includes(q) ||
        (hw.files || []).some(f => f.filename.toLowerCase().includes(q))
      )
    : homework;

  const groups = {};
  for (const hw of filtered) {
    const key = hw.class_date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(hw);
  }
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div style={s.header}>
        <h1 style={s.h1}>My Homework</h1>
        <input
          style={s.search}
          placeholder="Search homework…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          {homework.length === 0 ? 'No homework logged yet. Add homework from a class.' : 'No homework matches your search.'}
        </div>
      ) : (
        sortedDates.map(date => (
          <div key={date} style={s.group}>
            <div style={s.groupHeader}>
              {formatDate(date)}
              <span style={s.count}>({groups[date].length} item{groups[date].length !== 1 ? 's' : ''})</span>
            </div>
            <div style={s.list}>
              {groups[date].map((hw, i) => (
                <div
                  key={hw.id}
                  style={{ ...s.item, ...(i === groups[date].length - 1 ? { borderBottom: 'none' } : {}) }}
                >
                  {hw.title && <div style={s.itemTitle}>{hw.title}</div>}
                  {hw.description && <div style={s.itemDesc}>{hw.description}</div>}
                  {!hw.title && !hw.description && (
                    <div style={{ color: '#adb5bd', fontSize: 13 }}>No title or description</div>
                  )}
                  {hw.files?.length > 0 && (
                    <div style={s.fileList}>
                      {hw.files.map(f => (
                        <div key={f.id} style={s.fileRow}>
                          <span style={s.fileName}>📎 {f.filename}</span>
                          <a
                            href={`/api/classes/${hw.class_id}/homework/${hw.id}/files/${f.id}/download`}
                            style={s.downloadBtn}
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
