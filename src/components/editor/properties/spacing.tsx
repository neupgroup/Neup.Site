
import React, { FC } from 'react';
import type { CanvasElementData } from '@/schemas/canvas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PropertyInput from './property-input';

interface SpacingPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const SpacingProperties: FC<SpacingPropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};
    
    return (
        <AccordionItem value="spacing">
            <AccordionTrigger className="text-sm font-medium">Spacing</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <PropertyInput 
                    label="Padding"
                    value={properties['padding'] as string || ''}
                    onChange={(v) => onUpdate('padding', v)}
                    placeholder="e.g., 16px or 1rem"
                    suggestions={['0px', '10px', '20px']}
                />
                <PropertyInput
                    label="Margin"
                    value={properties['margin'] as string || ''}
                    onChange={(v) => onUpdate('margin', v)}
                    placeholder="e.g., 16px or 1rem"
                    suggestions={['0px', '10px', '20px', '0 auto']}
                />
            </AccordionContent>
        </AccordionItem>
    );
};

export default SpacingProperties;
