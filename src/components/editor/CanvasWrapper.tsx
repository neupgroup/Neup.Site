
'use client';

import React, { type FC } from 'react';
import { cn } from '@/lib/utils';

interface CanvasWrapperProps {
  id: string;
  className?: string;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnter: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  isContainer?: boolean;
  dangerouslySetInnerHTML?: { __html: string };
  customCss?: string;
}

const CanvasWrapper: FC<CanvasWrapperProps> = ({ 
    id, 
    className, 
    selectedElement, 
    onSelectElement, 
    children, 
    style, 
    onDragStart, 
    onDragEnter, 
    onDragLeave, 
    isContainer, 
    dangerouslySetInnerHTML, 
    customCss 
}) => {
  const isSelected = selectedElement === id;
  const customCssId = `custom-css-${id}`;

  const finalProps: any = {
    id,
    'data-custom-css-id': customCssId,
    style,
    draggable: true,
    onDragStart: (e: React.DragEvent) => onDragStart(e, id),
    onDragEnter: (e: React.DragEvent) => onDragEnter(e, id),
    onDragLeave,
    className: cn(
      'relative cursor-pointer transition-all group',
      isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:ring-1 hover:ring-primary/50',
      {'min-h-[20px]': isContainer},
      className
    ),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectElement(id);
    },
  };

  if (dangerouslySetInnerHTML) {
    finalProps.dangerouslySetInnerHTML = dangerouslySetInnerHTML;
  }

  return (
    <div {...finalProps}>
      {customCss && (
        <style>
          {`[data-custom-css-id="${customCssId}"] { ${customCss} }`}
        </style>
      )}
      {!dangerouslySetInnerHTML && children}
    </div>
  );
};

export default CanvasWrapper;
