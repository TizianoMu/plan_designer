import { useEffect, useRef } from 'react';
import type { RelationType } from '../../types';
import { useStore } from '../../store';

interface Props {
  onEdit: () => void;
  onDelete: () => void;
  onStartRelation: (type: RelationType) => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  canPaste: boolean;
  selectedCount: number;
  onToggleSelection: (id: string) => void;
}

type MenuItem =
  | { kind: 'item'; label: string; action: () => void; danger?: boolean; disabled?: boolean; secondary?: boolean }
  | { kind: 'divider' };

export function CanvasContextMenu({ onEdit, onDelete, onStartRelation, onCopy, onCut, onPaste, canPaste, selectedCount, onToggleSelection }: Props) {
  const { contextMenu, setContextMenu } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setContextMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setContextMenu]);

  if (!contextMenu) return null;

  const sel = selectedCount > 0 ? ` (${selectedCount})` : '';
  const isSelected = selectedCount > 0;

  const items: MenuItem[] = [
    { kind: 'item', label: `Modifica "${contextMenu.entityName}"`, action: onEdit },
    { kind: 'item', label: isSelected ? 'Deseleziona' : 'Seleziona', action: () => onToggleSelection(contextMenu!.entityId), secondary: true },
    { kind: 'divider' },
    { kind: 'item', label: 'Relazione 1:1', action: () => onStartRelation('1:1') },
    { kind: 'item', label: 'Relazione 1:n', action: () => onStartRelation('1:n') },
    { kind: 'divider' },
    { kind: 'item', label: `Copia${sel}`, action: onCopy },
    { kind: 'item', label: `Taglia${sel}`, action: onCut },
    { kind: 'item', label: 'Incolla', action: onPaste, disabled: !canPaste },
    { kind: 'divider' },
    { kind: 'item', label: 'Elimina entità', action: onDelete, danger: true },
  ];

  return (
    <div ref={ref} style={{
      position: 'fixed', left: contextMenu.x, top: contextMenu.y,
      background: '#fff', border: '1px solid #e3e6df', borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 2000, minWidth: 200, overflow: 'hidden', fontSize: 13,
    }}>
      {items.map((item, i) =>
        item.kind === 'divider' ? (
          <div key={i} style={{ height: 1, background: '#f3f4f6', margin: '3px 0' }} />
        ) : (
          <button
            key={i}
            onClick={() => { item.action(); setContextMenu(null); }}
            disabled={item.disabled}
            style={{
              display: 'block', width: '100%', padding: '7px 14px',
              background: 'none', border: 'none', textAlign: 'left',
              cursor: item.disabled ? 'default' : 'pointer',
              color: item.danger ? '#dc2626' : item.disabled ? '#d1d5db' : item.secondary ? '#9ca3af' : '#111827',
              fontFamily: 'inherit', fontSize: 13,
            }}
            onMouseEnter={(e) => {
              if (!item.disabled)
                (e.currentTarget as HTMLButtonElement).style.background = item.danger ? '#fef2f2' : '#f9fafb';
            }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
