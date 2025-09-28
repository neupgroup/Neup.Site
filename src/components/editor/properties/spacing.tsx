import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CanvasElementData } from '@/lib/schemas';

interface SpacingPropertiesProps {
    element: CanvasElementData;
    onUpdate: (updateType: 'styles', key: string, value: any) => void;
}

const SpacingProperties: FC<SpacingPropertiesProps> = ({ element, onUpdate }) => {
    const { styles } = element;
    
    return (
        <>
            <div className="space-y-2">
                <Label>Padding</Label>
                <Input 
                    value={styles?.padding as string || ''}
                    onChange={(e) => onUpdate('styles', 'padding', e.target.value)}
                    placeholder="e.g., 16px or 1rem"
                />
            </div>
            <div className="space-y-2">
                <Label>Margin</Label>
                <Input
                    value={styles?.margin as string || ''}
                    onChange={(e) => onUpdate('styles', 'margin', e.target.value)}
                    placeholder="e.g., 16px or 1rem"
                />
            </div>
        </>
    );
};

export default SpacingProperties;
