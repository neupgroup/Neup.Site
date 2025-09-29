import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ImagePropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const ImageProperties: FC<ImagePropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};
    
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
            </AccordionContent>
        </AccordionItem>
    );
};

export default ImageProperties;
