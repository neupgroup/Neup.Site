
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
    for (const key in properties) {
        if (key.startsWith('layout.') || key.startsWith('spacing.') || key.startsWith('typography.') || key.startsWith('background.') || key.startsWith('borders.') || key.startsWith('flexbox.')) {
            const cssProperty = key.split('.')[1];
            // A simple camelCase conversion
            const camelCaseProperty = cssProperty.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            (style as any)[camelCaseProperty] = properties[key];
        }
    }
    return style;
}

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
    updateElement(id, { ...properties, 'content.text': newContent });
  };
  
  const wrapperProps = {
    id,
    className: properties['attributes.className'],
    selectedElement,
    onSelectElement,
    style: styles,
    onDragStart: (e: React.DragEvent) => onDragStart(e, id),
    onDragEnter: (e: React.DragEvent) => onDragEnter(e, id, parentId),
    onDragLeave: onDragLeave,
    isContainer,
    customCss: properties['customCss.css']
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
        const HeadingTag = isHeading ? `h${properties['heading.level'] || 1}` as keyof JSX.IntrinsicElements : 'div';
        const content = properties['content.text'] || (isHeading ? 'New Heading' : 'New Text');

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
                <EditableText id={id} initialValue={properties['content.text'] || ''} onSave={handleSaveText} style={{...styles, display: 'block'}} />
                {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'image':
         elementComponent = (
            <CanvasWrapper {...wrapperProps}>
                {properties['image.src'] && <Image src={properties['image.src']} alt={properties['image.alt'] || ''} width={parseInt(String(styles.width)) || 200} height={parseInt(String(styles.height)) || 100} className="w-full h-full object-cover" data-ai-hint={properties['image.data-ai-hint']} />}
                {renderResizeHandles()}
            </CanvasWrapper>
         );
         break;
    case 'video':
         elementComponent = (
            <CanvasWrapper {...wrapperProps}>
                <video controls src={properties['video.src']} className="w-full h-full" />
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
        <CanvasWrapper {...wrapperProps} className={cn({'min-h-[100px]': children?.length === 0, 'container mx-auto': type === 'container'}, wrapperProps.className)}>
          <Tag 
            onDrop={(e) => onDrop(e, id)} 
            onDragOver={(e) => onDragOver(e, id)} 
            className="min-h-full h-full"
            style={{
              display: styles.display,
              flexDirection: styles.flexDirection,
              justifyContent: styles.justifyContent,
              alignItems: styles.alignItems,
              flexWrap: styles.flexWrap,
              gap: styles.gap,
            } as React.CSSProperties}
          >
            {children && children.length > 0 
                ? children.map(child => <CanvasElement key={child.id} {...{...props, element: child, parentId: id}} />) 
                : (
                    <div className="flex items-center justify-center pointer-events-none text-muted-foreground p-4 h-24">
                       {dropZone.parentId === id && !dropZone.elementId ? '' : ''}
                    </div>
                )
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
            <EditableText id={id} initialValue={properties['content.text'] || ''} onSave={handleSaveText} />
          </li>
          {renderResizeHandles()}
        </CanvasWrapper>
      );
      break;
    case 'input':
        elementComponent = (
            <CanvasWrapper {...wrapperProps}>
               <Input type={properties['input.type']} value={properties['input.value']} placeholder={properties['input.placeholder']} style={styles} className="w-full h-full bg-background" />
               {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'textarea':
        elementComponent = (
            <CanvasWrapper {...wrapperProps}>
               <Textarea value={properties['textarea.value']} placeholder={properties['textarea.placeholder']} style={styles} className="w-full h-full bg-background" />
               {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'label':
        elementComponent = (
            <CanvasWrapper {...wrapperProps}>
                <label><EditableText id={id} initialValue={properties['content.text'] || ''} onSave={handleSaveText}/></label>
                {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'html':
         elementComponent = (
            <CanvasWrapper {...wrapperProps} dangerouslySetInnerHTML={{ __html: properties['html.htmlContent'] || '' }}>
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
