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
    if (isDirty) { setPendingAction(() => () => onModuleSelect(name)); return; }
    onModuleSelect(name);
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim() || !project) return;
    setLoading(true); setError('');
    try {
      await api.createModule(project.project_path, newModuleName.trim());
      const updated = await api.openProject(project.project_path);
      useStore.getState().setProject(updated);
      setNewModuleName(''); setShowCreate(false);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (!project) return null;

  return (
    <div style={{
      width: 220, minWidth: 220, background: '#fff',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #e3e6df',
    }}>
      {/* Project info */}
      <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid #e3e6df' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          Progetto
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
          {project.project_name}
        </div>
        <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {project.project_path}
        </div>
      </div>

      {/* Modules header */}
      <div style={{ padding: '14px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
          Moduli
        </span>
        <button
          onClick={() => setShowCreate((v) => !v)}
          title="Nuovo modulo"
          style={{
            background: 'none', border: '1px solid #e3e6df', color: '#6b7280',
            width: 20, height: 20, borderRadius: 4, cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Create module */}
      {showCreate && (
        <div style={{ padding: '4px 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            style={{
              padding: '6px 10px', background: '#f9fafb', border: '1px solid #e3e6df',
              borderRadius: 6, color: '#111827', fontSize: 12, fontFamily: 'inherit',
              outline: 'none',
            }}
            placeholder="Nome modulo"
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
            autoFocus
          />
          {error && <div style={{ fontSize: 11, color: '#dc2626' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleCreateModule} disabled={loading} style={btnCreate}>
              {loading ? '…' : 'Crea'}
            </button>
            <button onClick={() => { setShowCreate(false); setNewModuleName(''); setError(''); }} style={btnCancel}>
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Module list */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '4px 8px' }}>
        {project.modules.length === 0 ? (
          <div style={{ padding: '10px 8px', fontSize: 12, color: '#d1d5db', fontStyle: 'italic' }}>
            Nessun modulo
          </div>
        ) : project.modules.map((m) => {
          const isActive = activeModule?.name === m.name;
          return (
            <button
              key={m.name}
              onClick={() => handleSelectModule(m.name)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 10px', borderRadius: 6, marginBottom: 1,
                background: isActive ? '#f0fdf4' : 'none', border: 'none',
                color: isActive ? '#15803d' : '#374151',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
            >
              {m.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const btnCreate: React.CSSProperties = {
  flex: 1, padding: '5px 8px', background: '#16a34a', border: 'none',
  color: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
};
const btnCancel: React.CSSProperties = {
  padding: '5px 10px', background: '#fff', border: '1px solid #e3e6df',
  color: '#6b7280', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
};
