'use client';
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
  position: 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
  onMouseDown: (event: React.MouseEvent) => void;
}

const ResizeHandle: FC<ResizeHandleProps> = ({ position, onMouseDown }) => {
  const baseClasses = 'absolute bg-white border-2 border-primary rounded-full';
  const sizeClasses = 'w-3 h-3';
  
  const positionClasses = {
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    'top': 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
    'left': 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
    'right': 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    'bottom': 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
  };

  return (
    <div
      className={cn(baseClasses, sizeClasses, positionClasses[position])}
      onMouseDown={onMouseDown}
    />
  );
};

export default ResizeHandle;
