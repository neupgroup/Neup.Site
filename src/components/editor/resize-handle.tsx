
'use client';
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
  position: 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
  onMouseDown: (event: React.MouseEvent) => void;
}

const ResizeHandle: FC<ResizeHandleProps> = ({ position, onMouseDown }) => {
  const baseHandleClasses = 'absolute z-10';
  const lineClasses = 'absolute bg-primary';

  const renderHandle = () => {
    switch (position) {
      case 'top-left':
        return (
          <div className={cn(baseHandleClasses, 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize w-4 h-4')}>
            <div className={cn(lineClasses, 'w-full h-[2px] top-0 left-0')}></div>
            <div className={cn(lineClasses, 'w-[2px] h-full top-0 left-0')}></div>
          </div>
        );
      case 'top':
        return <div className={cn(baseHandleClasses, 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize w-8 h-4')}><div className={cn(lineClasses, 'w-full h-[2px] top-0')}></div></div>;
      case 'top-right':
        return (
          <div className={cn(baseHandleClasses, 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize w-4 h-4')}>
            <div className={cn(lineClasses, 'w-full h-[2px] top-0 right-0')}></div>
            <div className={cn(lineClasses, 'w-[2px] h-full top-0 right-0')}></div>
          </div>
        );
      case 'left':
        return <div className={cn(baseHandleClasses, 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize w-4 h-8')}><div className={cn(lineClasses, 'w-[2px] h-full left-0')}></div></div>;
      case 'right':
        return <div className={cn(baseHandleClasses, 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize w-4 h-8')}><div className={cn(lineClasses, 'w-[2px] h-full right-0')}></div></div>;
      case 'bottom-left':
        return (
          <div className={cn(baseHandleClasses, 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize w-4 h-4')}>
            <div className={cn(lineClasses, 'w-full h-[2px] bottom-0 left-0')}></div>
            <div className={cn(lineClasses, 'w-[2px] h-full bottom-0 left-0')}></div>
          </div>
        );
      case 'bottom':
        return <div className={cn(baseHandleClasses, 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize w-8 h-4')}><div className={cn(lineClasses, 'w-full h-[2px] bottom-0')}></div></div>;
      case 'bottom-right':
        return (
          <div className={cn(baseHandleClasses, 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize w-4 h-4')}>
            <div className={cn(lineClasses, 'w-full h-[2px] bottom-0 right-0')}></div>
            <div className={cn(lineClasses, 'w-[2px] h-full bottom-0 right-0')}></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div onMouseDown={onMouseDown}>
      {renderHandle()}
    </div>
  );
};

export default ResizeHandle;
