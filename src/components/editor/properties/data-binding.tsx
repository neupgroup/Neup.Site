
'use client';
import { FC, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import type { CanvasElementData } from '@/schemas/canvas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface DataBindingPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
    onDataBindingUpdate: (bindings: Record<string, string>) => void;
}

const getBindableProperties = (type: CanvasElementData['type']): string[] => {
    switch (type) {
        case 'text':
        case 'heading':
        case 'button':
        case 'label':
            return ['text'];
        case 'image':
            return ['src', 'alt'];
        default:
            return [];
    }
};

const DataBindingProperties: FC<DataBindingPropertiesProps> = ({ element, onDataBindingUpdate }) => {
    const [bindings, setBindings] = useState<Record<string, string>>(element.dataBindings || {});
    const bindableProperties = getBindableProperties(element.type);

    useEffect(() => {
        setBindings(element.dataBindings || {});
    }, [element.dataBindings]);

    const handleBindingChange = (prop: string, path: string) => {
        const newBindings = { ...bindings, [prop]: path };
        setBindings(newBindings);
        onDataBindingUpdate(newBindings);
    };

    const removeBinding = (prop: string) => {
        const newBindings = { ...bindings };
        delete newBindings[prop];
        setBindings(newBindings);
        onDataBindingUpdate(newBindings);
    };
    
    if (bindableProperties.length === 0) {
        return null;
    }
    
    return (
        <AccordionItem value="databinding">
            <AccordionTrigger className="text-sm font-medium">Data Binding</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                 <p className="text-xs text-muted-foreground">Connect element properties to dynamic data sources.</p>
                {bindableProperties.map(prop => (
                    <div key={prop} className="space-y-2">
                        <Label>Bind "{prop}" to Data Path</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={bindings[prop] || ''}
                                onChange={(e) => handleBindingChange(prop, e.target.value)}
                                placeholder="e.g., item.title"
                            />
                             <Button variant="outline" size="icon" onClick={() => removeBinding(prop)} disabled={!bindings[prop]}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                         <p className="text-xs text-muted-foreground">Use dot notation for nested data, e.g., `item.author.name`.</p>
                    </div>
                ))}
            </AccordionContent>
        </AccordionItem>
    );
};

export default DataBindingProperties;
