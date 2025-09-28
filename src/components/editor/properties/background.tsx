import { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CanvasElementData } from '@/lib/schemas';

interface BackgroundPropertiesProps {
    element: CanvasElementData;
    onUpdate: (updateType: 'styles', key: string, value: any) => void;
}

const BackgroundProperties: FC<BackgroundPropertiesProps> = ({ element, onUpdate }) => {
    const { styles } = element;
    const colorInputRef = React.createRef<HTMLInputElement>();
    
    return (
        <>
            <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        value={styles?.backgroundColor as string || ''} 
                        onChange={(e) => onUpdate('styles', 'backgroundColor', e.target.value)} 
                        placeholder="#ffffff" 
                    />
                    <Button variant="outline" size="icon" onClick={() => colorInputRef.current?.click()}>
                        🎨
                        <input
                            ref={colorInputRef}
                            type="color"
                            value={typeof styles?.backgroundColor === 'string' ? styles.backgroundColor : '#ffffff'}
                            onChange={(e) => onUpdate('styles', 'backgroundColor', e.target.value)}
                            className="absolute h-0 w-0 opacity-0"
                        />
                    </Button>
                </div>
            </div>
        </>
    );
};

export default BackgroundProperties;
