
'use client';

import React, { type FC, DragEvent } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { CanvasElementData } from '@/lib/schemas';
import { EditableText } from './editable-text';
import ResizeHandle from './resize-handle';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import CanvasWrapper from './CanvasWrapper';

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
}

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
    draggedId
  } = props;
  const { id, type, children } = element;
  const properties = element.properties || {};
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
    style: properties as React.CSSProperties,
    onDragStart: (e: React.DragEvent) => onDragStart(e, id),
    isContainer,
    customCss: properties['customCss']
  };

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

  const dragHandlers = {
      onDragOver: (e: DragEvent) => onDragOver(e, parentId, id),
      onDrop: (e: DragEvent) => onDrop(e, parentId, id),
  };

  if (id === 'temp_element' || id === draggedId) {
      if (id === 'temp_element') {
        return (
            <div 
                className="w-full h-16 border-2 border-dashed border-primary rounded-lg flex items-center justify-center text-primary bg-primary/10 my-2 transition-all"
            >
                Drop here
            </div>
        );
      }
      return null; // Hide dragged element from its original position
  }


  switch (type) {
    case 'heading':
    case 'text': {
        const isHeading = type === 'heading';
        const HeadingTag = isHeading ? `h${properties['level'] || 1}` as keyof JSX.IntrinsicElements : 'div';
        const content = properties['text'] || (isHeading ? 'New Heading' : 'New Text');

        if (isSelected) {
            elementComponent = (
                <CanvasWrapper {...wrapperProps} {...dragHandlers}>
                    <HeadingTag>
                        <EditableText id={id} initialValue={content} onSave={handleSaveText} className={isHeading ? "font-headline tracking-tight" : ""} />
                    </HeadingTag>
                    {renderResizeHandles()}
                </CanvasWrapper>
            );
        } else {
            elementComponent = (
                <CanvasWrapper {...wrapperProps} {...dragHandlers}>
                    <HeadingTag dangerouslySetInnerHTML={{ __html: content }} />
                </CanvasWrapper>
            );
        }
        break;
    }
    case 'button':
        elementComponent = (
            <CanvasWrapper {...wrapperProps} {...dragHandlers}>
                <div style={{display: 'inline-block'}} >
                    <EditableText id={id} initialValue={properties['text'] || ''} onSave={handleSaveText} />
                </div>
                {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'image':
         elementComponent = (
            <CanvasWrapper {...wrapperProps} {...dragHandlers}>
                <div style={{width: '100%', height: '100%'}} className="overflow-hidden">
                    {properties['src'] && <Image src={properties['src']} alt={properties['alt'] || ''} width={parseInt(String(properties.width)) || 200} height={parseInt(String(properties.height)) || 100} className="w-full h-full object-cover" data-ai-hint={properties['data-ai-hint']} />}
                </div>
                {renderResizeHandles()}
            </CanvasWrapper>
         );
         break;
    case 'video':
         elementComponent = (
            <CanvasWrapper {...wrapperProps} {...dragHandlers}>
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
        <CanvasWrapper {...wrapperProps} className={cn({'container mx-auto': type === 'container'}, wrapperProps.className)} {...dragHandlers}>
          <Tag 
            onDrop={(e) => onDrop(e, id)} 
            onDragOver={(e) => onDragOver(e, id, null)} 
            className="h-full w-full"
          >
            {children && children.length > 0 
                ? children.map(child => <CanvasElement key={child.id} {...{...props, element: child, parentId: id}} />) 
                : <div className="min-h-[20px]" onDragOver={(e) => onDragOver(e, id, null)}></div>
            }
          </Tag>
          {renderResizeHandles()}
        </CanvasWrapper>
      );
      break;
    case 'list-item':
      elementComponent = (
        <CanvasWrapper {...wrapperProps} {...dragHandlers}>
          <li>
            <EditableText id={id} initialValue={properties['text'] || ''} onSave={handleSaveText} />
          </li>
          {renderResizeHandles()}
        </CanvasWrapper>
      );
      break;
    case 'input':
        elementComponent = (
            <CanvasWrapper {...wrapperProps} {...dragHandlers}>
               <Input type={properties['type']} value={properties['value']} placeholder={properties['placeholder']} className="w-full h-full bg-background" />
               {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'textarea':
        elementComponent = (
            <CanvasWrapper {...wrapperProps} {...dragHandlers}>
               <Textarea value={properties['value']} placeholder={properties['placeholder']} className="w-full h-full bg-background" />
               {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'label':
        elementComponent = (
            <CanvasWrapper {...wrapperProps} {...dragHandlers}>
                <label><EditableText id={id} initialValue={properties['text'] || ''} onSave={handleSaveText}/></label>
                {renderResizeHandles()}
            </CanvasWrapper>
        );
        break;
    case 'html':
         elementComponent = (
            <CanvasWrapper {...wrapperProps} dangerouslySetInnerHTML={{ __html: properties['htmlContent'] || '' }} {...dragHandlers}>
                {/* No children allowed with dangerouslySetInnerHTML */}
            </CanvasWrapper>
         );
         if (isSelected) {
            // Re-wrap to add resize handles outside
             return (
                 <div key={id}>
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
        {elementComponent}
    </div>
  );
};

export default CanvasElement;
