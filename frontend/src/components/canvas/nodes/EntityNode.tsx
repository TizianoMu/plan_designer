import { memo, useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { Entity } from '../../../types';
import { useStore } from '../../../store';
import { validateEntity } from '../../../utils/validation';

interface EntityNodeData { entity: Entity }

const TYPE_STYLE: Record<string, { accent: string; label: string; bg: string }> = {
  master:   { accent: '#16a34a', label: 'M', bg: '#dcfce7' },
  detail:   { accent: '#2563eb', label: 'D', bg: '#dbeafe' },
  external: { accent: '#d97706', label: 'E', bg: '#fef3c7' },
  virtual:  { accent: '#7c3aed', label: 'V', bg: '#ede9fe' },
};

const CARD_W = 72;
const CARD_H = 58;
const LABEL_H = 22;

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
  const borderColor = isInvalid ? '#dc2626' : selected || isPendingTarget ? '#f59e0b' : '#374151';

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'relative',
        width: CARD_W,
        paddingTop: LABEL_H,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        userSelect: 'none',
        overflow: 'visible',
        cursor: isPendingTarget ? 'crosshair' : 'default',
      }}
    >
      {/* Name label above card */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: LABEL_H,
        display: 'flex',
        alignItems: 'flex-end',
        paddingBottom: 3,
        color: style.accent,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'visible',
        lineHeight: 1,
      }}>
        {entity.name || <span style={{ color: '#d1d5db', fontStyle: 'italic', fontWeight: 400 }}>Senza nome</span>}
        {entity.isPrototype && (
          <span title="Prototype" style={{ marginLeft: 4, fontSize: 10, lineHeight: 1 }}>⚙</span>
        )}
        {isInvalid && (
          <span title={tooltip} style={{
            marginLeft: 4, fontSize: 10, color: '#dc2626', cursor: 'help',
          }}>⚠</span>
        )}
      </div>

      {/* Card */}
      <div style={{
        width: CARD_W,
        height: CARD_H,
        background: '#fff',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 4,
        boxShadow: selected
          ? `0 0 0 3px ${style.accent}40`
          : '0 1px 5px rgba(0,0,0,0.14)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Accent header */}
        <div style={{
          background: style.accent,
          height: 20,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 6px',
        }}>
          <span style={{ fontSize: 9, color: '#fff', fontWeight: 800, letterSpacing: 0.5 }}>
            {entity.type?.toUpperCase()}
          </span>
        </div>

        {/* Icon body: rows simulating a table */}
        <div style={{ flex: 1, background: style.bg, padding: '5px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[14, 10, 10, 10].map((w, i) => (
            <div key={i} style={{
              height: 3,
              width: `${w * 5}%`,
              background: style.accent,
              opacity: i === 0 ? 0.7 : 0.25,
              borderRadius: 2,
            }} />
          ))}
        </div>
      </div>

      <Handle type="source" position={Position.Right}
        style={{
          background: style.accent, width: 7, height: 7, border: '2px solid #fff',
          top: LABEL_H + CARD_H / 2,
        }}
      />
      <Handle type="target" position={Position.Left}
        style={{
          background: style.accent, width: 7, height: 7, border: '2px solid #fff',
          top: LABEL_H + CARD_H / 2,
        }}
      />
    </div>
  );
});
