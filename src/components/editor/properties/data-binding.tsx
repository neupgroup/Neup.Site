
import { FC, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { CanvasElementData } from '@/lib/schemas';
import { Plus, Trash2 } from 'lucide-react';

interface DataBindingPropertiesProps {
    element: CanvasElementData;
    onUpdate: (bindings: Record<string, string>) => void;
}

const getBindableProperties = (type: CanvasElementData['type']) => {
    switch (type) {
        case 'text':
        case 'heading':
        case 'button':
            return ['text'];
        case 'image':
            return ['src', 'alt'];
        case 'input':
        case 'textarea':
            return ['value'];
        default:
            return [];
    }
};

const DataBindingProperties: FC<DataBindingPropertiesProps> = ({ element, onUpdate }) => {
    const [bindings, setBindings] = useState<Record<string, string>>(element.dataBindings || {});

    useEffect(() => {
        setBindings(element.dataBindings || {});
    }, [element.dataBindings]);

    const handleBindingChange = (prop: string, path: string) => {
        const newBindings = { ...bindings, [prop]: path };
        setBindings(newBindings);
        onUpdate(newBindings);
    };

    const removeBinding = (prop: string) => {
        const newBindings = { ...bindings };
        delete newBindings[prop];
        setBindings(newBindings);
        onUpdate(newBindings);
    };

    const bindableProperties = getBindableProperties(element.type);

    if (bindableProperties.length === 0) {
        return null; // Don't render if there's nothing to bind
    }

    return (
        <AccordionItem value="data-binding">
            <AccordionTrigger className="px-4 text-sm font-medium">Data Binding</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                {bindableProperties.map(prop => (
                    <div key={prop} className="space-y-2">
                        <Label>Bind "{prop}" to</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={bindings[prop] || ''}
                                onChange={(e) => handleBindingChange(prop, e.target.value)}
                                placeholder="e.g., item.title"
                            />
                             <Button variant="ghost" size="icon" onClick={() => removeBinding(prop)} disabled={!bindings[prop]}>
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
