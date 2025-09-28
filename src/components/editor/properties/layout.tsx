import React, { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CanvasElementData } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface LayoutPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const LayoutProperties: FC<LayoutPropertiesProps> = ({ element, onUpdate }) => {
    const { properties } = element;
    
    return (
        <AccordionItem value="layout">
            <AccordionTrigger className="px-4 text-sm font-medium">Layout</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <div className="space-y-2">
                    <Label>Display</Label>
                    <Select value={properties['layout.display'] as string || 'block'} onValueChange={(v) => onUpdate('layout.display', v)}>
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
                <div className="space-y-2">
                    <Label>Width</Label>
                    <Input
                        value={properties['layout.width'] as string || ''}
                        onChange={(e) => onUpdate('layout.width', e.target.value)}
                        placeholder="e.g., 100px or 100%"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Height</Label>
                    <Input
                        value={properties['layout.height'] as string || ''}
                        onChange={(e) => onUpdate('layout.height', e.target.value)}
                        placeholder="e.g., 100px"
                    />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default LayoutProperties;
