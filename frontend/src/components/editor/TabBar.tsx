import { useStore } from '../../store';
import type { EditorTab } from '../../types';

const TYPE_ICON: Record<EditorTab['type'], string> = {
  plan: '⬡',
  form: '▤',
};

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useStore();

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', background: '#f8f9fa',
      borderBottom: '1px solid #e3e6df', height: 36, flexShrink: 0,
      paddingLeft: 4, overflowX: 'auto', overflowY: 'hidden',
    }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 10px 0 12px',
              height: 32,
              background: isActive ? '#fff' : 'transparent',
              borderTop: isActive ? '2px solid #2563eb' : '2px solid transparent',
              borderLeft: isActive ? '1px solid #e3e6df' : '1px solid transparent',
              borderRight: isActive ? '1px solid #e3e6df' : '1px solid transparent',
              borderBottom: isActive ? '1px solid #fff' : '1px solid transparent',
              marginBottom: isActive ? -1 : 0,
              cursor: 'pointer',
              userSelect: 'none',
              flexShrink: 0,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ fontSize: 11, color: isActive ? '#2563eb' : '#9ca3af' }}>
              {TYPE_ICON[tab.type]}
            </span>
            <span style={{
              fontSize: 12, fontWeight: isActive ? 600 : 400,
              color: isActive ? '#111827' : '#6b7280',
              maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </span>
            {tab.type !== 'plan' && (
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: 14, padding: '0 0 0 2px',
                  lineHeight: 1, borderRadius: 3, display: 'flex', alignItems: 'center',
                  marginLeft: 2,
                }}
                title="Chiudi tab"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
