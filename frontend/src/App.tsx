import { useState, useEffect } from 'react';
import { useStore } from './store';
import { api } from './utils/api';
import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/canvas/Canvas';
import { FolderPicker } from './components/dialogs/FolderPicker';

type PickerMode = 'open' | 'create' | null;

function UnsavedChangesModal() {
  const { pendingAction, setPendingAction } = useStore();
  if (!pendingAction) return null;
  return (
    <div style={overlay}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: '28px 28px 22px',
        width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
          Modifiche non salvate
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          Hai delle modifiche non salvate. Procedendo, andranno perse.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setPendingAction(null)} style={btnOutline}>Annulla</button>
          <button
            onClick={() => { const fn = pendingAction; setPendingAction(null); fn(); }}
            style={btnDanger}
          >
            Scarta e continua
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

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    const load = async () => {
      try {
        const lastPath = localStorage.getItem('lastProjectPath');
        const lastModule = localStorage.getItem('lastModuleName');
        if (!lastPath) return;
        const proj = await api.openProject(lastPath);
        setProject(proj);
        if (lastModule) {
          const plan = await api.getPlan(proj.project_path, lastModule);
          const mod = proj.modules.find((m) => m.name === lastModule);
          if (mod) { setActiveModule(mod); setPlan(plan); }
        }
      } catch {
        localStorage.removeItem('lastProjectPath');
        localStorage.removeItem('lastModuleName');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (project) localStorage.setItem('lastProjectPath', project.project_path);
  }, [project?.project_path]);

  useEffect(() => {
    if (activeModule) localStorage.setItem('lastModuleName', activeModule.name);
  }, [activeModule?.name]);

  const guard = (fn: () => void) => { if (isDirty) setPendingAction(() => fn); else fn(); };

  const handleOpenProject = async (path: string) => {
    setError('');
    try { const proj = await api.openProject(path); setProject(proj); setPickerMode(null); }
    catch (e: any) { setError(e.message); }
  };

  const handleCreateProject = async (path: string, name?: string) => {
    if (!name) return;
    setError('');
    try { const proj = await api.createProject(path, name); setProject(proj); setPickerMode(null); }
    catch (e: any) { setError(e.message); }
  };

  const handleSelectModule = async (moduleName: string) => {
    if (!project) return;
    try {
      const plan = await api.getPlan(project.project_path, moduleName);
      const mod = project.modules.find((m) => m.name === moduleName)!;
      setActiveModule(mod); setPlan(plan);
    } catch (e: any) { setError(e.message); }
  };

  const closeProject = () => {
    setProject(null); setActiveModule(null);
    localStorage.removeItem('lastProjectPath');
    localStorage.removeItem('lastModuleName');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: '#f2f4ef' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 20px', height: 48, background: '#fff',
        borderBottom: '1px solid #e3e6df', flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', letterSpacing: -0.3, marginRight: 20 }}>
          SitePainter
        </span>
        <button onClick={() => guard(() => setPickerMode('open'))} style={topBtn}>Open Project</button>
        <button onClick={() => guard(() => setPickerMode('create'))} style={topBtn}>New Project</button>
        {project && (
          <button onClick={() => guard(closeProject)} style={{ ...topBtn, color: '#dc2626' }}>
            Close Project
          </button>
        )}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {project ? (
          <>
            <Sidebar onModuleSelect={handleSelectModule} />
            <Canvas />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>SitePainter</div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Apri un progetto esistente o creane uno nuovo</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button onClick={() => setPickerMode('open')} style={bigBtn('#111827')}>Apri progetto</button>
              <button onClick={() => setPickerMode('create')} style={bigBtn('#16a34a')}>Nuovo progetto</button>
            </div>
            {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
          </div>
        )}
      </div>

      {pickerMode && (
        <FolderPicker
          mode={pickerMode}
          onSelect={(path, name) => {
            if (pickerMode === 'open') handleOpenProject(path);
            else handleCreateProject(path, name);
          }}
          onClose={() => setPickerMode(null)}
        />
      )}

      <UnsavedChangesModal />
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
};

const topBtn: React.CSSProperties = {
  padding: '5px 12px', background: 'none', border: 'none',
  color: '#374151', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
  borderRadius: 6,
};

const btnOutline: React.CSSProperties = {
  padding: '6px 16px', background: '#fff', border: '1px solid #e3e6df',
  color: '#374151', cursor: 'pointer', fontSize: 13, borderRadius: 6, fontFamily: 'inherit',
};

const btnDanger: React.CSSProperties = {
  padding: '6px 16px', background: '#dc2626', border: 'none',
  color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderRadius: 6, fontFamily: 'inherit',
};

const bigBtn = (bg: string): React.CSSProperties => ({
  padding: '10px 24px', background: bg, color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
});
