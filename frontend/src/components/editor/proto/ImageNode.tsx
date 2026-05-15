import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ProtoComponent } from '../../../types';

export const ImageNode = memo(({ data, selected }: NodeProps) => {
  const comp = data as unknown as ProtoComponent;

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      border: `1px ${selected ? 'solid #2563eb' : 'dashed #d1d5db'}`,
      borderRadius: 4,
      background: '#f8f9fa',
      boxShadow: selected ? '0 0 0 2px #bfdbfe' : 'none',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      gap: 4,
    }}>
      <NodeResizer
        minWidth={60}
        minHeight={40}
        isVisible={selected}
        lineStyle={{ border: '1px solid #2563eb' }}
        handleStyle={{ width: 8, height: 8, background: '#2563eb', border: 'none', borderRadius: 2 }}
      />
      <div style={{ fontSize: 20, color: '#d1d5db' }}>🖼</div>
      <div style={{ fontSize: 10, color: '#9ca3af' }}>{comp.text || 'Image'}</div>
    </div>
  );
});

ImageNode.displayName = 'ImageNode';
