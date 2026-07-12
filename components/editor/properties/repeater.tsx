
'use client';
import { FC, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import type { CanvasElementData } from '@/services/canvas/type';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface RepeaterPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const RepeaterProperties: FC<RepeaterPropertiesProps> = ({ element, onUpdate }) => {
    const repeater = element.repeater || { enabled: false, dataPath: '' };

    const handleRepeaterToggle = (enabled: boolean) => {
        onUpdate('repeater', { ...repeater, enabled });
    };

    const handleDataPathChange = (dataPath: string) => {
        onUpdate('repeater', { ...repeater, dataPath });
    };
    
    return (
        <AccordionItem value="repeater">
            <AccordionTrigger className="text-sm font-medium">Repeater</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label>Repeat this element</Label>
                        <p className="text-xs text-muted-foreground">
                            Loop over a data array and repeat this element for each item.
                        </p>
                    </div>
                    <Switch
                        checked={repeater.enabled}
                        onCheckedChange={handleRepeaterToggle}
                    />
                </div>
                {repeater.enabled && (
                    <div className="space-y-2">
                        <Label>Data Path</Label>
                        <Input 
                            value={repeater.dataPath}
                            onChange={(e) => handleDataPathChange(e.target.value)}
                            placeholder="e.g., products"
                        />
                         <p className="text-xs text-muted-foreground">The key of the array in your data source to loop over.</p>
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
};

export default RepeaterProperties;
