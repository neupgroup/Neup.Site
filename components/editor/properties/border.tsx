
import React, { FC } from 'react';
import type { CanvasElementData } from '@/schemas/canvas';
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
            <AccordionTrigger className="text-sm font-medium">Borders</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <PropertyInput 
                    label="Border"
                    value={properties['border'] as string || ''}
                    onChange={(v) => onUpdate('border', v)}
                    placeholder="e.g., 1px solid #000"
                    suggestions={['none', '1px solid hsl(var(--border))']}
                />
                <PropertyInput
                    label="Border Radius"
                    value={properties['borderRadius'] as string || ''}
                    onChange={(v) => onUpdate('borderRadius', v)}
                    placeholder="e.g., 8px"
                    suggestions={['0px', 'var(--radius)', '9999px']}
                />
            </AccordionContent>
        </AccordionItem>
    );
};

export default BorderProperties;
