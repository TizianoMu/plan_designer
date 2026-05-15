import { useStore } from '../../store';
import { Canvas } from '../canvas/Canvas';
import { TabBar } from './TabBar';
import { PrototypeCanvas } from './PrototypeCanvas';

export function MainArea() {
  const { tabs, activeTabId, plan } = useStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {plan && <TabBar />}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Canvas always mounted but hidden when not active (preserves undo/redo state) */}
        <div style={{
          position: 'absolute', inset: 0,
          display: activeTab?.type === 'plan' ? 'flex' : 'none',
          flexDirection: 'column',
        }}>
          <Canvas />
        </div>

        {/* Prototype canvas rendered for form tabs */}
        {activeTab?.type === 'form' && activeTab.entityId && (
          <PrototypeCanvas key={activeTab.entityId} entityId={activeTab.entityId} />
        )}
      </div>
    </div>
  );
}
