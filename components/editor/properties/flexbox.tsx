
import React, { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CanvasElementData } from '@/services/canvas/type';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FlexboxPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const FlexboxProperties: FC<FlexboxPropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};
    
    return (
        <AccordionItem value="flexbox">
            <AccordionTrigger className="text-sm font-medium">Flexbox</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select value={properties['flexDirection'] as string || 'row'} onValueChange={(v) => onUpdate('flexDirection', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Direction" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="row">Row</SelectItem>
                            <SelectItem value="column">Column</SelectItem>
                            <SelectItem value="row-reverse">Row Reverse</SelectItem>
                            <SelectItem value="column-reverse">Column Reverse</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Justify Content</Label>
                    <Select value={properties['justifyContent'] as string || 'flex-start'} onValueChange={(v) => onUpdate('justifyContent', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Justify Content" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="flex-start">Flex Start</SelectItem>
                            <SelectItem value="flex-end">Flex End</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="space-between">Space Between</SelectItem>
                            <SelectItem value="space-around">Space Around</SelectItem>
                            <SelectItem value="space-evenly">Space Evenly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Align Items</Label>
                    <Select value={properties['alignItems'] as string || 'stretch'} onValueChange={(v) => onUpdate('alignItems', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Align Items" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="stretch">Stretch</SelectItem>
                            <SelectItem value="flex-start">Flex Start</SelectItem>
                            <SelectItem value="flex-end">Flex End</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="baseline">Baseline</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Wrap</Label>
                    <Select value={properties['flexWrap'] as string || 'nowrap'} onValueChange={(v) => onUpdate('flexWrap', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Wrap" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="nowrap">No Wrap</SelectItem>
                            <SelectItem value="wrap">Wrap</SelectItem>
                            <SelectItem value="wrap-reverse">Wrap Reverse</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default FlexboxProperties;
