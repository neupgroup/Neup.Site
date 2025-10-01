

import { FC, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { CanvasElementData } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

interface ImagePropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
    onDataBindingUpdate: (bindings: Record<string, string>) => void;
}

const ImageProperties: FC<ImagePropertiesProps> = ({ element, onUpdate, onDataBindingUpdate }) => {
    const properties = element.properties || {};
    const [bindings, setBindings] = useState<Record<string, string>>(element.dataBindings || {});
    const bindableProperties = ['src', 'alt'];

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
    
    return (
        <AccordionItem value="image">
            <AccordionTrigger className="px-4 text-sm font-medium">Image</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <div className="space-y-2">
                    <Label>Source URL</Label>
                    <Input 
                        value={properties['src'] || ''}
                        onChange={(e) => onUpdate('src', e.target.value)}
                        placeholder="https://example.com/image.png"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Alt Text</Label>
                    <Input
                        value={properties['alt'] || ''}
                        onChange={(e) => onUpdate('alt', e.target.value)}
                        placeholder="Descriptive text for the image"
                    />
                </div>

                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground pt-2">Data Binding</h4>
                {bindableProperties.map(prop => (
                    <div key={prop} className="space-y-2">
                        <Label>Bind "{prop}" to</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={bindings[prop] || ''}
                                onChange={(e) => handleBindingChange(prop, e.target.value)}
                                placeholder={`e.g., item.${prop}`}
                            />
                             <Button variant="outline" size="icon" onClick={() => removeBinding(prop)} disabled={!bindings[prop]}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </AccordionContent>
        </AccordionItem>
    );
};

export default ImageProperties;
