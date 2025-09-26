import { type FC, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CanvasElementData } from '@/app/page';
import { EditableText } from './editable-text';

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

const CanvasElementWrapper: FC<{
  id: string;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnter: (id: string) => void;
}> = ({ id, selectedElement, onSelectElement, children, className, style, onDragStart, onDragEnter }) => {
  const isSelected = selectedElement === id;
  return (
    <div
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
    </div>
  );
};


const Canvas: FC<CanvasProps> = ({ elements, selectedElement, onSelectElement, updateElement, moveElement, addElement }) => {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropZoneId, setDropZoneId] = useState<string | null>(null);

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
    
    const renderElement = (element: CanvasElementData) => {
        const { id, type, content, styles, props } = element;
        const wrapperProps = {
            id,
            selectedElement,
            onSelectElement,
            style: styles,
            key: id,
            onDragStart: handleDragStart,
            onDragEnter: setDropZoneId
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
                            <Button>{content}</Button>
                        </CanvasElementWrapper>
                    );
                case 'image':
                     return (
                        <CanvasElementWrapper {...wrapperProps}>
                            {props?.src && <Image src={props.src} alt={props.alt || ''} width={props.width || 200} height={props.height || 100} {...props} />}
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
