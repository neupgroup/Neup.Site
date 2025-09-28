
import React, { type FC } from 'react';
import { cn } from '@/lib/utils';

const DropIndicator: FC<{className?: string}> = ({className}) => (
    <div className={cn("relative h-1 w-full my-2 bg-primary rounded-full transition-all duration-200", className)} />
);

export default DropIndicator;
