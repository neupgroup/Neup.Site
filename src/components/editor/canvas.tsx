import { type FC, useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CanvasElementData } from '@/app/page';
import { EditableText } from './editable-text';
import ResizeHandle from './resize-handle';

interface CanvasProps {
  elements: CanvasElementData[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  updateElement: (id: string, newStyles?: React.CSSProperties, newProps?: Record<string, any>, newContent?: string) => void;
  moveElement: (draggedId: string, dropZoneId: string) => void;
  addElement: (elementType: CanvasElementData['type'], dropZoneId?: string) => void;
}

const DropIndicator: FC = () => (
    <div className="relative h-1 w-full my-2 bg-primary rounded-full" />
)

interface ResizingState {
    elementId: string;
    handle: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'right' | 'bottom' | 'left';
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
}


const CanvasElementWrapper: FC<{
  id: string;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnter: (id: string) => void;
  onResizeStart: (e: React.MouseEvent, handle: ResizingState['handle']) => void;
}> = ({ id, selectedElement, onSelectElement, children, className, style, onDragStart, onDragEnter, onResizeStart }) => {
  const isSelected = selectedElement === id;
  return (
    <div
      id={id}
      style={style}
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragEnter={() => onDragEnter(id)}
      className={cn(
        'relative cursor-pointer transition-all group',
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:ring-1 hover:ring-primary/50',
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelectElement(id);
      }}
    >
      {children}
      {isSelected && (
          <>
            <ResizeHandle position="top-left" onMouseDown={(e) => onResizeStart(e, 'top-left')} />
            <ResizeHandle position="top" onMouseDown={(e) => onResizeStart(e, 'top')} />
            <ResizeHandle position="top-right" onMouseDown={(e) => onResizeStart(e, 'top-right')} />
            <ResizeHandle position="left" onMouseDown={(e) => onResizeStart(e, 'left')} />
            <ResizeHandle position="right" onMouseDown={(e) => onResizeStart(e, 'right')} />
            <ResizeHandle position="bottom-left" onMouseDown={(e) => onResizeStart(e, 'bottom-left')} />
            <ResizeHandle position="bottom" onMouseDown={(e) => onResizeStart(e, 'bottom')} />
            <ResizeHandle position="bottom-right" onMouseDown={(e) => onResizeStart(e, 'bottom-right')} />
          </>
      )}
    </div>
  );
};


const Canvas: FC<CanvasProps> = ({ elements, selectedElement, onSelectElement, updateElement, moveElement, addElement }) => {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropZoneId, setDropZoneId] = useState<string | null>(null);
    const [resizingState, setResizingState] = useState<ResizingState | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleSaveText = (id: string, newContent: string) => {
        updateElement(id, undefined, undefined, newContent);
    }

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({id, type: 'canvas-element'}));
        setDraggedId(id);
    }
    
    const handleDragStartSidebar = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'sidebar-element', elementType: type }));
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    }
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const data = JSON.parse(e.dataTransfer.getData('application/json'));

        if (data.type === 'canvas-element' && draggedId && dropZoneId) {
            moveElement(draggedId, dropZoneId);
        } else if (data.type === 'sidebar-element') {
            addElement(data.elementType, dropZoneId ?? undefined);
        }
        
        setDraggedId(null);
        setDropZoneId(null);
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
        });

    }, [selectedElement]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingState) return;

        const dx = e.clientX - resizingState.initialX;
        const dy = e.clientY - resizingState.initialY;

        const elToUpdate = elements.find(el => el.id === resizingState.elementId);
        if (!elToUpdate) return;
        
        let newWidth = resizingState.initialWidth;
        let newHeight = resizingState.initialHeight;

        if (resizingState.handle.includes('right')) {
            newWidth = resizingState.initialWidth + dx;
        } else if (resizingState.handle.includes('left')) {
            newWidth = resizingState.initialWidth - dx;
        }

        if (resizingState.handle.includes('bottom')) {
            newHeight = resizingState.initialHeight + dy;
        } else if (resizingState.handle.includes('top')) {
            newHeight = resizingState.initialHeight - dy;
        }

        const newStyles = {
            ...elToUpdate.styles,
            width: `${Math.max(20, newWidth)}px`,
            height: `${Math.max(20, newHeight)}px`,
        };

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
    
    const renderElement = (element: CanvasElementData) => {
        const { id, type, content, styles, props } = element;
        const wrapperProps = {
            id,
            selectedElement,
            onSelectElement,
            style: styles,
            key: id,
            onDragStart: handleDragStart,
            onDragEnter: setDropZoneId,
            onResizeStart: handleResizeStart,
        };

        const elementComponent = (() => {
            switch (type) {
                case 'hero':
                    return (
                        <CanvasElementWrapper {...wrapperProps} className="text-center">
                            <EditableText id={id} initialValue={content || ''} onSave={handleSaveText} style={{fontSize: styles.fontSize, fontWeight: styles.fontWeight}} className="font-headline tracking-tight" />
                        </CanvasElementWrapper>
                    )
                case 'hero-subtitle':
                    return (
                         <CanvasElementWrapper {...wrapperProps} className="text-center">
                            <EditableText id={id} initialValue={content || ''} onSave={handleSaveText} style={{fontSize: styles.fontSize}} className="mx-auto max-w-2xl text-muted-foreground"/>
                        </CanvasElementWrapper>
                    )
                case 'hero-cta':
                     return (
                         <CanvasElementWrapper {...wrapperProps} className="text-center">
                            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">{content}</Button>
                        </CanvasElementWrapper>
                    )
                case 'feature-image':
                    return (
                        <CanvasElementWrapper {...wrapperProps}>
                           {props?.src && <Image src={props.src} alt={props.alt || ''} width={props.width || 1200} height={props.height || 600} className="aspect-[2/1] w-full object-cover" {...props} />}
                        </CanvasElementWrapper>
                    )
                case 'text':
                    return (
                        <CanvasElementWrapper {...wrapperProps}>
                            <EditableText id={id} initialValue={content || ''} onSave={handleSaveText} style={{fontSize: styles.fontSize, textAlign: styles.textAlign}} />
                        </CanvasElementWrapper>
                    );
                case 'button':
                    return (
                        <CanvasElementWrapper {...wrapperProps}>
                            <Button className="w-full h-full">{content}</Button>
                        </CanvasElementWrapper>
                    );
                case 'image':
                     return (
                        <CanvasElementWrapper {...wrapperProps}>
                            {props?.src && <Image src={props.src} alt={props.alt || ''} width={props.width || 200} height={props.height || 100} className="w-full h-full object-cover" {...props} />}
                        </CanvasElementWrapper>
                     );
                default:
                    return null;
            }
        })();

        return (
            <div key={id}>
                {dropZoneId === id && <DropIndicator />}
                {elementComponent}
            </div>
        )

    }
  
  return (
    <div 
        ref={canvasRef}
        className="mx-auto h-full w-full max-w-screen-xl p-4 md:p-8" 
        onClick={() => onSelectElement(null)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnter={() => {
            if (!draggedId) { // Only set drop zone to null if not dragging an internal element
                setDropZoneId(null);
            }
        }}
    >
      <div className="rounded-lg bg-card shadow-lg">
        {elements.map(renderElement)}
        {elements.length === 0 && (
             <div 
                className="flex items-center justify-center h-48 border-2 border-dashed border-muted rounded-lg"
                onDragEnter={() => setDropZoneId('canvas-end')}
            >
                <p className="text-muted-foreground">Drag elements here to start building</p>
                {dropZoneId === 'canvas-end' && <DropIndicator/>}
            </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
