
import React, { type FC } from 'react';
import { cn } from '@/core/lib/utils';
import { LayoutTemplate } from 'lucide-react';

const DropIndicator: FC<{className?: string}> = ({className}) => (
    <div className={cn(
        "w-full h-16 border-2 border-dashed border-primary rounded-lg flex items-center justify-center text-primary bg-primary/10 my-2 transition-all", 
        className
    )}>
         <LayoutTemplate className="mr-2 h-5 w-5" />
            Drop here
    </div>
);

export default DropIndicator;
