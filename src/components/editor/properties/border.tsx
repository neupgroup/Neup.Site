import React, { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface BorderPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const BorderProperties: FC<BorderPropertiesProps> = ({ element, onUpdate }) => {
    const { properties } = element;
    
    return (
        <AccordionItem value="borders">
            <AccordionTrigger className="px-4 text-sm font-medium">Borders</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <div className="space-y-2">
                    <Label>Border</Label>
                    <Input 
                        value={properties['borders.border'] as string || ''}
                        onChange={(e) => onUpdate('borders.border', e.target.value)}
                        placeholder="e.g., 1px solid #000"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Border Radius</Label>
                    <Input
                        value={properties['borders.borderRadius'] as string || ''}
                        onChange={(e) => onUpdate('borders.borderRadius', e.target.value)}
                        placeholder="e.g., 8px"
                    />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default BorderProperties;
