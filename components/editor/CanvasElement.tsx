
"use client";

import React, { type FC, DragEvent } from 'react';
import Image from 'next/image';
import { cn } from '@/core/utils';
import type { CanvasElementData } from '@/schemas/canvas';
import { EditableText } from './editable-text';
import ResizeHandle from './resize-handle';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CanvasElementProps {
  element: CanvasElementData;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  updateElement: (id: string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: DragEvent, parentId?: string | null, elementId?: string | null) => void;
  onDrop: (e: DragEvent, parentId?: string, elementId?: string) => void;
  resizingState: any; // Simplified for brevity
  onResizeStart: (e: React.MouseEvent, handle: any) => void;
  parentId?: string | null;
  draggedId: string | null;
  hoveredElementId: string | null;
  setHoveredElementId: (id: string | null) => void;
}

const headingStyles: Record<string, { fontSize: string, fontWeight: string }> = {
  'p': { fontSize: '1rem', fontWeight: 'normal' },
  'h1': { fontSize: '2.5rem', fontWeight: 'bold' },
  'h2': { fontSize: '2rem', fontWeight: 'bold' },
  'h3': { fontSize: '1.75rem', fontWeight: 'bold' },
  'h4': { fontSize: '1.5rem', fontWeight: 'bold' },
  'h5': { fontSize: '1.25rem', fontWeight: 'bold' },
  'h6': { fontSize: '1rem', fontWeight: 'bold' },
};


