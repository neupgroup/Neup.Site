
import { type FC, useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CanvasElementData } from '@/app/site/editor/page';
import { EditableText } from './editable-text';
import ResizeHandle from './resize-handle';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { htmlToJsonAction } from '@/actions/ai/conversion';
import { useToast } from '@/hooks/use-toast';
import { logErrorToFirestore } from '@/actions/logging';

interface CanvasProps {
  elements: CanvasElementData[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  updateElement: (id: string, newStyles?: React.CSSProperties, newProps?: Record<string, any>, newContent?: string, newCustomCss?: string, newHtmlContent?: string) => void;
  moveElement: (draggedId: string, dropZoneId: string, parentId?: string) => void;
  addElement: (elementType: CanvasElementData['type'], dropZoneId?: string, parentId?: string, htmlContent?: string) => void;
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


const CanvasElementWrapper: FC<{
  id: string;
  className?: string;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnter: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onResizeStart: (e: React.MouseEvent, handle: ResizingState['handle']) => void;
  isContainer?: boolean;
  customCss?: string;
  dangerouslySetInnerHTML?: { __html: string };
}> = ({ id, className, selectedElement, onSelectElement, children, style, onDragStart, onDragEnter, onDragLeave, onResizeStart, isContainer, customCss, dangerouslySetInnerHTML }) => {
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


const Canvas: FC<CanvasProps> = ({ elements, selectedElement, onSelectElement, updateElement, moveElement, addElement, addGeneratedElement }) => {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropZone, setDropZone] = useState<{parentId: string | null, elementId: string | null}>({parentId: null, elementId: null});
    const [resizingState, setResizingState] = useState<ResizingState | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragCounter = useRef(0);
    const { toast } = useToast();

    const handleSaveText = (id: string, newContent: string) => {
        updateElement(id, undefined, undefined, newContent);
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
            addElement('html', targetId ?? undefined, parentId, data.html);
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
        
        const findElement = (els: CanvasElementData[], id: string): CanvasElementData | undefined => {
          for (const el of els) {
            if (el.id === id) return el;
            if (el.children) {
              const found = findElement(el.children, id);
              if (found) return found;
            }
          }
        }
        
        const elToUpdate = findElement(elements, resizingState.elementId);
        if (!elToUpdate) return;
        
        const newStyles = { ...elToUpdate.styles };
        
        let newWidth = resizingState.initialWidth;
        let newHeight = resizingState.initialHeight;

        if (resizingState.handle.includes('right')) {
            newWidth = resizingState.initialWidth + dx;
        }
        if (resizingState.handle.includes('left')) {
            newWidth = resizingState.initialWidth - dx;
            // newStyles.left = `${resizingState.initialLeft + dx - canvasRect.left}px`;
        }
        if (resizingState.handle.includes('bottom')) {
            newHeight = resizingState.initialHeight + dy;
        }
        if (resizingState.handle.includes('top')) {
            newHeight = resizingState.initialHeight - dy;
            // newStyles.top = `${resizingState.initialTop + dy - canvasRect.top}px`;
        }

        if (newWidth) {
          newStyles.width = `${Math.max(20, newWidth)}px`;
        }
        if (newHeight) {
          newStyles.height = `${Math.max(20, newHeight)}px`;
        }


        updateElement(resizingState.elementId, newStyles);

    }, [resizingState, elements, updateElement]);

    const handleMouseUp = useCallback(() => {
        setResizingState(null);
    }, []);

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
    
    const renderElement = (element: CanvasElementData, parentId: string | null = null) => {
        const { id, type, content, htmlContent, styles, props, children, customCss, className } = element;
        const isContainer = ['section', 'div', 'container', 'form', 'list'].includes(type);
        const isSelected = selectedElement === id;

        const {key, ...restWrapperProps} = {
            id,
            className,
            selectedElement,
            onSelectElement,
            style: styles,
            key: id,
            onDragStart: handleDragStart,
            onDragEnter: (e: React.DragEvent) => handleDragEnter(e, id, parentId),
            onDragLeave: handleDragLeave,
            onResizeStart: handleResizeStart,
            isContainer,
            customCss
        };
        
        const showDropIndicator = dropZone.elementId === id && dropZone.parentId === parentId && id !== draggedId;

        const elementComponent = (() => {
            switch (type) {
                case 'heading':
                    const HeadingTag = `h${props?.level || 1}` as keyof JSX.IntrinsicElements;
                    return (
                        <CanvasElementWrapper {...restWrapperProps}>
                             <HeadingTag>
                                <EditableText id={id} initialValue={content || ''} onSave={handleSaveText} style={{fontSize: styles.fontSize, fontWeight: styles.fontWeight, textAlign: styles.textAlign as any}} className="font-headline tracking-tight" />
                            </HeadingTag>
                        </CanvasElementWrapper>
                    );
                case 'text':
                    return (
                        <CanvasElementWrapper {...restWrapperProps}>
                            <EditableText id={id} initialValue={content || ''} onSave={handleSaveText} style={{fontSize: styles.fontSize, textAlign: styles.textAlign as any}} />
                        </CanvasElementWrapper>
                    );
                case 'link':
                    return (
                        <CanvasElementWrapper {...restWrapperProps}>
                            <a href={props?.href || '#'} style={{color: styles.color}}><EditableText id={id} initialValue={content || ''} onSave={handleSaveText} style={{fontSize: styles.fontSize, textAlign: styles.textAlign as any}} /></a>
                        </CanvasElementWrapper>
                    );
                case 'button':
                    return (
                        <CanvasElementWrapper {...restWrapperProps}>
                            <Button className="w-full h-full"><EditableText id={id} initialValue={content || ''} onSave={handleSaveText}/></Button>
                        </CanvasElementWrapper>
                    );
                case 'image':
                     return (
                        <CanvasElementWrapper {...restWrapperProps}>
                            {props?.src && <Image src={props.src} alt={props.alt || ''} width={props.width || 200} height={props.height || 100} className="w-full h-full object-cover" {...props} />}
                        </CanvasElementWrapper>
                     );
                case 'video':
                     return (
                        <CanvasElementWrapper {...restWrapperProps}>
                            <video controls src={props?.src} className="w-full h-full" />
                        </CanvasElementWrapper>
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

                  return (
                    <CanvasElementWrapper {...restWrapperProps} className={cn({'p-4': children?.length === 0, 'container': type === 'container'}, className)}>
                      <Tag 
                        onDrop={(e) => handleDrop(e, id)} 
                        onDragOver={(e) => handleDragOver(e, id)} 
                        className="min-h-full h-full"
                      >
                        {children && children.length > 0 
                            ? children.map(child => renderElement(child, id)) 
                            : <span className="text-muted-foreground text-sm pointer-events-none">Drag elements here</span>
                        }
                        {dropZone.parentId === id && !dropZone.elementId && (
                            <DropIndicator className="!my-0" />
                        )}
                      </Tag>
                    </CanvasElementWrapper>
                  )
                case 'list-item':
                  return (
                    <CanvasElementWrapper {...restWrapperProps}>
                      <li>
                        <EditableText id={id} initialValue={content || ''} onSave={handleSaveText} />
                      </li>
                    </CanvasElementWrapper>
                  )
                case 'input':
                    return (
                        <CanvasElementWrapper {...restWrapperProps}>
                           <Input {...props} className="w-full h-full bg-background" />
                        </CanvasElementWrapper>
                    );
                case 'textarea':
                    return (
                        <CanvasElementWrapper {...restWrapperProps}>
                           <Textarea {...props} className="w-full h-full bg-background" />
                        </CanvasElementWrapper>
                    );
                case 'label':
                    return (
                        <CanvasElementWrapper {...restWrapperProps}>
                            <label><EditableText id={id} initialValue={content || ''} onSave={handleSaveText}/></label>
                        </CanvasElementWrapper>
                    );
                case 'html':
                  return (
                      <div className="relative">
                          <CanvasElementWrapper {...restWrapperProps} dangerouslySetInnerHTML={{ __html: htmlContent || '' }} />
                          {isSelected && (
                          <>
                              <ResizeHandle position="top-left" onMouseDown={(e) => handleResizeStart(e, 'top-left')} />
                              <ResizeHandle position="top" onMouseDown={(e) => handleResizeStart(e, 'top')} />
                              <ResizeHandle position="top-right" onMouseDown={(e) => handleResizeStart(e, 'top-right')} />
                              <ResizeHandle position="left" onMouseDown={(e) => handleResizeStart(e, 'left')} />
                              <ResizeHandle position="right" onMouseDown={(e) => handleResizeStart(e, 'right')} />
                              <ResizeHandle position="bottom-left" onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />
                              <ResizeHandle position="bottom" onMouseDown={(e) => handleResizeStart(e, 'bottom')} />
                              <ResizeHandle position="bottom-right" onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />
                          </>
                          )}
                      </div>
                  );
                default:
                     // Fallback for obsolete types
                    if ((type as string).startsWith('hero') || (type as string).startsWith('feature')) {
                         return (
                            <CanvasElementWrapper {...restWrapperProps}>
                                <div className="text-muted-foreground p-4 border border-dashed">Obsolete Component: {type}</div>
                            </CanvasElementWrapper>
                        )
                    }
                    return null;
            }
        })();

        return (
            <div key={id}>
                {showDropIndicator && <DropIndicator />}
                {elementComponent}
            </div>
        )
    }
  
  return (
    <div 
        className="mx-auto h-full w-full max-w-screen-xl px-4 md:px-8 py-10" 
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
        className="rounded-lg bg-card shadow-lg relative mb-16"
      >
        {elements.map(el => <div key={el.id}>{renderElement(el)}</div>)}
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
