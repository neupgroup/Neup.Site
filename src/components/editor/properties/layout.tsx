import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CanvasElementData } from '@/lib/schemas';

interface LayoutPropertiesProps {
    element: CanvasElementData;
    onUpdate: (updateType: 'styles', key: string, value: any) => void;
}

const LayoutProperties: FC<LayoutPropertiesProps> = ({ element, onUpdate }) => {
    const { styles } = element;
    
    return (
        <>
            <div className="space-y-2">
                <Label>Display</Label>
                <Select value={styles?.display as string || 'block'} onValueChange={(v) => onUpdate('styles', 'display', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Display" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="block">Block</SelectItem>
                        <SelectItem value="inline-block">Inline Block</SelectItem>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Width</Label>
                <Input
                    value={styles?.width as string || ''}
                    onChange={(e) => onUpdate('styles', 'width', e.target.value)}
                    placeholder="e.g., 100px or 100%"
                />
            </div>
            <div className="space-y-2">
                <Label>Height</Label>
                <Input
                    value={styles?.height as string || ''}
                    onChange={(e) => onUpdate('styles', 'height', e.target.value)}
                    placeholder="e.g., 100px"
                />
            </div>
        </>
    );
};

export default LayoutProperties;
