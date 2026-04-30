import { useState, useEffect } from 'react';
import { useStore } from './store';
import { api } from './utils/api';
import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/canvas/Canvas';
import { FolderPicker } from './components/dialogs/FolderPicker';

type PickerMode = 'open' | 'create' | null;

function UnsavedChangesModal() {
  const { pendingAction, setPendingAction, isDirty } = useStore();
  if (!pendingAction) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 8, padding: 24, width: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>⚠️ Unsaved changes</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          You have unsaved changes. Do you want to proceed and lose them?
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={() => {
              const fn = pendingAction;
              setPendingAction(null);
              fn();
            }}
            style={{
              padding: '6px 16px', background: '#ef4444', color: '#fff', border: 'none',
              borderRadius: 4, cursor: 'pointer', fontSize: 13,
            }}
          >
            Discard & continue
          </button>
          <button
            onClick={() => setPendingAction(null)}
            style={{
              padding: '6px 16px', background: '#f1f5f9', color: '#374151',
              border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 13,
            }}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { project, activeModule, setProject, setActiveModule, setPlan, isDirty, setPendingAction } = useStore();
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [error, setError] = useState('');

  // Warn on page refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Restore last project on mount
  useEffect(() => {
    const loadLastProject = async () => {
      try {
        const lastProjectPath = localStorage.getItem('lastProjectPath');
        const lastModuleName = localStorage.getItem('lastModuleName');
        
        if (lastProjectPath) {
          const proj = await api.openProject(lastProjectPath);
          setProject(proj);
          
          if (lastModuleName) {
            const plan = await api.getPlan(proj.project_path, lastModuleName);
            const mod = proj.modules.find((m) => m.name === lastModuleName);
            if (mod) {
              setActiveModule(mod);
              setPlan(plan);
            }
          }
        }
      } catch (e) {
        // If restore fails, clear the stored data
        localStorage.removeItem('lastProjectPath');
        localStorage.removeItem('lastModuleName');
      }
    };
    
    loadLastProject();
  }, []);

  // Save last project path
  useEffect(() => {
    if (project) {
      localStorage.setItem('lastProjectPath', project.project_path);
    }
  }, [project?.project_path]);

  // Save last module name
  useEffect(() => {
    if (activeModule) {
      localStorage.setItem('lastModuleName', activeModule.name);
    }
  }, [activeModule?.name]);

  const handleOpenProject = async (path: string) => {
    setError('');
    try {
      const proj = await api.openProject(path);
      setProject(proj);
      setPickerMode(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreateProject = async (path: string, name?: string) => {
    if (!name) return;
    setError('');
    try {
      const proj = await api.createProject(path, name);
      setProject(proj);
      setPickerMode(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSelectModule = async (moduleName: string) => {
    if (!project) return;
    try {
      const plan = await api.getPlan(project.project_path, moduleName);
      const mod = project.modules.find((m) => m.name === moduleName)!;
      setActiveModule(mod);
      setPlan(plan);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handlePickerConfirm = (path: string, name?: string) => {
    if (pickerMode === 'open') handleOpenProject(path);
    else if (pickerMode === 'create') handleCreateProject(path, name);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 16px', height: 40, background: '#0f172a',
        borderBottom: '1px solid #1e293b', flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa', letterSpacing: -0.5 }}>
          SitePainter
        </span>
        <span style={{ fontSize: 11, color: '#334155', marginRight: 12 }}>Infinity Design Painter</span>
        <button
          onClick={() => {
            if (isDirty) {
              setPendingAction(() => () => setPickerMode('open'));
            } else {
              setPickerMode('open');
            }
          }}
          style={menuBtn}
        >
          📂 Open project
        </button>
        <button
          onClick={() => {
            if (isDirty) {
              setPendingAction(() => () => setPickerMode('create'));
            } else {
              setPickerMode('create');
            }
          }}
          style={menuBtn}
        >
          ✨ New project
        </button>
        <button
          onClick={() => {
            if (isDirty) {
              setPendingAction(() => () => {
                setProject(null);
                setActiveModule(null);
                localStorage.removeItem('lastProjectPath');
                localStorage.removeItem('lastModuleName');
              });
            } else {
              setProject(null);
              setActiveModule(null);
              localStorage.removeItem('lastProjectPath');
              localStorage.removeItem('lastModuleName');
            }
          }}
          style={menuBtn}
        >
          ✕ Close project
        </button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {project ? (
          <>
            <Sidebar onModuleSelect={handleSelectModule} />
            <Canvas />
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#f8fafc', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ fontSize: 48 }}>🗂️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
              SitePainter Clone
            </div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              Open an existing project or create a new one
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setPickerMode('open')} style={bigBtn('#2563eb')}>
                📂 Open project
              </button>
              <button onClick={() => setPickerMode('create')} style={bigBtn('#16a34a')}>
                ✨ Create project
              </button>
            </div>
            {error && (
              <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</div>
            )}
          </div>
        )}
      </div>

      {/* Folder picker dialog */}
      {pickerMode && (
        <FolderPicker
          mode={pickerMode}
          onSelect={handlePickerConfirm}
          onClose={() => setPickerMode(null)}
        />
      )}

      {/* Unsaved changes modal */}
      <UnsavedChangesModal />
    </div>
  );
}

const menuBtn: React.CSSProperties = {
  padding: '4px 10px', background: '#1e293b', border: '1px solid #334155',
  color: '#94a3b8', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
};

const bigBtn = (bg: string): React.CSSProperties => ({
  padding: '10px 24px', background: bg, color: '#fff', border: 'none',
  borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600,
});
