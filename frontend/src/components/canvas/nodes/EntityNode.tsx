import { memo, useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { Entity } from '../../../types';
import { useStore } from '../../../store';
import { validateEntity } from '../../../utils/validation';

interface EntityNodeData { entity: Entity }

const TYPE_STYLE: Record<string, { accent: string; label: string }> = {
  master:   { accent: '#16a34a', label: 'Master'   },
  detail:   { accent: '#2563eb', label: 'Detail'   },
  external: { accent: '#d97706', label: 'External' },
  virtual:  { accent: '#7c3aed', label: 'Virtual'  },
};

export const EntityNode = memo(({ data, selected }: NodeProps) => {
  const entity = (data as unknown as EntityNodeData).entity;
  const style = TYPE_STYLE[entity.type] ?? TYPE_STYLE.master;
  const { setContextMenu, setSelectedEntityId, pendingRelation, toggleSelectedEntity, plan } = useStore();

  const { blocking, warnings } = useMemo(
    () => validateEntity(entity, plan?.entities ?? []),
    [entity, plan?.entities],
  );
  const isInvalid = blocking.length > 0;
  const tooltip = useMemo(
    () => [...blocking, ...warnings].map((m) => `• ${m}`).join('\n'),
    [blocking, warnings],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entityId: entity.id, entityName: entity.name });
  }, [entity.id, entity.name, setContextMenu]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingRelation && pendingRelation.sourceId !== entity.id) {
      window.dispatchEvent(new CustomEvent('completeRelation', { detail: { targetId: entity.id } }));
      return;
    }
    if (e.ctrlKey || e.metaKey) toggleSelectedEntity(entity.id);
    else setSelectedEntityId(entity.id);
  }, [entity.id, pendingRelation, setSelectedEntityId, toggleSelectedEntity]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingRelation) return;
    window.dispatchEvent(new CustomEvent('editEntity', { detail: { entityId: entity.id } }));
  }, [entity.id, pendingRelation]);

  const isPendingTarget = pendingRelation && pendingRelation.sourceId !== entity.id;
  const borderColor = isInvalid ? '#dc2626' : selected || isPendingTarget ? '#f59e0b' : style.accent;
  const fields = entity.fields ?? [];

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        background: '#fff',
        border: `1px solid ${borderColor}`,
        borderTop: `3px solid ${borderColor}`,
        borderRadius: 8,
        minWidth: 170,
        cursor: isPendingTarget ? 'crosshair' : 'default',
        boxShadow: selected
          ? `0 0 0 3px ${borderColor}30`
          : '0 1px 4px rgba(0,0,0,0.08)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #f3f4f6' }}>
        <span style={{
          fontSize: 9, fontWeight: 700, color: style.accent,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {style.label}
        </span>
        {entity.program && (
          <span style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'monospace', marginLeft: 'auto' }}>
            {entity.program}
          </span>
        )}
        {isInvalid && (
          <span title={tooltip} style={{
            fontSize: 9, fontWeight: 700, color: '#dc2626',
            background: '#fef2f2', padding: '1px 4px', borderRadius: 3, cursor: 'help',
          }}>
            ERR
          </span>
        )}
      </div>

      {/* Entity name */}
      <div style={{ padding: '6px 10px 4px', fontWeight: 600, fontSize: 13, color: '#111827' }}>
        {entity.name || <span style={{ color: '#d1d5db', fontStyle: 'italic', fontWeight: 400 }}>Senza nome</span>}
      </div>

      {/* Fields */}
      <div style={{ padding: '2px 10px 8px' }}>
        {fields.slice(0, 4).map((f) => (
          <div key={f.id} style={{ display: 'flex', gap: 8, fontSize: 11, color: '#6b7280', lineHeight: '17px', alignItems: 'center' }}>
            <span style={{ color: style.accent, fontWeight: 700, fontFamily: 'monospace', minWidth: 12, fontSize: 10 }}>
              {f.type}
            </span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.name}
            </span>
            {f.key === 1 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '0 3px', borderRadius: 3 }}>
                PK
              </span>
            )}
          </div>
        ))}
        {fields.length > 4 && (
          <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 2 }}>+{fields.length - 4} altri</div>
        )}
        {fields.length === 0 && (
          <div style={{ fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>Nessun campo</div>
        )}
      </div>

      <Handle type="source" position={Position.Right}
        style={{ background: style.accent, width: 8, height: 8, border: '2px solid #fff' }} />
      <Handle type="target" position={Position.Left}
        style={{ background: style.accent, width: 8, height: 8, border: '2px solid #fff' }} />
    </div>
  );
});
