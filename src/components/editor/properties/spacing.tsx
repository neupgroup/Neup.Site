import React, { FC } from 'react';
import type { CanvasElementData } from '@/lib/schemas';
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
            <AccordionTrigger className="px-4 text-sm font-medium">Spacing</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <PropertyInput 
                    label="Padding"
                    value={properties['spacing.padding'] as string || ''}
                    onChange={(v) => onUpdate('spacing.padding', v)}
                    placeholder="e.g., 16px or 1rem"
                    suggestions={['0px', '10px', '20px']}
                />
                <PropertyInput
                    label="Margin"
                    value={properties['spacing.margin'] as string || ''}
                    onChange={(v) => onUpdate('spacing.margin', v)}
                    placeholder="e.g., 16px or 1rem"
                    suggestions={['0px', '10px', '20px', '0 auto']}
                />
            </AccordionContent>
        </AccordionItem>
    );
};

export default SpacingProperties;
