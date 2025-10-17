'use client';

import { useState, useCallback, useEffect, MouseEvent } from 'react';
import type { CanvasElementData } from '@/schemas/canvas';

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

interface UseElementResizingProps {
  selectedElement: string | null;
  elements: CanvasElementData[];
  updateElement: (id: string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export const useElementResizing = ({ selectedElement, elements, updateElement, canvasRef }: UseElementResizingProps) => {
    const [resizingState, setResizingState] = useState<ResizingState | null>(null);

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

        const elData = findElementRecursive(elements, selectedElement)?.element;
        if (elData?.properties?.display === 'inline') return;

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

    }, [selectedElement, elements]);

    const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
        if (!resizingState || !canvasRef.current) return;
        
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
          newProperties['width'] = `${Math.max(20, newWidth)}px`;
        }
        if (newHeight) {
          newProperties['height'] = `${Math.max(20, newHeight)}px`;
        }


        updateElement(resizingState.elementId, newProperties, false);

    }, [resizingState, elements, updateElement, canvasRef]);

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

    return {
        resizingState,
        handleResizeStart
    };
};