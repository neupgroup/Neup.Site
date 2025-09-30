
'use client';

import React, { type FC, useState } from 'react';
import { cn } from '@/lib/utils';
import { LayoutTemplate } from 'lucide-react';

interface SectionDropZoneProps {
    position: 'top' | 'bottom';
    onDrop: (e: React.DragEvent) => void;
    isDraggingSection: boolean;
}

const SectionDropZone: FC<SectionDropZoneProps> = ({ position, onDrop, isDraggingSection }) => {
    const [isOver, setIsOver] = useState(false);
    
    // Always render the drop zone, but control its visibility and layout with CSS.
    // This prevents layout shifts when it appears.
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
                "w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground my-4 transition-all",
                // Use opacity and height to show/hide without causing layout shifts
                isDraggingSection ? 'opacity-100' : 'opacity-0 h-0 my-0 !border-0',
                isOver && 'border-primary bg-primary/10'
            )}
        >
            <LayoutTemplate className="mr-2 h-5 w-5" />
            Drop section here
        </div>
    );
};

export default SectionDropZone;
