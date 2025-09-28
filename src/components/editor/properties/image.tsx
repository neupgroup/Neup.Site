import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';

interface ImagePropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const ImageProperties: FC<ImagePropertiesProps> = ({ element, onUpdate }) => {
    const { properties } = element;
    
    return (
        <>
            <div className="space-y-2">
                <Label>Source URL</Label>
                <Input 
                    value={properties['image.src'] || ''}
                    onChange={(e) => onUpdate('image.src', e.target.value)}
                    placeholder="https://example.com/image.png"
                />
            </div>
            <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                    value={properties['image.alt'] || ''}
                    onChange={(e) => onUpdate('image.alt', e.target.value)}
                    placeholder="Descriptive text for the image"
                />
            </div>
        </>
    );
};

export default ImageProperties;
