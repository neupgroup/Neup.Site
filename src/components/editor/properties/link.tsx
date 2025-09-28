import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';

interface LinkPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const LinkProperties: FC<LinkPropertiesProps> = ({ element, onUpdate }) => {
    const { properties } = element;
    
    return (
        <>
            <div className="space-y-2">
                <Label>URL (href)</Label>
                <Input 
                    value={properties['link.href'] || '#'}
                    onChange={(e) => onUpdate('link.href', e.target.value)}
                    placeholder="#"
                />
            </div>
        </>
    );
};

export default LinkProperties;
