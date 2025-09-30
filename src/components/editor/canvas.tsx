
'use client';

import React, { type FC, useRef, DragEvent } from 'react';
import { cn } from '@/lib/utils';
import type { CanvasElementData } from '@/lib/schemas';

import { useElementResizing } from '@/hooks/useElementResizing';

import CanvasElement from './CanvasElement';
import SectionDropZone from './SectionDropZone';

interface CanvasProps {
  elements: CanvasElementData[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  updateElement: (id:string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragOver: (e: DragEvent, parentId?: string | null, elementId?: string | null) => void;
  onDrop: (e: DragEvent, parentId?: string, elementId?: string) => void;
  draggedId: string | null;
}

const Canvas: FC<CanvasProps> = ({ 
    elements, 
    selectedElement, 
    onSelectElement, 
    updateElement,
    onDragStart,
    onDragOver,
    onDrop,
    draggedId
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const isDraggingSection = !!(draggedId && elements.find(el => el.id === draggedId && el.type === 'section'));
    
    const { resizingState, handleResizeStart } = useElementResizing({
        selectedElement,
        elements,
        updateElement,
        canvasRef,
    });
  
  return (
    <div 
        className="mx-auto h-full w-full max-w-screen-xl py-10 px-4 md:px-8" 
        onClick={() => onSelectElement(null)}
        onDragOver={(e) => onDragOver(e, null, null)}
        onDrop={(e) => onDrop(e)}
    >
      <div 
        ref={canvasRef}
        className={cn(
            "rounded-lg bg-card shadow-lg relative mb-48",
             {'is-dragging': !!draggedId, 'is-dragging-section': isDraggingSection}
        )}
      >
        <SectionDropZone position="top" onDrop={(e) => onDrop(e)} isDraggingSection={isDraggingSection} />

        {elements.map(el => (
            <CanvasElement 
                key={el.id}
                element={el}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
                updateElement={updateElement}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                resizingState={resizingState}
                onResizeStart={handleResizeStart}
                draggedId={draggedId}
            />
        ))}

        {elements.length === 0 && !draggedId && (
             <div 
                className="flex items-center justify-center h-48"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(e) }}
            >
                <div className="w-full h-full border-2 border-dashed border-muted rounded-lg flex items-center justify-center p-4">
                    <p className="text-muted-foreground text-center">Drag elements here to start building your page.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
