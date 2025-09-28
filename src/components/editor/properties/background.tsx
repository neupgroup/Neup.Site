import React, { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CanvasElementData } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface BackgroundPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const BackgroundProperties: FC<BackgroundPropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};
    const colorInputRef = React.createRef<HTMLInputElement>();
    
    return (
        <AccordionItem value="background">
            <AccordionTrigger className="px-4 text-sm font-medium">Background</AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
                <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            value={properties['background.backgroundColor'] as string || ''} 
                            onChange={(e) => onUpdate('background.backgroundColor', e.target.value)} 
                            placeholder="#ffffff" 
                        />
                        <Button variant="outline" size="icon" onClick={() => colorInputRef.current?.click()}>
                            🎨
                            <input
                                ref={colorInputRef}
                                type="color"
                                value={typeof properties['background.backgroundColor'] === 'string' ? properties['background.backgroundColor'] : '#ffffff'}
                                onChange={(e) => onUpdate('background.backgroundColor', e.target.value)}
                                className="absolute h-0 w-0 opacity-0"
                            />
                        </Button>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Background Image</Label>
                    <Input
                        value={properties['background.backgroundImage'] || ''}
                        onChange={(e) => onUpdate('background.backgroundImage', e.target.value)}
                        placeholder="url(...)"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Background Repeat</Label>
                    <Select value={properties['background.backgroundRepeat'] || 'no-repeat'} onValueChange={(v) => onUpdate('background.backgroundRepeat', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Repeat" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no-repeat">No Repeat</SelectItem>
                            <SelectItem value="repeat">Repeat</SelectItem>
                            <SelectItem value="repeat-x">Repeat X</SelectItem>
                            <SelectItem value="repeat-y">Repeat Y</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default BackgroundProperties;
