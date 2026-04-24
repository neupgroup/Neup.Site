
'use client';
import { FC } from 'react';
import { Label } from '@/components/ui/label';
import type { CanvasElementData } from '@/schemas/canvas';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ContentPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const ContentProperties: FC<ContentPropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
        }
    }
    
    return (
        <AccordionItem value="content">
            <AccordionTrigger className="text-sm font-medium">Content</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label>Text</Label>
                    <Textarea 
                        value={properties['text'] || ''}
                        onChange={(e) => onUpdate('text', e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={4}
                    />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default ContentProperties;
