'use client';

import React, { type FC, useRef, DragEvent, Fragment } from 'react';
import { cn } from '@/lib/utils';
import type { CanvasElementData } from '@/schemas/canvas';

import { useElementResizing } from '@/hooks/useElementResizing';

import CanvasElement from './CanvasElement';
import SectionDropZone from './SectionDropZone';
// Removed HighlightBox import

interface CanvasProps {
  elements: CanvasElementData[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  updateElement: (id:string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragOver: (e: DragEvent, parentId?: string | null, elementId?: string | null) => void;
  onDrop: (e: DragEvent, parentId?: string, elementId?: string) => void;
  draggedId: string | null;
  hoveredElementId: string | null;
  setHoveredElementId: (id: string | null) => void;
}

const Canvas: FC<CanvasProps> = ({ 
    elements, 
    selectedElement, 
    onSelectElement, 
    updateElement,
    onDragStart,
    onDragOver,
    onDrop,
    draggedId,
    hoveredElementId,
    setHoveredElementId,
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
        onClick={() => onSelectElement(null)} // Clear selection when clicking canvas background
        onDragOver={(e) => onDragOver(e, null, null)}
        onDrop={(e) => onDrop(e)}
        onMouseLeave={() => setHoveredElementId(null)}
    >
      <div 
        ref={canvasRef}
        className={cn(
            "rounded-lg bg-card relative mb-48 border-2 border-border min-h-[150vh]",
             {'is-dragging': !!draggedId, 'is-dragging-section': isDraggingSection}
        )}
      >
        {elements.map(el => (
            <Fragment key={`fragment-${el.id}`}>
                <SectionDropZone 
                    position="top" 
                    onDrop={(e) => onDrop(e, undefined, el.id)} 
                    isDraggingSection={isDraggingSection} 
                />
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
                    setHoveredElementId={setHoveredElementId}
                />
            </Fragment>
        ))}

        <SectionDropZone 
            position="bottom" 
            onDrop={(e) => onDrop(e)} 
            isDraggingSection={isDraggingSection} 
        />


        {elements.length === 0 && (
             <div 
                className="flex items-center justify-center h-48"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(e) }}
            >
              {draggedId ? (
                 <div className="w-full h-2 border-2 border-dashed border-primary rounded-lg flex items-center justify-center text-primary bg-primary/10 my-2 transition-all p-4 mx-4">
                    {/* Removed text content */}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                    <p className="text-muted-foreground text-center">Drag elements here to start building your page.</p>
                </div>
              )}
            </div>
        )}
        {/* HighlightBox is now rendered in editor.tsx */}
      </div>
    </div>
  );
};

export default Canvas;