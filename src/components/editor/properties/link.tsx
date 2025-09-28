import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface LinkPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const LinkProperties: FC<LinkPropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};
    
    return (
        <AccordionItem value="link">
            <AccordionTrigger className="px-4 text-sm font-medium">Link</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <div className="space-y-2">
                    <Label>URL (href)</Label>
                    <Input 
                        value={properties['link.href'] || '#'}
                        onChange={(e) => onUpdate('link.href', e.target.value)}
                        placeholder="#"
                    />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default LinkProperties;
