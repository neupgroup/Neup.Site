'use client';

import React, { type FC, useState } from 'react';
import { cn } from '@/core/lib/utils';
import { LayoutTemplate } from 'lucide-react';

interface SectionDropZoneProps {
    position: 'top' | 'bottom';
    onDrop: (e: React.DragEvent) => void;
    isDraggingSection: boolean;
}

const SectionDropZone: FC<SectionDropZoneProps> = ({ position, onDrop, isDraggingSection }) => {
    const [isOver, setIsOver] = useState(false);
    
    return (
        <div
            onDragEnter={() => setIsOver(true)}
            onDragLeave={() => setIsOver(false)}
            onDragOver={(e) => {
                e.preventDefault();
                setIsOver(true);
            }}
            onDrop={(e) => {
                onDrop(e);
                setIsOver(false);
            }}
            className={cn(
                "w-full h-2 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground my-4 transition-all",
                isDraggingSection ? 'opacity-100' : 'opacity-0 h-0 my-0 !border-0',
                isOver && 'border-primary bg-primary/10'
            )}
        >
            {/* Removed LayoutTemplate icon and "Drop section here" text */}
        </div>
    );
};

export default SectionDropZone;