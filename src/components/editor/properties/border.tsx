import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';

interface BorderPropertiesProps {
    element: CanvasElementData;
    onUpdate: (updateType: 'styles', key: string, value: any) => void;
}

const BorderProperties: FC<BorderPropertiesProps> = ({ element, onUpdate }) => {
    const { styles } = element;
    
    return (
        <>
            <div className="space-y-2">
                <Label>Border</Label>
                <Input 
                    value={styles?.border as string || ''}
                    onChange={(e) => onUpdate('styles', 'border', e.target.value)}
                    placeholder="e.g., 1px solid #000"
                />
            </div>
            <div className="space-y-2">
                <Label>Border Radius</Label>
                <Input
                    value={styles?.borderRadius as string || ''}
                    onChange={(e) => onUpdate('styles', 'borderRadius', e.target.value)}
                    placeholder="e.g., 8px"
                />
            </div>
        </>
    );
};

export default BorderProperties;
