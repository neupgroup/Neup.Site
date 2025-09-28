import { FC } from 'react';
import { Label } from '@/components/ui/label';
import type { CanvasElementData } from '@/lib/schemas';
import { Textarea } from '@/components/ui/textarea';

interface ContentPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const ContentProperties: FC<ContentPropertiesProps> = ({ element, onUpdate }) => {
    
    return (
        <>
            <div className="space-y-2">
                <Label>Text</Label>
                <Textarea 
                    value={element.properties['content.text'] || ''}
                    onChange={(e) => onUpdate('content.text', e.target.value)}
                    rows={4}
                />
            </div>
        </>
    );
};

export default ContentProperties;