const CanvasElement: FC<CanvasElementProps> = (props) => {
  const {
    element,
    selectedElement,
    onSelectElement,
    updateElement,
    onDragStart,
    onDragOver,
    onDrop,
    resizingState,
    onResizeStart,
    parentId = null,
    draggedId,
    hoveredElementId,
    setHoveredElementId,
  } = props;
  const { id, type, children } = element;
  const properties = element.properties || {};
  const isContainer = ['section', 'div', 'container', 'form', 'list'].includes(type);
  const isSelected = selectedElement === id;

  const handleSaveText = (id: string, newContent: string) => {
    updateElement(id, { ...properties, 'text': newContent });
  };

  const handleTagChange = (id: string, newTag: string) => {
    const styles = headingStyles[newTag];
    const newProperties = {
      ...properties,
      tag: newTag,
      ...(styles && { fontSize: styles.fontSize, fontWeight: styles.fontWeight })
    };
    updateElement(id, newProperties);
  };

  const renderResizeHandles = () => {
    // Render resize handles only if the element is selected AND it is currently hovered
    // AND it's not an inline element.
    if (!isSelected || properties.display === 'inline' || hoveredElementId !== id) return null;

    const handles: ('top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right')[] = [
      'top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'
    ];
    return handles.map(handle => (
      <ResizeHandle key={handle} position={handle} onMouseDown={(e) => onResizeStart(e, handle)} />
    ));
  };

  const isEditingText = () => {
    return document.activeElement && document.activeElement.hasAttribute('contenteditable');
  };

  const commonProps: any = {
    id,
    style: properties as React.CSSProperties,
    draggable: true,
    onDragStart: (e: React.DragEvent) => onDragStart(e, id),
    onDragOver: (e: DragEvent) => onDragOver(e, parentId, id),
    onDrop: (e: DragEvent) => onDrop(e, parentId || undefined, id),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectElement(id);
    },
    onMouseEnter: (e: React.MouseEvent) => {
      if (isEditingText()) return;
      e.stopPropagation();
      setHoveredElementId(id);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      if (isEditingText()) return;
      e.stopPropagation();
      setHoveredElementId(null);
    },
    className: cn(
      'relative cursor-pointer group',
      { 'min-h-[20px] w-full': isContainer },
      properties['className']
    ),
  };

  if (id === draggedId) {
    return null;
  }

  switch (type) {
    case 'text': {
      const Tag = (properties['tag'] || 'p') as keyof JSX.IntrinsicElements;
      const content = properties['text'] || 'New Text Block';
      return (
        <Tag {...commonProps} className={cn(commonProps.className, 'font-headline tracking-tight')}>
          <EditableText id={id} initialValue={content} onSave={handleSaveText} onTagChange={handleTagChange} currentTag={Tag} as="span" />
          {renderResizeHandles()}
        </Tag>
      );
    }
    case 'button':
      return (
        <button {...commonProps}>
          <EditableText id={id} initialValue={properties['text'] || 'New Button'} onSave={handleSaveText} />
          {renderResizeHandles()}
        </button>
      );
    case 'image': {
      const imageStyle: React.CSSProperties = { borderRadius: properties.borderRadius };

      const wrapperStyle: React.CSSProperties = { ...commonProps.style, overflow: 'hidden' };

      // Separate border from image-specific styles
      if (wrapperStyle.border) {
        imageStyle.border = 'none'; // Prevent double borders
      } else {
        delete wrapperStyle.border;
      }

      return (
        <div {...commonProps} style={wrapperStyle}>
          {properties['src'] && (
            <Image
              src={properties['src']}
              alt={properties['alt'] || ''}
              width={parseInt(String(properties.width)) || 200}
              height={parseInt(String(properties.height)) || 100}
              className="w-full h-full object-cover"
              style={imageStyle}
              data-ai-hint={properties['data-ai-hint']}
            />
          )}
          {renderResizeHandles()}
        </div>
      );
    }
    case 'video':
      return (
        <div {...commonProps}>
          <video controls src={properties['src']} className="w-full h-full" />
          {renderResizeHandles()}
        </div>
      );
    case 'input':
      return (
        <div {...commonProps}>
          <Input type={properties['type']} value={properties['value']} placeholder={properties['placeholder']} className="h-full bg-background w-full" />
          {renderResizeHandles()}
        </div>
      );
    case 'textarea':
      return (
        <div {...commonProps}>
          <Textarea value={properties['value']} placeholder={properties['placeholder']} className="w-full h-full bg-background" />
          {renderResizeHandles()}
        </div>
      );
    case 'label':
      return (
        <label {...commonProps}>
          <EditableText id={id} initialValue={properties['text'] || 'Label'} onSave={handleSaveText} />
          {renderResizeHandles()}
        </label>
      );
    case 'section':
    case 'div':
    case 'container':
    case 'form':
    case 'list':
      let Tag: 'section' | 'div' | 'form' | 'ul' = 'div';
      if (type === 'section') Tag = 'section';
      if (type === 'form') Tag = 'form';
      if (type === 'list') Tag = 'ul';

      const containerStyle = properties?.display === 'flex' ? {
        display: 'flex',
        flexDirection: properties.flexDirection,
        justifyContent: properties.justifyContent,
        alignItems: properties.alignItems,
        flexWrap: properties.flexWrap,
        gap: properties.gap,
      } : {};

      return (
        <Tag
          {...commonProps}
          style={{ ...commonProps.style, ...containerStyle }}
          className={cn(commonProps.className, { 'container mx-auto': type === 'container' })}
          onDrop={(e) => onDrop(e, id)}
          onDragOver={(e) => onDragOver(e, id, null)}
        >
          {children && children.length > 0
            ? children.map(child => <CanvasElement key={child.id} {...{ ...props, element: child, parentId: id }} />)
            : <div className="min-h-[20px]" onDragOver={(e) => onDragOver(e, id, null)}></div>
          }
          {renderResizeHandles()}
        </Tag>
      );
    case 'list-item':
      return (
        <li {...commonProps}>
          <EditableText id={id} initialValue={properties['text'] || 'List Item'} onSave={handleSaveText} />
          {renderResizeHandles()}
        </li>
      );
    case 'html':
      return (
        <div {...commonProps} dangerouslySetInnerHTML={{ __html: properties['htmlContent'] || '' }}>
          {renderResizeHandles()}
        </div>
      );
    default:
      return null;
  }
};

export default CanvasElement;
