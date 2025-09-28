import React, { type FC, useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CanvasElementData } from '@/lib/schemas';
import { EditableText } from './editable-text';
import ResizeHandle from './resize-handle';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { logErrorToFirestore } from '@/actions/logging';

interface CanvasProps {
  elements: CanvasElementData[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  updateElement: (id:string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  moveElement: (draggedId: string, dropZoneId: string, parentId?: string) => void;
  addElement: (elementType: CanvasElementData['type'], dropZoneId?: string, parentId?: string) => void;
  addGeneratedElement: (element: CanvasElementData, dropZoneId?: string, parentId?: string) => void;
}

const DropIndicator: FC<{className?: string}> = ({className}) => (
    <div className={cn("relative h-1 w-full my-2 bg-primary rounded-full", className)} />
)

interface ResizingState {
    elementId: string;
    handle: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'right' | 'bottom' | 'left';
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
    initialTop: number;
    initialLeft: number;
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


const CanvasElementWrapper: FC<{
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
}> = ({ id, className, selectedElement, onSelectElement, children, style, onDragStart, onDragEnter, onDragLeave, isContainer, dangerouslySetInnerHTML }) => {
  const isSelected = selectedElement === id;
  const customCss = (style as any)?.customCss;
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


const Canvas: FC<CanvasProps> = ({ elements, selectedElement, onSelectElement, updateElement, moveElement, addElement, addGeneratedElement }) => {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropZone, setDropZone] = useState<{parentId: string | null, elementId: string | null}>({parentId: null, elementId: null});
    const [resizingState, setResizingState] = useState<ResizingState | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragCounter = useRef(0);
    const { toast } = useToast();

    const handleSaveText = (id: string, newContent: string) => {
        const el = findElementRecursive(elements, id)?.element;
        if(el) {
            updateElement(id, {...el.properties, 'content.text': newContent});
        }
    }

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({id, type: 'canvas-element'}));
        e.stopPropagation();
        setDraggedId(id);
    }
    
    const handleDragStartSidebar = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'sidebar-element', elementType: type }));
    }

    const handleDragOver = (e: React.DragEvent, parentId: string | null = null) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        const closestElement = target.closest('[draggable="true"]');
        let elementId = closestElement ? closestElement.id : null;

        if (elementId === draggedId) {
          elementId = null;
        }
        
        setDropZone({ parentId, elementId });
    }
    
    const handleDrop = async (e: React.DragEvent, parentId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;
        const data = JSON.parse(dataStr);

        const targetId = dropZone.elementId;

        if (data.type === 'canvas-element' && draggedId) {
            moveElement(draggedId, targetId!, parentId);
        } else if (data.type === 'sidebar-element') {
            addElement(data.elementType, targetId ?? undefined, parentId);
        } else if (data.type === 'template-element') {
            addGeneratedElement(data.element, targetId ?? undefined, parentId);
        }
        
        setDraggedId(null);
        setDropZone({parentId: null, elementId: null});
        dragCounter.current = 0;
    }
    
    const handleDragEnter = (e: React.DragEvent<Element>, id: string, parentId: string | null = null) => {
        e.stopPropagation();
        dragCounter.current++;
        setDropZone({parentId: parentId, elementId: id});
    }

    const handleDragLeave = (e: React.DragEvent<Element>) => {
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDropZone({parentId: null, elementId: null});
        }
    }

    const findElementRecursive = (elements: CanvasElementData[], id: string): {element: CanvasElementData, parent?: CanvasElementData} | null => {
        for (const el of elements) {
            if (el.id === id) {
                return {element: el};
            }
            if (el.children) {
                const found = findElementRecursive(el.children, id);
                if (found) {
                    return {element: found.element, parent: found.parent || el};
                }
            }
        }
        return null;
    }


    const handleResizeStart = useCallback((e: React.MouseEvent, handle: ResizingState['handle']) => {
        if (!selectedElement) return;
        e.stopPropagation();
        e.preventDefault();

        const element = document.getElementById(selectedElement);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        
        setResizingState({
            elementId: selectedElement,
            handle,
            initialX: e.clientX,
            initialY: e.clientY,
            initialWidth: rect.width,
            initialHeight: rect.height,
            initialTop: rect.top,
            initialLeft: rect.left,
        });

    }, [selectedElement]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingState || !canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();


        const dx = e.clientX - resizingState.initialX;
        const dy = e.clientY - resizingState.initialY;
        
        const elToUpdate = findElementRecursive(elements, resizingState.elementId)?.element;
        if (!elToUpdate) return;
        
        const newProperties = { ...elToUpdate.properties };
        
        let newWidth = resizingState.initialWidth;
        let newHeight = resizingState.initialHeight;

        if (resizingState.handle.includes('right')) {
            newWidth = resizingState.initialWidth + dx;
        }
        if (resizingState.handle.includes('left')) {
            newWidth = resizingState.initialWidth - dx;
        }
        if (resizingState.handle.includes('bottom')) {
            newHeight = resizingState.initialHeight + dy;
        }
        if (resizingState.handle.includes('top')) {
            newHeight = resizingState.initialHeight - dy;
        }

        if (newWidth) {
          newProperties['layout.width'] = `${Math.max(20, newWidth)}px`;
        }
        if (newHeight) {
          newProperties['layout.height'] = `${Math.max(20, newHeight)}px`;
        }


        updateElement(resizingState.elementId, newProperties, false);

    }, [resizingState, elements, updateElement]);

    const handleMouseUp = useCallback(() => {
        if (resizingState) {
            const elToUpdate = findElementRecursive(elements, resizingState.elementId)?.element;
            if (elToUpdate) {
                updateElement(resizingState.elementId, elToUpdate.properties, true); // Record history on mouse up
            }
        }
        setResizingState(null);
    }, [resizingState, elements, updateElement]);

    useEffect(() => {
        if (resizingState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingState, handleMouseMove, handleMouseUp]);
    
    const renderElement = (element: CanvasElementData, parentId: string | null = null): React.ReactNode => {
        const { id, type, properties, children } = element;
        const styles = extractStyles(properties);
        const isContainer = ['section', 'div', 'container', 'form', 'list'].includes(type);
        const isSelected = selectedElement === id;

        const wrapperProps = {
            id,
            className: properties['attributes.className'],
            selectedElement,
            onSelectElement,
            style: styles,
            onDragStart: handleDragStart,
            onDragEnter: (e: React.DragEvent) => handleDragEnter(e, id, parentId),
            onDragLeave: handleDragLeave,
            isContainer,
            customCss: properties['customCss.css']
        };
        
        const showDropIndicator = dropZone.elementId === id && dropZone.parentId === parentId && id !== draggedId;

        const renderResizeHandles = () => {
            if (!isSelected || !canvasRef.current) return null;

            const elementNode = document.getElementById(id);
            if (!elementNode) return null;

            const elementRect = elementNode.getBoundingClientRect();
            const canvasRect = canvasRef.current.getBoundingClientRect();
            
            const positionTolerance = 5; // To account for small gaps/borders

            const atTop = elementRect.top <= canvasRect.top + positionTolerance;
            const atBottom = elementRect.bottom >= canvasRect.bottom - positionTolerance;
            const atLeft = elementRect.left <= canvasRect.left + positionTolerance;
            const atRight = elementRect.right >= canvasRect.right - positionTolerance;
            
            return (
            <>
              {!atTop && !atLeft && <ResizeHandle position="top-left" onMouseDown={(e) => handleResizeStart(e, 'top-left')} />}
              {!atTop && <ResizeHandle position="top" onMouseDown={(e) => handleResizeStart(e, 'top')} />}
              {!atTop && !atRight && <ResizeHandle position="top-right" onMouseDown={(e) => handleResizeStart(e, 'top-right')} />}
              {!atLeft && <ResizeHandle position="left" onMouseDown={(e) => handleResizeStart(e, 'left')} />}
              {!atRight && <ResizeHandle position="right" onMouseDown={(e) => handleResizeStart(e, 'right')} />}
              {!atBottom && !atLeft && <ResizeHandle position="bottom-left" onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />}
              {!atBottom && <ResizeHandle position="bottom" onMouseDown={(e) => handleResizeStart(e, 'bottom')} />}
              {!atBottom && !atRight && <ResizeHandle position="bottom-right" onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />}
            </>
            )
        };

        let elementComponent: React.ReactNode;

        switch (type) {
            case 'heading':
                const HeadingTag = `h${properties['heading.level'] || 1}` as keyof JSX.IntrinsicElements;
                elementComponent = (
                    <CanvasElementWrapper {...wrapperProps}>
                         <HeadingTag>
                            <EditableText id={id} initialValue={properties['content.text'] || ''} onSave={handleSaveText} style={styles} className="font-headline tracking-tight" />
                        </HeadingTag>
                        {renderResizeHandles()}
                    </CanvasElementWrapper>
                );
                break;
            case 'text':
                elementComponent = (
                    <CanvasElementWrapper {...wrapperProps}>
                        <EditableText id={id} initialValue={properties['content.text'] || ''} onSave={handleSaveText} style={styles} />
                        {renderResizeHandles()}
                    </CanvasElementWrapper>
                );
                break;
            case 'link':
                elementComponent = (
                    <CanvasElementWrapper {...wrapperProps}>
                        <a href={properties['link.href'] || '#'} style={{color: styles.color}}><EditableText id={id} initialValue={properties['content.text'] || ''} onSave={handleSaveText} style={styles} /></a>
                        {renderResizeHandles()}
                    </CanvasElementWrapper>
                );
                break;
            case 'button':
                elementComponent = (
                    <CanvasElementWrapper {...wrapperProps}>
                        <EditableText id={id} initialValue={properties['content.text'] || ''} onSave={handleSaveText} style={{...styles, display: 'block'}} />
                        {renderResizeHandles()}
                    </CanvasElementWrapper>
                );
                break;
            case 'image':
                 elementComponent = (
                    <CanvasElementWrapper {...wrapperProps}>
                        {properties['image.src'] && <Image src={properties['image.src']} alt={properties['image.alt'] || ''} width={parseInt(String(styles.width)) || 200} height={parseInt(String(styles.height)) || 100} className="w-full h-full object-cover" data-ai-hint={properties['image.data-ai-hint']} />}
                        {renderResizeHandles()}
                    </CanvasElementWrapper>
                 );
                 break;
            case 'video':
                 elementComponent = (
                    <CanvasElementWrapper {...wrapperProps}>
                        <video controls src={properties['video.src']} className="w-full h-full" />
                        {renderResizeHandles()}
                    </CanvasElementWrapper>
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
                <CanvasElementWrapper {...wrapperProps} className={cn({'min-h-[100px]': children?.length === 0, 'container mx-auto': type === 'container'}, wrapperProps.className)}>
                  <Tag 
                    onDrop={(e) => handleDrop(e, id)} 
                    onDragOver={(e) => handleDragOver(e, id)} 
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
                        ? children.map(child => renderElement(child, id)) 
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
                </CanvasElementWrapper>
              );
              break;
            case 'list-item':
              elementComponent = (
                <CanvasElementWrapper {...wrapperProps}>
                  <li>
                    <EditableText id={id} initialValue={properties['content.text'] || ''} onSave={handleSaveText} />
                  </li>
                  {renderResizeHandles()}
                </CanvasElementWrapper>
              );
              break;
            case 'input':
                elementComponent = (
                    <CanvasElementWrapper {...wrapperProps}>
                       <Input type={properties['input.type']} value={properties['input.value']} placeholder={properties['input.placeholder']} style={styles} className="w-full h-full bg-background" />
                       {renderResizeHandles()}
                    </CanvasElementWrapper>
                );
                break;
            case 'textarea':
                elementComponent = (
                    <CanvasElementWrapper {...wrapperProps}>
                       <Textarea value={properties['textarea.value']} placeholder={properties['textarea.placeholder']} style={styles} className="w-full h-full bg-background" />
                       {renderResizeHandles()}
                    </CanvasElementWrapper>
                );
                break;
            case 'label':
                elementComponent = (
                    <CanvasElementWrapper {...wrapperProps}>
                        <label><EditableText id={id} initialValue={properties['content.text'] || ''} onSave={handleSaveText}/></label>
                        {renderResizeHandles()}
                    </CanvasElementWrapper>
                );
                break;
            case 'html':
                 elementComponent = (
                    <CanvasElementWrapper {...wrapperProps} dangerouslySetInnerHTML={{ __html: properties['html.htmlContent'] || '' }} />
                 );
                 if (isSelected) {
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
    }
  
  return (
    <div 
        className="mx-auto h-full w-full max-w-screen-xl py-10 px-4 md:px-8" 
        onClick={() => onSelectElement(null)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current++;
        }}
    >
      <div 
        ref={canvasRef}
        className="rounded-lg bg-card shadow-lg relative mb-32"
      >
        {elements.map(el => renderElement(el))}
        {elements.length === 0 && (
             <div 
                className="flex items-center justify-center h-48 border-2 border-dashed border-muted rounded-lg"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropZone({parentId: null, elementId: 'canvas-end'}) }}
                onDrop={(e) => handleDrop(e)}
            >
                <p className="text-muted-foreground">Drag elements here to start building</p>
                {dropZone.elementId === 'canvas-end' && <DropIndicator/>}
            </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
