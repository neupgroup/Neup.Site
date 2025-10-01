
import { FC, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import type { CanvasElementData } from '@/lib/schemas';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ContentPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
    onDataBindingUpdate: (bindings: Record<string, string>) => void;
}

const getBindableProperties = (type: CanvasElementData['type']) => {
    switch (type) {
        case 'text':
        case 'heading':
        case 'button':
        case 'label':
            return ['text'];
        default:
            return [];
    }
};


const ContentProperties: FC<ContentPropertiesProps> = ({ element, onUpdate, onDataBindingUpdate }) => {
    const properties = element.properties || {};
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
        }
    }
    
    return (
        <AccordionItem value="content">
            <AccordionTrigger className="px-4 text-sm font-medium">Content</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <div className="space-y-2">
                    <Label>Text</Label>
                    <Textarea 
                        value={properties['text'] || ''}
                        onChange={(e) => onUpdate('text', e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={4}
                    />
                </div>
                {bindableProperties.length > 0 && <Separator />}
                {bindableProperties.map(prop => (
                    <div key={prop} className="space-y-2">
                        <Label>Bind "{prop}" to Data</Label>
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

export default ContentProperties;
