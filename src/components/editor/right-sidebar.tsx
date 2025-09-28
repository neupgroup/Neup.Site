import React, { FC, useEffect, useState, useCallback } from 'react';
import { Settings } from 'lucide-react';
import type { CanvasElementData, EditorProperty } from '@/lib/schemas';
import { elementDefinitions } from '@/elements';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

interface RightSidebarProps {
  selectedElementId: string | null;
  elements: CanvasElementData[];
  updateElement: (id: string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  deleteElement: (id: string) => void;
  updateElementId: (oldId: string, newId: string) => void;
}

const RightSidebar: FC<RightSidebarProps> = ({ selectedElementId, elements, updateElement, deleteElement, updateElementId }) => {
  const findElementRecursive = (id: string, els: CanvasElementData[]): CanvasElementData | undefined => {
    for (const el of els) {
      if (el.id === id) return el;
      if (el.children) {
        const found = findElementRecursive(id, el.children);
        if (found) return found;
      }
    }
  };

  const selectedElement = selectedElementId ? findElementRecursive(selectedElementId, elements) : undefined;
  const elementDef = selectedElement ? elementDefinitions[selectedElement.type] : undefined;
  const { toast } = useToast();

  const [elementId, setElementId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setElementId(selectedElement?.id);
  }, [selectedElement]);
  
  const handleIdChange = (value: string) => {
      setElementId(value);
  }
  
  const handleIdBlur = () => {
    if (selectedElementId && elementId) {
        updateElementId(selectedElementId, elementId);
    }
  }

  const handleUpdate = useCallback((key: string, value: any, recordHistory = true) => {
    if (!selectedElementId || !selectedElement) return;

    const newProperties = {
      ...selectedElement.properties,
      [key]: value
    };
    
    updateElement(selectedElementId, newProperties, recordHistory);
  }, [selectedElementId, selectedElement, updateElement]);

  const handleUpdateWithDebounce = (key: string, value: any) => {
      handleUpdate(key, value, false);
  };
  
  const renderInput = (property: EditorProperty, value: any, onChange: (value: any) => void) => {
    switch (property.inputType) {
        case 'text':
            return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={property.placeholder} />;
        case 'textarea':
            return <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={property.placeholder} rows={property.options?.rows || 3} />;
        case 'color':
            const colorInputRef = React.createRef<HTMLInputElement>();
            return (
                <div className="flex items-center gap-2">
                    <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={property.placeholder} />
                    <Button variant="outline" size="icon" onClick={() => colorInputRef.current?.click()}>
                        🎨
                        <input
                            ref={colorInputRef}
                            type="color"
                            value={value || '#000000'}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute h-0 w-0 opacity-0"
                        />
                    </Button>
                </div>
            );
        case 'select':
            return (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger>
                        <SelectValue placeholder={property.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {property.options?.selectOptions?.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        default:
            return <p>Unknown input type</p>;
    }
  }

  if (!selectedElement || !elementDef) {
    return (
      <aside className="w-80 border-l bg-card">
        <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground p-4">
          <Settings className="h-10 w-10 mb-4" />
          <p className="font-semibold">Customize Element</p>
          <p>Select an element on the canvas to edit its styles and properties.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l bg-card">
      <ScrollArea className="h-full">
        <Accordion type="multiple" className="w-full" defaultValue={['attributes', 'layout', 'spacing']}>
            <AccordionItem value="attributes">
                <AccordionTrigger className="px-4 text-sm font-medium">Attributes</AccordionTrigger>
                <AccordionContent className="px-4 space-y-4">
                    <div className="space-y-2">
                        <Label>ID</Label>
                        <Input value={elementId || ''} onChange={e => handleIdChange(e.target.value)} onBlur={handleIdBlur} />
                    </div>
                </AccordionContent>
            </AccordionItem>
            
            {elementDef.editorProperties?.map(group => {
                let shouldShowGroup = true;
                if (group.showIf) {
                    const conditionValue = selectedElement.properties[group.showIf.key];
                    shouldShowGroup = conditionValue === group.showIf.value;
                }
                if (!shouldShowGroup) return null;

                return (
                    <AccordionItem key={group.groupName} value={group.groupName.toLowerCase()}>
                        <AccordionTrigger className="px-4 text-sm font-medium">{group.groupName}</AccordionTrigger>
                        <AccordionContent className="px-4 space-y-4">
                            {group.properties.map(prop => {
                                let shouldShowProp = true;
                                if (prop.showIf) {
                                     const conditionValue = selectedElement.properties[prop.showIf.key];
                                     shouldShowProp = conditionValue === prop.showIf.value;
                                }
                                if (!shouldShowProp) return null;

                                return (
                                    <div key={prop.key} className="space-y-2">
                                        <Label>{prop.label}</Label>
                                        {renderInput(prop, selectedElement.properties[prop.key], (value) => handleUpdate(prop.key, value))}
                                    </div>
                                )
                            })}
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
      </ScrollArea>
    </aside>
  );
};

export default RightSidebar;
