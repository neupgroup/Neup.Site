import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';

interface LinkPropertiesProps {
    element: CanvasElementData;
    onUpdate: (updateType: 'props', key: string, value: any) => void;
}

const LinkProperties: FC<LinkPropertiesProps> = ({ element, onUpdate }) => {
    const { props } = element;
    
    return (
        <>
            <div className="space-y-2">
                <Label>URL (href)</Label>
                <Input 
                    value={props?.href || '#'}
                    onChange={(e) => onUpdate('props', 'href', e.target.value)}
                    placeholder="#"
                />
            </div>
        </>
    );
};

export default LinkProperties;
