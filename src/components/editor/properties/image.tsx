import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';

interface ImagePropertiesProps {
    element: CanvasElementData;
    onUpdate: (updateType: 'props', key: string, value: any) => void;
}

const ImageProperties: FC<ImagePropertiesProps> = ({ element, onUpdate }) => {
    const { props } = element;
    
    return (
        <>
            <div className="space-y-2">
                <Label>Source URL</Label>
                <Input 
                    value={props?.src || ''}
                    onChange={(e) => onUpdate('props', 'src', e.target.value)}
                    placeholder="https://example.com/image.png"
                />
            </div>
            <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                    value={props?.alt || ''}
                    onChange={(e) => onUpdate('props', 'alt', e.target.value)}
                    placeholder="Descriptive text for the image"
                />
            </div>
        </>
    );
};

export default ImageProperties;
