import { useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../utils/api';

interface Props {
  onModuleSelect: (moduleName: string) => void;
}

export function Sidebar({ onModuleSelect }: Props) {
  const { project, activeModule, isDirty, setPendingAction } = useStore();
  const [newModuleName, setNewModuleName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectModule = (name: string) => {
    if (isDirty) {
      setPendingAction(() => () => onModuleSelect(name));
      return;
    }
    onModuleSelect(name);
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim() || !project) return;
    setLoading(true);
    setError('');
    try {
      await api.createModule(project.project_path, newModuleName.trim());
      // Reload project to get updated modules list
      const updated = await api.openProject(project.project_path);
      useStore.getState().setProject(updated);
      setNewModuleName('');
      setShowCreate(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <div style={{
      width: 220, minWidth: 220, background: '#1e293b', display: 'flex',
      flexDirection: 'column', borderRight: '1px solid #334155',
    }}>
      {/* Project header */}
      <div style={{
        padding: '14px 12px 10px', borderBottom: '1px solid #334155',
      }}>
        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          Project
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', wordBreak: 'break-all' }}>
          {project.project_name}
        </div>
        <div style={{ fontSize: 10, color: '#475569', marginTop: 2, wordBreak: 'break-all' }}>
          {project.project_path}
        </div>
      </div>

      {/* Modules label + add button */}
      <div style={{
        padding: '10px 12px 6px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
          Modules
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          style={{
            background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 4,
            width: 20, height: 20, cursor: 'pointer', fontSize: 16, lineHeight: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Create new module"
        >
          +
        </button>
      </div>

      {/* Create module input */}
      {showCreate && (
        <div style={{ padding: '4px 12px 8px', display: 'flex', gap: 4, flexDirection: 'column' }}>
          <input
            style={{
              padding: '5px 8px', background: '#0f172a', border: '1px solid #475569',
              borderRadius: 4, color: '#f1f5f9', fontSize: 12, fontFamily: 'inherit',
            }}
            placeholder="Module name…"
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
            autoFocus
          />
          {error && <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={handleCreateModule}
              disabled={loading}
              style={{
                flex: 1, padding: '4px 8px', background: '#2563eb', border: 'none',
                color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 12,
              }}
            >
              {loading ? '…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewModuleName(''); setError(''); }}
              style={{
                padding: '4px 8px', background: '#334155', border: 'none',
                color: '#94a3b8', borderRadius: 4, cursor: 'pointer', fontSize: 12,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Module list */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {project.modules.length === 0 ? (
          <div style={{ padding: '10px 12px', fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
            No modules yet
          </div>
        ) : (
          project.modules.map((m) => {
            const isActive = activeModule?.name === m.name;
            return (
              <button
                key={m.name}
                onClick={() => handleSelectModule(m.name)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 12px', background: isActive ? '#2563eb' : 'none',
                  border: 'none', color: isActive ? '#fff' : '#cbd5e1',
                  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                  borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#334155';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }}
              >
                📁 {m.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
