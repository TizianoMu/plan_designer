import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { Entity } from '../../../types';
import { useStore } from '../../../store';

interface EntityNodeData {
  entity: Entity;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; header: string }> = {
  master:   { bg: '#f0fdf4', border: '#16a34a', header: '#16a34a' },
  detail:   { bg: '#eff6ff', border: '#2563eb', header: '#2563eb' },
  external: { bg: '#fefce8', border: '#ca8a04', header: '#ca8a04' },
  virtual:  { bg: '#fdf4ff', border: '#9333ea', header: '#9333ea' },
};

export const EntityNode = memo(({ data, selected }: NodeProps) => {
  const entity = (data as unknown as EntityNodeData).entity;
  const colors = TYPE_COLORS[entity.type] ?? TYPE_COLORS.master;
  const { setContextMenu, setSelectedEntityId, pendingRelation, toggleSelectedEntity } = useStore();

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, entityId: entity.id, entityName: entity.name });
    },
    [entity.id, entity.name, setContextMenu]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (pendingRelation && pendingRelation.sourceId !== entity.id) {
        window.dispatchEvent(
          new CustomEvent('completeRelation', { detail: { targetId: entity.id } })
        );
        return;
      }
      // Ctrl+Click for multiple selection
      if (e.ctrlKey || e.metaKey) {
        toggleSelectedEntity(entity.id);
      } else {
        setSelectedEntityId(entity.id);
      }
    },
    [entity.id, pendingRelation, setSelectedEntityId, toggleSelectedEntity]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (pendingRelation) return;
      window.dispatchEvent(
        new CustomEvent('editEntity', { detail: { entityId: entity.id } })
      );
    },
    [entity.id, pendingRelation]
  );

  const isPendingTarget = pendingRelation && pendingRelation.sourceId !== entity.id;

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        background: colors.bg,
        border: `2px solid ${selected ? '#f59e0b' : isPendingTarget ? '#f59e0b' : colors.border}`,
        borderRadius: 6,
        minWidth: 160,
        cursor: isPendingTarget ? 'crosshair' : 'default',
        boxShadow: selected
          ? `0 0 0 3px rgba(245,158,11,0.3)`
          : isPendingTarget
          ? `0 0 0 3px rgba(245,158,11,0.2)`
          : '0 2px 6px rgba(0,0,0,0.1)',
        fontFamily: 'monospace',
        fontSize: 12,
        transition: 'box-shadow 0.15s, border-color 0.15s',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: colors.border,
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px 4px 0 0',
          fontWeight: 700,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ opacity: 0.8 }}>{entity.type.toUpperCase()}</span>
        <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 10 }}>{entity.program}</span>
      </div>

      {/* Name */}
      <div style={{ padding: '6px 8px', fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
        {entity.name || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>Unnamed</span>}
      </div>

      {/* Fields preview */}
      <div style={{ borderTop: `1px solid ${colors.border}30`, padding: '4px 8px 6px' }}>
        {entity.fields.slice(0, 4).map((f) => (
          <div
            key={f.id}
            style={{ display: 'flex', gap: 6, fontSize: 10, color: '#475569', lineHeight: '16px' }}
          >
            <span style={{ color: colors.border, fontWeight: 700, minWidth: 14 }}>{f.type}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.name}
            </span>
            {f.key === 1 && <span style={{ color: '#f59e0b', fontSize: 9 }}>KEY</span>}
          </div>
        ))}
        {entity.fields.length > 4 && (
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
            +{entity.fields.length - 4} more…
          </div>
        )}
        {entity.fields.length === 0 && (
          <div style={{ fontSize: 10, color: '#cbd5e1', fontStyle: 'italic' }}>No fields</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: colors.border, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Left} style={{ background: colors.border, width: 8, height: 8 }} />
    </div>
  );
});
