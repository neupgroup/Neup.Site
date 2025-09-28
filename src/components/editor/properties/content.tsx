import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';

interface ContentPropertiesProps {
    element: CanvasElementData;
    onUpdate: (updateType: 'content', key: string, value: any) => void;
}

const ContentProperties: FC<ContentPropertiesProps> = ({ element, onUpdate }) => {
    
    return (
        <>
            <div className="space-y-2">
                <Label>Text</Label>
                <Input 
                    value={element.content || ''}
                    onChange={(e) => onUpdate('content', 'content', e.target.value)}
                />
            </div>
        </>
    );
};

export default ContentProperties;
