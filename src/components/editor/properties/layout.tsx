import React, { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CanvasElementData } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PropertyInput from './property-input';

interface LayoutPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const LayoutProperties: FC<LayoutPropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};
    
    return (
        <AccordionItem value="layout">
            <AccordionTrigger className="px-4 text-sm font-medium">Layout</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <div className="space-y-2">
                    <Label>Display</Label>
                    <Select value={properties['display'] as string || 'block'} onValueChange={(v) => onUpdate('display', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Display" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="block">Block</SelectItem>
                            <SelectItem value="inline-block">Inline Block</SelectItem>
                            <SelectItem value="flex">Flex</SelectItem>
                            <SelectItem value="grid">Grid</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <PropertyInput
                  label="Width"
                  value={properties['width'] as string || ''}
                  onChange={(v) => onUpdate('width', v)}
                  placeholder="e.g., 100px or 100%"
                  suggestions={['auto', '100%', '50%']}
                />
                <PropertyInput
                  label="Height"
                  value={properties['height'] as string || ''}
                  onChange={(v) => onUpdate('height', v)}
                  placeholder="e.g., 100px"
                  suggestions={['auto']}
                />
            </AccordionContent>
        </AccordionItem>
    );
};

export default LayoutProperties;
