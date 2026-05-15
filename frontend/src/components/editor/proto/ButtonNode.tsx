import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ProtoComponent } from '../../../types';

export const ButtonNode = memo(({ data, selected }: NodeProps) => {
  const comp = data as unknown as ProtoComponent;

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${selected ? '#2563eb' : (comp.style?.borderColor ?? '#374151')}`,
      borderRadius: comp.style?.borderRadius ?? 4,
      background: comp.style?.backgroundColor ?? '#fff',
      boxShadow: selected ? '0 0 0 2px #bfdbfe' : '0 1px 2px rgba(0,0,0,0.08)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontSize: comp.style?.fontSize ?? 12,
      fontWeight: comp.style?.fontWeight ?? 'bold',
      color: comp.style?.color ?? '#111827',
      cursor: 'default',
      overflow: 'hidden',
      whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: '0 8px',
    }}>
      <NodeResizer
        minWidth={60}
        minHeight={28}
        isVisible={selected}
        lineStyle={{ border: '1px solid #2563eb' }}
        handleStyle={{ width: 8, height: 8, background: '#2563eb', border: 'none', borderRadius: 2 }}
      />
      {comp.text || 'Button'}
    </div>
  );
});

ButtonNode.displayName = 'ButtonNode';
