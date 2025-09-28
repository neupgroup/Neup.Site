
'use client';

import { useState, useRef, DragEvent } from 'react';
import type { CanvasElementData } from '@/lib/schemas';

interface DragAndDropProps {
  elements: CanvasElementData[];
  moveElement: (draggedId: string, dropZoneId: string, parentId?: string) => void;
  addElement: (elementType: CanvasElementData['type'], dropZoneId?: string, parentId?: string) => void;
  addGeneratedElement: (element: CanvasElementData, dropZoneId?: string, parentId?: string) => void;
}

export const useDragAndDrop = ({ moveElement, addElement, addGeneratedElement, elements }: DragAndDropProps) => {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [isDraggingSection, setIsDraggingSection] = useState(false);
    const [dropZone, setDropZone] = useState<{parentId: string | null, elementId: string | null}>({parentId: null, elementId: null});
    const dragCounter = useRef(0);

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

    const handleDragStart = (e: DragEvent, id: string) => {
        const el = findElementRecursive(elements, id)?.element;
        const dragType = el?.type === 'section' ? 'section' : 'canvas-element';
        
        if (dragType === 'section') {
            setIsDraggingSection(true);
        }

        e.dataTransfer.setData('application/json', JSON.stringify({id, type: dragType}));
        e.stopPropagation();
        setDraggedId(id);
    };

    const handleDragOver = (e: DragEvent, parentId: string | null = null) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        const closestElement = target.closest('[draggable="true"]');
        let elementId = closestElement ? closestElement.id : null;

        if (elementId === draggedId) {
          elementId = null;
        }
        
        setDropZone({ parentId, elementId });
    };

    const handleDrop = async (e: DragEvent, parentId?: string, dropZoneId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        const dataStr = e.dataTransfer.getData('application/json');
        
        // Reset drag state
        setDraggedId(null);
        setIsDraggingSection(false);
        setDropZone({parentId: null, elementId: null});
        dragCounter.current = 0;
        
        if (!dataStr) return;

        try {
            const data = JSON.parse(dataStr);
            const targetId = dropZone.elementId || dropZoneId;
    
            if (data.type === 'canvas-element' && draggedId) {
                moveElement(draggedId, targetId!, parentId);
            } else if (data.type === 'sidebar-element' || data.type === 'section') {
                addElement(data.elementType, targetId, parentId);
            } else if (data.type === 'template-element') {
                addGeneratedElement(data.element, targetId, parentId);
            }
        } catch (error) {
            console.error("Failed to parse drag data", error);
        }
    };

    const handleDragEnter = (e: DragEvent<Element>, id?: string, parentId: string | null = null) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;

        if (dragCounter.current === 1) { // First enter
             try {
                const dataStr = e.dataTransfer.getData('application/json');
                if (dataStr) {
                    const data = JSON.parse(dataStr);
                    const elType = data.elementType || findElementRecursive(elements, data.id)?.element.type;
                    if (elType === 'section') {
                        setIsDraggingSection(true);
                    }
                     setDraggedId(data.id || data.type);
                }
            } catch (error) {
                // Ignore if data is not available yet
            }
        }

        if (id) {
            setDropZone({parentId: parentId, elementId: id});
        }
    };

    const handleDragLeave = (e: DragEvent<Element>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDraggedId(null);
            setIsDraggingSection(false);
            setDropZone({parentId: null, elementId: null});
        }
    };

    return {
        draggedId,
        isDraggingSection,
        dropZone,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnter,
        handleDragLeave,
    };
};
