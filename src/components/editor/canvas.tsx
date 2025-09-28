'use client';

import React, { type FC, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { CanvasElementData } from '@/lib/schemas';

import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useElementResizing } from '@/hooks/useElementResizing';

import CanvasElement from './CanvasElement';
import SectionDropZone from './SectionDropZone';

interface CanvasProps {
  elements: CanvasElementData[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  updateElement: (id:string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  moveElement: (draggedId: string, dropZoneId: string, parentId?: string) => void;
  addElement: (elementType: CanvasElementData['type'], dropZoneId?: string, parentId?: string) => void;
  addGeneratedElement: (element: CanvasElementData, dropZoneId?: string, parentId?: string) => void;
}

const Canvas: FC<CanvasProps> = ({ 
    elements, 
    selectedElement, 
    onSelectElement, 
    updateElement, 
    moveElement, 
    addElement, 
    addGeneratedElement 
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    
    const {
        draggedId,
        isDraggingSection,
        dropZone,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnter,
        handleDragLeave,
    } = useDragAndDrop({ moveElement, addElement, addGeneratedElement, elements });

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
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
        onDragEnter={(e) => handleDragEnter(e)}
        onDragLeave={(e) => handleDragLeave(e)}
    >
      <div 
        ref={canvasRef}
        className={cn(
            "rounded-lg bg-card shadow-lg relative mb-32",
            { 'is-dragging': !!draggedId && !isDraggingSection },
            { 'is-dragging-section': isDraggingSection }
        )}
      >
        <SectionDropZone 
            position="top" 
            onDrop={(e) => handleDrop(e, undefined, elements[0]?.id)} 
            isDraggingSection={isDraggingSection}
        />

        {elements.map(el => (
            <CanvasElement 
                key={el.id}
                element={el}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
                updateElement={updateElement}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                dropZone={dropZone}
                draggedId={draggedId}
                resizingState={resizingState}
                onResizeStart={handleResizeStart}
            />
        ))}

        {elements.length === 0 && (
             <div 
                className="flex items-center justify-center h-48"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); handleDragOver(e) }}
            >
                <div className="w-full h-full border-2 border-dashed border-muted rounded-lg flex items-center justify-center p-4">
                    <p className="text-muted-foreground text-center">Drag elements here to start building your page.</p>
                </div>
            </div>
        )}

         <SectionDropZone 
            position="bottom" 
            onDrop={(e) => handleDrop(e, undefined, undefined)}
            isDraggingSection={isDraggingSection}
        />
      </div>
    </div>
  );
};

export default Canvas;
