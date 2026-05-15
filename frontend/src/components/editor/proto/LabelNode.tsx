import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ProtoComponent } from '../../../types';

export const LabelNode = memo(({ data, selected }: NodeProps) => {
  const comp = data as unknown as ProtoComponent;

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center',
      padding: '0 8px',
      border: selected ? '1px solid #2563eb' : '1px solid transparent',
      borderRadius: 4,
      boxShadow: selected ? '0 0 0 2px #bfdbfe' : 'none',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontSize: comp.style?.fontSize ?? 13,
      fontWeight: comp.style?.fontWeight ?? 'normal',
      color: comp.style?.color ?? '#111827',
      background: comp.style?.backgroundColor ?? 'transparent',
      textAlign: comp.style?.textAlign ?? 'left',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      <NodeResizer
        minWidth={60}
        minHeight={24}
        isVisible={selected}
        lineStyle={{ border: '1px solid #2563eb' }}
        handleStyle={{ width: 8, height: 8, background: '#2563eb', border: 'none', borderRadius: 2 }}
      />
      {comp.text || 'Label'}
    </div>
  );
});

LabelNode.displayName = 'LabelNode';
