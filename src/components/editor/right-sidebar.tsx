
import React, { FC, useEffect, useState, useCallback, Fragment } from 'react';
import { Settings } from 'lucide-react';
import type { CanvasElementData } from '@/lib/schemas';
import { elementDefinitions } from '@/elements';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import LayoutProperties from './properties/layout';
import SpacingProperties from './properties/spacing';
import TypographyProperties from './properties/typography';
import BackgroundProperties from './properties/background';
import BorderProperties from './properties/border';
import ContentProperties from './properties/content';
import ImageProperties from './properties/image';
import FlexboxProperties from './properties/flexbox';
import GlobalSettings from './properties/global-settings';
import ShadowProperties from './properties/shadow';

interface RightSidebarProps {
  selectedElementId: string | null;
  elements: CanvasElementData[];
  updateElement: (id: string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  deleteElement: (id: string) => void;
  updateElementId: (oldId: string, newId: string) => void;
  onUpdateAllElements: (elements: CanvasElementData[]) => void;
}

const propertyComponents: Record<string, React.FC<any>> = {
  content: ContentProperties,
  image: ImageProperties,
  layout: LayoutProperties,
  spacing: SpacingProperties,
  typography: TypographyProperties,
  background: BackgroundProperties,
  borders: BorderProperties,
  effects: ShadowProperties,
};

const RightSidebar: FC<RightSidebarProps> = ({ selectedElementId, elements, updateElement, deleteElement, updateElementId, onUpdateAllElements }) => {
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


  if (!selectedElement || !elementDef) {
    return (
      <aside className="w-80 border-l bg-card">
        <GlobalSettings elements={elements} onUpdateAllElements={onUpdateAllElements} />
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l bg-card">
      <ScrollArea className="h-full">
        <Accordion type="single" collapsible className="w-full" defaultValue="attributes">
            <AccordionItem value="attributes">
                <AccordionTrigger className="px-4 text-sm font-medium">Attributes</AccordionTrigger>
                <AccordionContent className="px-4 space-y-4">
                    <div className="space-y-2">
                        <Label>ID</Label>
                        <Input value={elementId || ''} onChange={e => handleIdChange(e.target.value)} onBlur={handleIdBlur} />
                    </div>
                    <div className="space-y-2">
                        <Label>Class Name</Label>
                        <Input 
                            value={selectedElement.properties?.['className'] || ''}
                            onChange={(e) => handleUpdate('className', e.target.value)} 
                            placeholder="e.g. text-center my-4"
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>
            
            {elementDef.editorProperties?.map(groupKey => {
                const PropertyComponent = propertyComponents[groupKey];
                
                if (!PropertyComponent) {
                    console.warn(`No property component found for group: ${groupKey}`);
                    return null;
                }

                return (
                    <PropertyComponent key={groupKey} element={selectedElement} onUpdate={handleUpdate} />
                );
            })}
             {selectedElement.properties?.display === 'flex' && (
                <FlexboxProperties element={selectedElement} onUpdate={handleUpdate} />
            )}
        </Accordion>
      </ScrollArea>
    </aside>
  );
};

export default RightSidebar;
