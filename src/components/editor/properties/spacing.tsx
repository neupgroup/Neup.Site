import React, { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SpacingPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const SpacingProperties: FC<SpacingPropertiesProps> = ({ element, onUpdate }) => {
    const { properties } = element;
    
    return (
        <AccordionItem value="spacing">
            <AccordionTrigger className="px-4 text-sm font-medium">Spacing</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <div className="space-y-2">
                    <Label>Padding</Label>
                    <Input 
                        value={properties['spacing.padding'] as string || ''}
                        onChange={(e) => onUpdate('spacing.padding', e.target.value)}
                        placeholder="e.g., 16px or 1rem"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Margin</Label>
                    <Input
                        value={properties['spacing.margin'] as string || ''}
                        onChange={(e) => onUpdate('spacing.margin', e.target.value)}
                        placeholder="e.g., 16px or 1rem"
                    />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default SpacingProperties;
