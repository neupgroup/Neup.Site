

import React, { FC } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import type { CanvasElementData } from '@/schemas/canvas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TypographyPropertiesProps {
    element: CanvasElementData;
    onUpdate: (key: string, value: any) => void;
}

const headingStyles: Record<string, { fontSize: string, fontWeight: string }> = {
    'h1': { fontSize: '2.5rem', fontWeight: 'bold' },
    'h2': { fontSize: '2rem', fontWeight: 'bold' },
    'h3': { fontSize: '1.75rem', fontWeight: 'bold' },
    'h4': { fontSize: '1.5rem', fontWeight: 'bold' },
    'h5': { fontSize: '1.25rem', fontWeight: 'bold' },
    'h6': { fontSize: '1rem', fontWeight: 'bold' },
    'p': { fontSize: '1rem', fontWeight: 'normal' },
}

const TypographyProperties: FC<TypographyPropertiesProps> = ({ element, onUpdate }) => {
    const properties = element.properties || {};
    const colorInputRef = React.createRef<HTMLInputElement>();

    const handleTagChange = (tag: string) => {
        onUpdate('tag', tag);
        const styles = headingStyles[tag];
        if (styles) {
            onUpdate('fontSize', styles.fontSize);
            onUpdate('fontWeight', styles.fontWeight);
        }
    }
    
    return (
        <AccordionItem value="typography">
            <AccordionTrigger className="text-sm font-medium">Typography</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                {element.type === 'text' && (
                    <div className="space-y-2">
                        <Label>Tag</Label>
                        <Select value={properties['tag'] as string || 'p'} onValueChange={handleTagChange}>
                            <SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="p">Paragraph</SelectItem>
                                <SelectItem value="h1">Heading 1</SelectItem>
                                <SelectItem value="h2">Heading 2</SelectItem>
                                <SelectItem value="h3">Heading 3</SelectItem>
                                <SelectItem value="h4">Heading 4</SelectItem>
                                <SelectItem value="h5">Heading 5</SelectItem>
                                <SelectItem value="h6">Heading 6</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            value={properties['color'] as string || ''} 
                            onChange={(e) => onUpdate('color', e.target.value)} 
                            placeholder="#000000" 
                        />
                        <Button variant="tertiary" size="icon" onClick={() => colorInputRef.current?.click()}>
                            🎨
                            <input
                                ref={colorInputRef}
                                type="color"
                                value={typeof properties['color'] === 'string' ? properties['color'] : '#000000'}
                                onChange={(e) => onUpdate('color', e.target.value)}
                                className="absolute h-0 w-0 opacity-0"
                            />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input
                        value={properties['fontSize'] as string || ''}
                        onChange={(e) => onUpdate('fontSize', e.target.value)}
                        placeholder="e.g., 16px"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Font Weight</Label>
                    <Select value={properties['fontWeight'] as string || 'normal'} onValueChange={(v) => onUpdate('fontWeight', v)}>
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
                    <Select value={properties['textAlign'] as string || 'left'} onValueChange={(v) => onUpdate('textAlign', v)}>
                        <SelectTrigger><SelectValue placeholder="Text Align" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="justify">Justify</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default TypographyProperties;
