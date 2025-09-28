import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';

interface ContentPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const ContentProperties: FC<ContentPropertiesProps> = ({ element, onUpdate }) => {
    
    return (
        <>
            <div className="space-y-2">
                <Label>Text</Label>
                <Input 
                    value={element.properties['content.text'] || ''}
                    onChange={(e) => onUpdate('content.text', e.target.value)}
                />
            </div>
        </>
    );
};

export default ContentProperties;
