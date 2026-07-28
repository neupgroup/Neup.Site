
'use client';

import React, { FC, useEffect, useState } from 'react';
import { cn } from '@/core/utils';
import type { CanvasElementData } from '@/services/canvas/type';

interface HighlightBoxProps {
  hoveredElementId: string | null;
  selectedElementId: string | null; // New prop for selected element
  elements: CanvasElementData[];
  canvasRef: React.RefObject<HTMLDivElement>;
}

const HighlightBox: FC<HighlightBoxProps> = ({ hoveredElementId, selectedElementId, elements, canvasRef }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [elementInfo, setElementInfo] = useState<{ id: string; type: string } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const findElementRecursive = (id: string, els: CanvasElementData[]): CanvasElementData | undefined => {
    for (const el of els) {
      if (el.id === id) return el;
      if (el.children) {
        const found = findElementRecursive(id, el.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  useEffect(() => {
    const elementToHighlightId = hoveredElementId || selectedElementId;
    
    if (elementToHighlightId && canvasRef.current) {
      const element = document.getElementById(elementToHighlightId);
      const foundElementData = findElementRecursive(elementToHighlightId, elements);

      if (element && foundElementData) {
        const elementRect = element.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();

        setPosition({
          top: elementRect.top - canvasRect.top + canvasRef.current.scrollTop,
          left: elementRect.left - canvasRect.left,
          width: elementRect.width,
          height: elementRect.height,
        });
        setElementInfo({ id: foundElementData.id, type: foundElementData.type });
        setIsHovered(elementToHighlightId === hoveredElementId);
        setIsSelected(elementToHighlightId === selectedElementId);
      } else {
        setElementInfo(null);
      }
    } else {
      setElementInfo(null);
    }
  }, [hoveredElementId, selectedElementId, elements, canvasRef]);

  if (!elementInfo) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-20 transition-all duration-75 ease-out',
        // Hover style takes precedence
        isHovered ? 'border-2 border-accent bg-accent/10' : '',
        // Selected style if not hovered
        !isHovered && isSelected ? 'border-2 border-primary bg-primary/10' : ''
      )}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
      }}
    >
      <div className={cn(
        "absolute -top-6 left-0 flex items-center gap-1 rounded-t-md px-2 py-0.5 text-xs text-white",
        isHovered ? 'bg-accent' : '',
        !isHovered && isSelected ? 'bg-primary' : ''
      )}>
        <span className="font-semibold">{elementInfo.id}</span>
        <span className="opacity-70">({elementInfo.type})</span>
      </div>
    </div>
  );
};

export default HighlightBox;
