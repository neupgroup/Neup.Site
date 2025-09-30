
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
  isFlex?: boolean;
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
    customCss,
    isFlex,
}) => {
  const isSelected = selectedElement === id;
  const customCssId = `custom-css-${id}`;

  const Tag = 'div';
  
  let finalStyle = style ? {...style} : {};

  // If it's a flex container, remove flex properties from the wrapper
  // as they will be applied to the inner tag.
  if (isFlex) {
      delete finalStyle.display;
      delete finalStyle.flexDirection;
      delete finalStyle.justifyContent;
      delete finalStyle.alignItems;
      delete finalStyle.flexWrap;
      delete finalStyle.gap;
  }


  const finalProps: any = {
    id,
    'data-custom-css-id': customCssId,
    style: finalStyle,
    draggable: true,
    onDragStart: onDragStart,
    onDragOver: onDragOver,
    onDrop: onDrop,
    className: cn(
      'relative cursor-pointer transition-all group',
      isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:ring-1 hover:ring-primary/50',
      {'min-h-[20px] w-full': isContainer},
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
