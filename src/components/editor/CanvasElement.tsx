

'use client';

import React, { type FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { CanvasElementData } from '@/lib/schemas';
import { EditableText } from './editable-text';
import ResizeHandle from './resize-handle';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import CanvasWrapper from './CanvasWrapper';
import DropIndicator from './DropIndicator';

interface CanvasElementProps {
  element: CanvasElementData;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  updateElement: (id: string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnter: (e: React.DragEvent, id: string, parentId?: string | null) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, parentId?: string, dropZoneId?: string) => void;
  onDragOver: (e: React.DragEvent, parentId?: string | null) => void;
  dropZone: { parentId: string | null, elementId: string | null };
  draggedId: string | null;
  resizingState: any; // Simplified for brevity
  onResizeStart: (e: React.MouseEvent, handle: any) => void;
  parentId?: string | null;
}

const extractStyles = (properties: Record<string, any>): React.CSSProperties => {
    const style: React.CSSProperties = {};
    const directProperties = [
        'width', 'height', 'minHeight', 'display', 'padding', 'margin', 
        'color', 'fontSize', 'fontWeight', 'textAlign', 'backgroundColor', 
        'backgroundImage', 'backgroundRepeat', 'border', 'borderRadius', 
        'boxShadow', 'flexDirection', 'justifyContent', 'alignItems', 
        'flexWrap', 'gap'
    ];

    for (const key of directProperties) {
        if (properties[key]) {
            // A simple mapping for keys that don't match CSS property names
            const cssKey = key === 'bgcolor' ? 'backgroundColor' : key;
            (style as any)[cssKey] = properties[key];
        }
    }

    return style;
};

const CanvasElement: FC<CanvasElementProps> = (props) => {
  const {
    element,
    selectedElement,
    onSelectElement,
    updateElement,
    onDragStart,
    onDragEnter,
    onDragLeave,
    onDrop,
    onDragOver,
    dropZone,
    draggedId,
    resizingState,
    onResizeStart,
    parentId = null
  } = props;
  const { id, type, children } = element;
  const properties = element.properties || {};
  const styles = extractStyles(properties);
  const isContainer = ['section', 'div', 'container', 'form', 'list'].includes(type);
  const isSelected = selectedElement === id;

  const handleSaveText = (id: string, newContent: string) => {
    updateElement(id, { ...properties, 'text': newContent });
  };
  
  const wrapperProps = {
    id,
    className: properties['className'],
    selectedElement,
    onSelectElement,
    style: styles,
    onDragStart: (e: React.DragEvent) => onDragStart(e, id),
    onDragEnter: (e: React.DragEvent) => onDragEnter(e, id, parentId),
    onDragLeave: onDragLeave,
    isContainer,
    customCss: properties['customCss']
  };

  const showDropIndicator = dropZone.elementId === id && dropZone.parentId === parentId && id !== draggedId;

  const renderResizeHandles = () => {
    if (!isSelected) return null;
    const handles: ('top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right')[] = [
        'top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'
    ];
    return handles.map(handle => (
        <ResizeHandle key={handle} position={handle} onMouseDown={(e) => onResizeStart(e, handle)} />
    ));
  };
  
  let elementComponent: React.ReactNode;

  switch (type) {
    case 'heading':
    case 'text': {
        const isHeading = type === 'heading';
        const HeadingTag = isHeading ? `h${properties['level'] || 1}` as keyof JSX.IntrinsicElements : 'div';
        const content = properties['text'] || (isHeading ? 'New Heading' : 'New Text');

        if (isSelected) {
            elementComponent = (
                <CanvasWrapper {...wrapperProps}>
                    <HeadingTag>
                        <EditableText id={id} initialValue={content} onSave={handleSaveText} style={styles} className={isHeading ? "font-headline tracking-tight" : ""} />
                    </HeadingTag>
                    {renderResizeHandles()}
                </CanvasWrapper>
            );
        } else {
            elementComponent = (
                <CanvasWrapper {...wrapperProps}>
                    <HeadingTag style={styles} dangerouslySetInnerHTML={{ __html: content }} />
                </CanvasWrapper>
            );
        }
        break;
    }
    case 'button':
        elementComponent = (
            <CanvasWrapper {...wrapperProps}>
                <EditableText id={id} initialValue={properties['text'] || ''} onSave={handleSaveText} style={{...styles, display: 'block'}} />
                {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'image':
         elementComponent = (
            <CanvasWrapper {...wrapperProps}>
                {properties['src'] && <Image src={properties['src']} alt={properties['alt'] || ''} width={parseInt(String(styles.width)) || 200} height={parseInt(String(styles.height)) || 100} className="w-full h-full object-cover" data-ai-hint={properties['data-ai-hint']} />}
                {renderResizeHandles()}
            </CanvasWrapper>
         );
         break;
    case 'video':
         elementComponent = (
            <CanvasWrapper {...wrapperProps}>
                <video controls src={properties['src']} className="w-full h-full" />
                {renderResizeHandles()}
            </CanvasWrapper>
         );
         break;
    case 'section':
    case 'div':
    case 'container':
    case 'form':
    case 'list':
      let Tag: 'section' | 'div' | 'form' | 'ul' = 'div';
      if (type === 'section') Tag = 'section';
      if (type === 'form') Tag = 'form';
      if (type === 'list') Tag = 'ul';

      elementComponent = (
        <CanvasWrapper {...wrapperProps} className={cn({'container mx-auto': type === 'container'}, wrapperProps.className)}>
          <Tag 
            onDrop={(e) => onDrop(e, id)} 
            onDragOver={(e) => onDragOver(e, id)} 
          >
            {children && children.length > 0 
                ? children.map(child => <CanvasElement key={child.id} {...{...props, element: child, parentId: id}} />) 
                : null
            }
            {dropZone.parentId === id && !dropZone.elementId && (
                <DropIndicator className="!my-0" />
            )}
          </Tag>
          {renderResizeHandles()}
        </CanvasWrapper>
      );
      break;
    case 'list-item':
      elementComponent = (
        <CanvasWrapper {...wrapperProps}>
          <li>
            <EditableText id={id} initialValue={properties['text'] || ''} onSave={handleSaveText} />
          </li>
          {renderResizeHandles()}
        </CanvasWrapper>
      );
      break;
    case 'input':
        elementComponent = (
            <CanvasWrapper {...wrapperProps}>
               <Input type={properties['type']} value={properties['value']} placeholder={properties['placeholder']} style={styles} className="w-full h-full bg-background" />
               {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'textarea':
        elementComponent = (
            <CanvasWrapper {...wrapperProps}>
               <Textarea value={properties['value']} placeholder={properties['placeholder']} style={styles} className="w-full h-full bg-background" />
               {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'label':
        elementComponent = (
            <CanvasWrapper {...wrapperProps}>
                <label><EditableText id={id} initialValue={properties['text'] || ''} onSave={handleSaveText}/></label>
                {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'html':
         elementComponent = (
            <CanvasWrapper {...wrapperProps} dangerouslySetInnerHTML={{ __html: properties['htmlContent'] || '' }}>
                {/* No children allowed with dangerouslySetInnerHTML */}
            </CanvasWrapper>
         );
         if (isSelected) {
            // Re-wrap to add resize handles outside
             return (
                 <div key={id}>
                    {showDropIndicator && <DropIndicator />}
                    {elementComponent}
                    {renderResizeHandles()}
                 </div>
             );
         }
        break;
    default:
        return null;
  }
  
  return (
    <div key={id}>
        {showDropIndicator && <DropIndicator />}
        {elementComponent}
    </div>
  );
};

export default CanvasElement;
