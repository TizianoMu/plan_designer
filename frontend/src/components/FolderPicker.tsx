import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface Props {
  mode: 'open' | 'create';
  onSelect: (path: string, name?: string) => void;
  onClose: () => void;
}

export function FolderPicker({ mode, onSelect, onClose }: Props) {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<{ name: string; path: string; is_project: boolean }[]>([]);
  const [parent, setParent] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (path: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.browse(path);
      setCurrentPath(res.path);
      setParent(res.parent);
      setEntries(res.entries);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(''); }, []);

  const handleConfirm = () => {
    if (mode === 'create') {
      if (!newName.trim()) return setError('Enter a project name');
      onSelect(currentPath, newName.trim());
    } else {
      if (!currentPath) return setError('Select a folder');
      onSelect(currentPath);
    }
  };

  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={titleBar}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            {mode === 'open' ? 'Open Project Folder' : 'Create New Project'}
          </span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ padding: 12 }}>
          {/* Current path */}
          <div style={{
            background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4,
            padding: '6px 10px', fontSize: 12, color: '#475569', marginBottom: 8,
            fontFamily: 'monospace', wordBreak: 'break-all',
          }}>
            {currentPath || 'Loading…'}
          </div>

          {/* Entries */}
          <div style={{
            border: '1px solid #e2e8f0', borderRadius: 4, height: 260,
            overflowY: 'auto', background: '#fff',
          }}>
            {loading ? (
              <div style={{ padding: 16, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>Loading…</div>
            ) : (
              <>
                {parent && parent !== currentPath && (
                  <button
                    onClick={() => load(parent)}
                    style={entryBtn}
                  >
                    <span style={{ marginRight: 6 }}>⬆</span> ..
                  </button>
                )}
                {entries.map((e) => (
                  <button
                    key={e.path}
                    onDoubleClick={() => load(e.path)}
                    onClick={() => setCurrentPath(e.path)}
                    style={{
                      ...entryBtn,
                      background: currentPath === e.path ? '#eff6ff' : 'none',
                      color: currentPath === e.path ? '#2563eb' : '#1e293b',
                    }}
                  >
                    <span style={{ marginRight: 6 }}>
                      {e.is_project ? '📂' : '📁'}
                    </span>
                    {e.name}
                    {e.is_project && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#16a34a', fontWeight: 600 }}>
                        PROJECT
                      </span>
                    )}
                  </button>
                ))}
                {entries.length === 0 && !loading && (
                  <div style={{ padding: 16, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
                    Empty folder
                  </div>
                )}
              </>
            )}
          </div>

          {/* Create mode: project name input */}
          {mode === 'create' && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>
                Project name
              </label>
              <input
                style={{
                  width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1',
                  borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="MyProject"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                Will be created in: <strong>{currentPath || '…'}/{newName || '…'}</strong>
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{error}</div>
          )}
        </div>

        <div style={footer}>
          <button onClick={handleConfirm} style={btnPrimary} disabled={loading}>
            {mode === 'open' ? 'Open' : 'Create'}
          </button>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900,
};
const dialog: React.CSSProperties = {
  background: '#fff', borderRadius: 8, width: 520,
  display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
};
const titleBar: React.CSSProperties = {
  padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#f8fafc', borderRadius: '8px 8px 0 0',
};
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b',
};
const footer: React.CSSProperties = {
  padding: '10px 16px', borderTop: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'flex-end', gap: 8,
};
const entryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', width: '100%',
  padding: '7px 10px', background: 'none', border: 'none',
  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
  textAlign: 'left', borderBottom: '1px solid #f8fafc',
};
const btnPrimary: React.CSSProperties = {
  padding: '6px 20px', background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: '6px 16px', background: '#f1f5f9', color: '#374151', border: '1px solid #cbd5e1',
  borderRadius: 4, cursor: 'pointer', fontSize: 13,
};
