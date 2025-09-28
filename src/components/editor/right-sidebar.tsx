import React, { FC, useEffect, useState, useRef } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import type { CanvasElementData, EditorProperty } from '@/lib/schemas';
import { elementDefinitions } from '@/elements';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface RightSidebarProps {
  selectedElementId: string | null;
  elements: CanvasElementData[];
  updateElement: (id: string, newStyles?: React.CSSProperties, newProps?: Record<string, any>, newContent?: string, newCustomCss?: string, newClassName?: string, newHtmlContent?: string, recordHistory?: boolean) => void;
  deleteElement: (id: string) => void;
  updateElementId: (oldId: string, newId: string) => void;
}

const renderInput = (
    property: EditorProperty,
    value: any,
    handleStyleChange: (prop: keyof React.CSSProperties, val: string) => void,
    handlePropChange: (prop: string, val: any) => void,
    handleContentChange: (val: string) => void,
    handleHtmlContentChange: (val: string) => void,
    handleCustomCssChange: (val: string) => void,
    handleClassNameChange: (val: string) => void
) => {
    
    const onChange = (val: any) => {
        if(property.target === 'styles') {
            handleStyleChange(property.key as keyof React.CSSProperties, val);
        } else if (property.target === 'props') {
            handlePropChange(property.key, val);
        } else if (property.target === 'content') {
            handleContentChange(val);
        } else if (property.target === 'htmlContent') {
            handleHtmlContentChange(val);
        } else if (property.target === 'customCss') {
            handleCustomCssChange(val);
        } else if (property.target === 'className') {
            handleClassNameChange(val);
        }
    };
    
    switch (property.inputType) {
        case 'text':
            return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={property.placeholder} />;
        case 'textarea':
            return <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={property.placeholder} rows={property.options?.rows || 5} />;
        case 'select':
            return (
                <Select value={value || ''} onValueChange={onChange}>
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
                            value={typeof value === 'string' ? value : '#000000'}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute h-0 w-0 opacity-0"
                        />
                    </Button>
                </div>
            )
        default:
            return null;
    }
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
  
  // This state will hold the current values of all properties for the selected element
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({});


  useEffect(() => {
    if (selectedElement && elementDef) {
        const newValues: Record<string, any> = {};
        elementDef.editorProperties?.forEach(group => {
            group.properties.forEach(prop => {
                if (prop.target === 'styles' && selectedElement.styles) {
                    newValues[prop.key] = selectedElement.styles[prop.key as keyof React.CSSProperties];
                } else if (prop.target === 'props' && selectedElement.props) {
                    newValues[prop.key] = selectedElement.props[prop.key];
                } else {
                    newValues[prop.key] = (selectedElement as any)[prop.target];
                }
            })
        });
        setPropertyValues(newValues);
        setElementId(selectedElement.id);
    } else {
        setPropertyValues({});
        setElementId(undefined);
    }
  }, [selectedElement, elementDef]);

  const updatePropertyValue = (key: string, value: any, target: EditorProperty['target']) => {
      const newValues = { ...propertyValues, [key]: value };
      setPropertyValues(newValues);

      if (selectedElementId) {
          if (target === 'styles') {
              updateElement(selectedElementId, { ...selectedElement?.styles, [key]: value });
          } else if (target === 'props') {
              updateElement(selectedElementId, undefined, { ...selectedElement?.props, [key]: value });
          } else if (target === 'content') {
              updateElement(selectedElementId, undefined, undefined, value);
          } else if (target === 'htmlContent') {
              updateElement(selectedElementId, undefined, undefined, undefined, undefined, undefined, value);
          } else if (target === 'customCss') {
              updateElement(selectedElementId, undefined, undefined, undefined, value);
          } else if (target === 'className') {
              updateElement(selectedElementId, undefined, undefined, undefined, undefined, value);
          }
      }
  }


  const handleIdChange = (value: string) => {
      setElementId(value);
  }
  
  const handleIdBlur = () => {
    if (selectedElementId && elementId) {
        updateElementId(selectedElementId, elementId);
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
        <Accordion type="single" collapsible className="w-full" defaultValue="element-id">
            <AccordionItem value="element-id">
              <AccordionTrigger className="px-4 text-sm font-medium">Element</AccordionTrigger>
              <AccordionContent className="px-4 space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground break-words">{selectedElement.id}</p>
                    <div className="flex gap-2">
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteElement(selectedElement.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="attributes">
                <AccordionTrigger className="px-4 text-sm font-medium">Attributes</AccordionTrigger>
                <AccordionContent className="px-4 space-y-4">
                    <div className="space-y-2">
                        <Label>ID</Label>
                        <Input value={elementId || ''} onChange={e => handleIdChange(e.target.value)} onBlur={handleIdBlur} />
                    </div>
                </AccordionContent>
            </AccordionItem>

            {elementDef.editorProperties?.map(group => (
                <AccordionItem key={group.groupName} value={group.groupName}>
                    <AccordionTrigger className="px-4 text-sm font-medium">{group.groupName}</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                        {group.properties.map(prop => (
                            <div key={prop.key} className="space-y-2">
                                <Label>{prop.label}</Label>
                                {renderInput(
                                    prop,
                                    propertyValues[prop.key],
                                    (p, v) => updatePropertyValue(p as string, v, 'styles'),
                                    (p, v) => updatePropertyValue(p, v, 'props'),
                                    (v) => updatePropertyValue(prop.key, v, 'content'),
                                    (v) => updatePropertyValue(prop.key, v, 'htmlContent'),
                                    (v) => updatePropertyValue(prop.key, v, 'customCss'),
                                    (v) => updatePropertyValue(prop.key, v, 'className'),
                                )}
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            ))}

        </Accordion>
      </ScrollArea>
    </aside>
  );
};

export default RightSidebar;
