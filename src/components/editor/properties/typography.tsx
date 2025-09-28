import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import type { CanvasElementData } from '@/lib/schemas';

interface TypographyPropertiesProps {
    element: CanvasElementData;
    onUpdate: (updateType: 'styles', key: string, value: any) => void;
}

const TypographyProperties: FC<TypographyPropertiesProps> = ({ element, onUpdate }) => {
    const { styles } = element;
    const colorInputRef = React.createRef<HTMLInputElement>();
    
    return (
        <>
            <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        value={styles?.color as string || ''} 
                        onChange={(e) => onUpdate('styles', 'color', e.target.value)} 
                        placeholder="#000000" 
                    />
                    <Button variant="outline" size="icon" onClick={() => colorInputRef.current?.click()}>
                        🎨
                        <input
                            ref={colorInputRef}
                            type="color"
                            value={typeof styles?.color === 'string' ? styles.color : '#000000'}
                            onChange={(e) => onUpdate('styles', 'color', e.target.value)}
                            className="absolute h-0 w-0 opacity-0"
                        />
                    </Button>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Font Size</Label>
                <Input
                    value={styles?.fontSize as string || ''}
                    onChange={(e) => onUpdate('styles', 'fontSize', e.target.value)}
                    placeholder="e.g., 16px"
                />
            </div>
            <div className="space-y-2">
                <Label>Font Weight</Label>
                <Select value={styles?.fontWeight as string || 'normal'} onValueChange={(v) => onUpdate('styles', 'fontWeight', v)}>
                    <SelectTrigger><SelectValue placeholder="Font Weight" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="600">600</SelectItem>
                        <SelectItem value="700">700</SelectItem>
                        <SelectItem value="800">800</SelectItem>
                        <SelectItem value="900">900</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Text Align</Label>
                <Select value={styles?.textAlign as string || 'left'} onValueChange={(v) => onUpdate('styles', 'textAlign', v)}>
                    <SelectTrigger><SelectValue placeholder="Text Align" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </>
    );
};

export default TypographyProperties;
