import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { StickyNote } from '../../../types';
import { useStore } from '../../../store';

interface StickyNodeData {
  note: StickyNote;
}

export const StickyNode = memo(({ data, selected }: NodeProps) => {
  const note = (data as unknown as StickyNodeData).note;
  const { setPendingRelation, pendingRelation } = useStore();

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('editNote', { detail: { noteId: note.id } }));
    },
    [note.id]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('noteContextMenu', { detail: { noteId: note.id, x: e.clientX, y: e.clientY } }));
    },
    [note.id]
  );

  return (
    <div
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      style={{
        background: note.bgColor || '#fef08a',
        border: `2px solid ${selected ? '#f59e0b' : 'rgba(0,0,0,0.15)'}`,
        borderRadius: 4,
        minWidth: 160,
        maxWidth: 280,
        padding: '8px 10px',
        boxShadow: selected
          ? '0 0 0 3px rgba(245,158,11,0.3), 2px 4px 12px rgba(0,0,0,0.15)'
          : '2px 4px 12px rgba(0,0,0,0.12)',
        cursor: 'default',
        fontFamily: 'sans-serif',
        fontSize: 13,
        color: note.textColor || '#1e293b',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: '1.5',
        userSelect: 'none',
        // Fold effect top-right corner
        position: 'relative',
      }}
    >
      {/* Folded corner decoration */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderWidth: '0 14px 14px 0',
        borderColor: `transparent rgba(0,0,0,0.12) transparent transparent`,
      }} />

      {note.text || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>Empty note</span>}

      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 6, height: 6 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 6, height: 6 }} />
    </div>
  );
});
