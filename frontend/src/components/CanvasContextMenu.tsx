import { useEffect, useRef } from 'react';
import type { RelationType } from '../types';
import { useStore } from '../store';

interface Props {
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onStartRelation: (type: RelationType) => void;
}

export function CanvasContextMenu({ onEdit, onDelete, onCopy, onCut, onPaste, onStartRelation }: Props) {
  const { contextMenu, setContextMenu } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setContextMenu]);

  if (!contextMenu) return null;

  const items: { label: string; action: () => void; danger?: boolean; divider?: boolean }[] = [
    { label: `✏️ Edit "${contextMenu.entityName}"`, action: onEdit },
    { label: '──────────────', action: () => {}, divider: true },
    { label: '🔗 Add relation 1:1', action: () => onStartRelation('1:1') },
    { label: '🔗 Add relation 1:n', action: () => onStartRelation('1:n') },
    { label: '──────────────', action: () => {}, divider: true },
    { label: '📋 Copy', action: () => onCopy() },
    { label: '✂️ Cut', action: () => onCut() },
    { label: '🧽 Paste', action: () => onPaste() },
    { label: '──────────────', action: () => {}, divider: true },
    { label: '🗑️ Delete entity', action: onDelete, danger: true },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        zIndex: 2000,
        minWidth: 200,
        overflow: 'hidden',
        fontSize: 13,
      }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
        ) : (
          <button
            key={i}
            onClick={() => {
              item.action();
              setContextMenu(null);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: item.danger ? '#ef4444' : '#1e293b',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = item.danger ? '#fef2f2' : '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'none';
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
