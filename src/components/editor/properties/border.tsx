import React, { FC } from 'react';
import type { CanvasElementData } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PropertyInput from './property-input';

interface BorderPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const BorderProperties: FC<BorderPropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};
    
    return (
        <AccordionItem value="borders">
            <AccordionTrigger className="px-4 text-sm font-medium">Borders</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <PropertyInput 
                    label="Border"
                    value={properties['borders.border'] as string || ''}
                    onChange={(v) => onUpdate('borders.border', v)}
                    placeholder="e.g., 1px solid #000"
                    suggestions={['none', '1px solid hsl(var(--border))']}
                />
                <PropertyInput
                    label="Border Radius"
                    value={properties['borders.borderRadius'] as string || ''}
                    onChange={(v) => onUpdate('borders.borderRadius', v)}
                    placeholder="e.g., 8px"
                    suggestions={['0px', 'var(--radius)', '9999px']}
                />
            </AccordionContent>
        </AccordionItem>
    );
};

export default BorderProperties;
