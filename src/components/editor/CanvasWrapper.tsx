
'use client';

import React, { type FC, DragEvent } from 'react';
import { cn } from '@/lib/utils';

interface CanvasWrapperProps {
  id: string;
  className?: string;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
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
    onDragOver,
    onDrop,
    isContainer, 
    dangerouslySetInnerHTML, 
    customCss 
}) => {
  const isSelected = selectedElement === id;
  const customCssId = `custom-css-${id}`;

  const Tag = isContainer ? 'div' : 'div';

  const finalProps: any = {
    id,
    'data-custom-css-id': customCssId,
    style,
    draggable: true,
    onDragStart: onDragStart,
    onDragOver: onDragOver,
    onDrop: onDrop,
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
    <Tag {...finalProps}>
      {customCss && (
        <style>
          {`[data-custom-css-id="${customCssId}"] { ${customCss} }`}
        </style>
      )}
      {!dangerouslySetInnerHTML && children}
    </Tag>
  );
};

export default CanvasWrapper;

    