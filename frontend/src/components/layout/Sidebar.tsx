import { useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../utils/api';
import type { Entity } from '../../types';

interface Props {
  onModuleSelect: (moduleName: string) => void;
  onGoToRoot: () => void;
}

type Tab = 'project' | 'modules';

const ENTITY_TYPE_LABEL: Record<Entity['type'], string> = {
  master:   'Master File',
  detail:   'Detail File',
  external: 'External File',
  virtual:  'Virtual File',
};
const ENTITY_TYPE_ORDER: Entity['type'][] = ['master', 'detail', 'external', 'virtual'];

const TYPE_COLOR: Record<Entity['type'], string> = {
  master:   '#16a34a',
  detail:   '#2563eb',
  external: '#d97706',
  virtual:  '#7c3aed',
};


export function Sidebar({ onModuleSelect, onGoToRoot }: Props) {
  const { project, activeModule, plan, isDirty, setPendingAction, setSelectedEntityId, openFormTab } = useStore();
  const [tab, setTab] = useState<Tab>('modules');
  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState<Partial<Record<Entity['type'], boolean>>>({});
  const [newModuleName, setNewModuleName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSection = (type: Entity['type']) =>
    setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }));

  const handleSelectModule = (name: string) => {
    if (isDirty) { setPendingAction(() => () => onModuleSelect(name)); return; }
    onModuleSelect(name);
  };

  const handleGoToRoot = () => {
    if (isDirty) { setPendingAction(() => onGoToRoot); return; }
    onGoToRoot();
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

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntityId(entity.id);
    openFormTab(entity);
  };

  if (!project) return null;

  // ── Project view: only prototype entities ─────────────────────────────────
  const allEntities = plan?.entities ?? [];
  const lowerFilter = filter.toLowerCase();
  const protoEntities = allEntities
    .filter((e) => e.isPrototype)
    .filter((e) =>
      !filter ||
      e.name.toLowerCase().includes(lowerFilter) ||
      e.program.toLowerCase().includes(lowerFilter)
    );

  const grouped = ENTITY_TYPE_ORDER.reduce<Record<Entity['type'], Entity[]>>(
    (acc, type) => {
      acc[type] = protoEntities.filter((e) => e.type === type);
      return acc;
    },
    { master: [], detail: [], external: [], virtual: [] }
  );

  return (
    <div style={{
      width: 240, minWidth: 240, background: '#fff',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #e3e6df',
    }}>
      {/* Project name header */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Progetto
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.project_name}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e3e6df', flexShrink: 0 }}>
        <TabBtn label="Project view" active={tab === 'project'} onClick={() => setTab('project')} />
        <TabBtn label="Modules" active={tab === 'modules'} onClick={() => setTab('modules')} />
      </div>

      {/* ── PROJECT VIEW ────────────────────────────────────────────────────── */}
      {tab === 'project' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Filter */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, display: 'flex', gap: 4 }}>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtra…"
              style={{
                flex: 1, padding: '4px 8px', border: '1px solid #e3e6df', borderRadius: 4,
                fontSize: 11, fontFamily: 'inherit', outline: 'none', color: '#374151',
              }}
            />
            {filter && (
              <button onClick={() => setFilter('')} style={clearBtnStyle}>×</button>
            )}
          </div>

          {/* Tree */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {/* Design root */}
            {!filter && (
              <div style={treeRootStyle}>
                <span style={{ marginRight: 5 }}>▣</span>
                <span style={{ fontWeight: 600 }}>Design</span>
                {plan && (
                  <span style={{ color: '#9ca3af', marginLeft: 6, fontWeight: 400, fontSize: 10 }}>
                    {activeModule?.name}
                  </span>
                )}
              </div>
            )}

            {/* Entity groups — clean domain-oriented list, no file paths */}
            {ENTITY_TYPE_ORDER.map((type) => {
              const group = grouped[type];
              if (group.length === 0) return null;
              const isCollapsed = !!collapsed[type];
              return (
                <div key={type}>
                  <button
                    onClick={() => toggleSection(type)}
                    style={sectionHeaderBtn(TYPE_COLOR[type])}
                  >
                    <span style={{ marginRight: 5 }}>▣</span>
                    <span style={{ flex: 1 }}>{ENTITY_TYPE_LABEL[type]}</span>
                    <span style={{ fontSize: 9, opacity: 0.7 }}>{isCollapsed ? '▶' : '▼'}</span>
                  </button>

                  {!isCollapsed && group.map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => handleEntityClick(entity)}
                      style={entityRowStyle(TYPE_COLOR[type])}
                      title={`Apri form: ${entity.name || entity.program}`}
                    >
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: TYPE_COLOR[type], marginRight: 8, flexShrink: 0,
                      }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: 12 }}>
                        {entity.name || entity.program}
                      </span>
                      <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0, marginLeft: 3 }}>
                        →
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}

            {protoEntities.length === 0 && (
              <div style={{ padding: '12px 16px', fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>
                {filter ? 'Nessun risultato' : 'Nessuna entità con flag Prototype'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODULES ─────────────────────────────────────────────────────────── */}
      {tab === 'modules' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {activeModule ? (
            /* Inside a module → show name + go to root */
            <div style={{ padding: '10px 12px', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Module
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d', marginBottom: 12,
                padding: '4px 8px', background: '#f0fdf4', borderRadius: 4,
              }}>
                {activeModule.name}
              </div>
              <button onClick={handleGoToRoot} style={goToRootStyle}>
                ← go to main project
              </button>
            </div>
          ) : (
            /* Root level → list all modules */
            <>
              <div style={{ padding: '6px 12px 4px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Module</span>
                <button
                  onClick={() => setShowCreate((v) => !v)}
                  title="Nuovo modulo"
                  style={addBtnStyle}
                >+</button>
              </div>

              {showCreate && (
                <div style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <input
                    style={{
                      padding: '5px 8px', border: '1px solid #e3e6df', borderRadius: 4,
                      fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#111827',
                    }}
                    placeholder="Nome modulo"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
                    autoFocus
                  />
                  {error && <div style={{ fontSize: 11, color: '#dc2626' }}>{error}</div>}
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={handleCreateModule} disabled={loading} style={btnCreate}>
                      {loading ? '…' : 'Crea'}
                    </button>
                    <button onClick={() => { setShowCreate(false); setNewModuleName(''); setError(''); }} style={btnCancel}>
                      Annulla
                    </button>
                  </div>
                </div>
              )}

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {project.modules.length === 0 ? (
                  <div style={{ padding: '12px 12px', fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>
                    Nessun modulo
                  </div>
                ) : project.modules.map((m) => {
                  const isActive = false; // always null here (we're in the !activeModule branch)
                  return (
                    <button
                      key={m.name}
                      onClick={() => handleSelectModule(m.name)}
                      style={moduleRowStyle(isActive)}
                    >
                      <span style={{ marginRight: 6, fontSize: 12 }}>📁</span>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '7px 4px', border: 'none', background: 'none', cursor: 'pointer',
        fontSize: 11, fontFamily: 'inherit', fontWeight: active ? 700 : 400,
        color: active ? '#111827' : '#9ca3af',
        borderBottom: active ? '2px solid #111827' : '2px solid transparent',
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const treeRootStyle: React.CSSProperties = {
  padding: '5px 12px', fontSize: 11, fontWeight: 500, color: '#374151',
  display: 'flex', alignItems: 'center',
};

const sectionHeaderBtn = (color: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', width: '100%',
  padding: '5px 10px 3px', border: 'none', cursor: 'pointer',
  fontSize: 10, fontWeight: 700, fontFamily: 'inherit',
  color, textTransform: 'uppercase', letterSpacing: 0.5,
  background: 'none', textAlign: 'left', marginTop: 4,
});

const entityRowStyle = (_color: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', width: '100%',
  padding: '3px 10px 3px 20px', border: 'none', background: 'none',
  cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', textAlign: 'left',
  color: '#374151',
});


const moduleRowStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', width: '100%',
  padding: '5px 12px', border: 'none', cursor: 'pointer',
  fontSize: 12, fontFamily: 'inherit', textAlign: 'left',
  background: active ? '#2563eb' : 'none',
  color: active ? '#fff' : '#374151',
  fontWeight: active ? 600 : 400,
});

const goToRootStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 11, color: '#dc2626', fontFamily: 'inherit',
  padding: 0, textAlign: 'left',
};

const clearBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 16, color: '#9ca3af', padding: '0 4px', lineHeight: 1,
};

const addBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #e3e6df', color: '#6b7280',
  width: 18, height: 18, borderRadius: 3, cursor: 'pointer', fontSize: 13,
  display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
  padding: 0,
};

const btnCreate: React.CSSProperties = {
  flex: 1, padding: '4px 8px', background: '#16a34a', border: 'none',
  color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 600,
};

const btnCancel: React.CSSProperties = {
  padding: '4px 8px', background: '#fff', border: '1px solid #e3e6df',
  color: '#6b7280', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
};
