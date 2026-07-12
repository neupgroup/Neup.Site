
import React, { FC } from 'react';
import type { CanvasElementData } from '@/services/canvas/type';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PropertyInput from './property-input';

interface ShadowPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const shadowSuggestions = {
    'none': 'none',
    'light': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'light-mild': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'mild': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'dark': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

const ShadowProperties: FC<ShadowPropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};

    const handleSuggestionClick = (value: string) => {
        onUpdate('boxShadow', value);
    };
    
    return (
        <AccordionItem value="shadows">
            <AccordionTrigger className="text-sm font-medium">Shadow</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <PropertyInput 
                    label="Box Shadow"
                    value={properties['boxShadow'] as string || ''}
                    onChange={(v) => onUpdate('boxShadow', v)}
                    placeholder="e.g., 0 10px 15px -3px rgb(0 0 0 / 0.1)"
                    suggestions={Object.values(shadowSuggestions)}
                />
            </AccordionContent>
        </AccordionItem>
    );
};

export default ShadowProperties;
