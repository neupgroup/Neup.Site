
'use client';

import React, { FC, useEffect, useState, useCallback, Fragment } from 'react';
import { Settings, Database, ArrowUp, ArrowDown, Copy, Trash2, CornerUpLeft } from 'lucide-react';
import type { CanvasElementData } from '@/services/canvas/type';
import { elementDefinitions } from '@/components/elements';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import RepeaterProperties from './properties/repeater';
import DataBindingProperties from './properties/data-binding';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/core/hooks/use-toast';

interface RightSidebarProps {
  selectedElementId: string | null;
  elements: CanvasElementData[];
  updateElement: (id: string, newProperties: Record<string, any>, recordHistory?: boolean) => void;
  deleteElement: (id: string) => void;
  updateElementId: (oldId: string, newId: string) => void;
  onUpdateAllElements: (elements: CanvasElementData[]) => void;
  pageId?: string;
  onSave?: () => Promise<string | undefined>;
  onCopyElement: () => void;
  onPasteElement: () => void;
  onCutElement: () => void;
  onSelectElement: (id: string | null) => void;
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
  repeater: RepeaterProperties,
  databinding: DataBindingProperties,
};

const RightSidebar: FC<RightSidebarProps> = ({ 
    selectedElementId, 
    elements, 
    updateElement, 
    deleteElement, 
    updateElementId, 
    onUpdateAllElements, 
    pageId, 
    onSave,
    onCopyElement,
    onPasteElement,
    onCutElement,
    onSelectElement,
}) => {
  const findElementRecursive = (id: string, els: CanvasElementData[], parent?: CanvasElementData): {element: CanvasElementData, parent?: CanvasElementData} | undefined => {
    for (const el of els) {
      if (el.id === id) return {element: el, parent};
      if (el.children) {
        const found = findElementRecursive(id, el.children, el);
        if (found) return found;
      }
    }
    return undefined;
  };

  const selectedElementResult = selectedElementId ? findElementRecursive(selectedElementId, elements) : undefined;
  const selectedElement = selectedElementResult?.element;
  const selectedElementParent = selectedElementResult?.parent;
  const elementDef = selectedElement ? elementDefinitions[selectedElement.type] : undefined;
  
  const [elementId, setElementId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

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

  const handleDataBindingUpdate = (bindings: Record<string, string>) => {
    if (!selectedElementId || !selectedElement) return;
    
    setElements(prev => {
        const clonedPrev = JSON.parse(JSON.stringify(prev));
        const updateRecursively = (els: CanvasElementData[]): CanvasElementData[] => {
            return els.map(el => {
            if (el.id === selectedElementId) {
                return { ...el, dataBindings: bindings };
            }
            if (el.children) {
                return { ...el, children: updateRecursively(el.children) };
            }
            return el;
            });
        };
        const newElements = updateRecursively(clonedPrev);
        onUpdateAllElements(newElements);
        return newElements;
    });
  };

  const setElements = (updater: (prev: CanvasElementData[]) => CanvasElementData[]) => {
      onUpdateAllElements(updater(elements));
  }

  if (!selectedElement || !elementDef) {
    return (
      <aside className="w-80 border-l bg-card">
        <GlobalSettings 
            elements={elements} 
            onUpdateAllElements={onUpdateAllElements} 
            pageId={pageId}
            onSave={onSave}
        />
      </aside>
    );
  }

  const isContainer = ['section', 'div', 'container', 'form', 'list'].includes(selectedElement.type);

  const editorProperties = [...(elementDef.editorProperties || []), 'databinding'];


  return (
    <aside className="w-80 border-l bg-card">
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-2 p-4 border-b">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold font-headline truncate">{selectedElement.id}</h3>
            </div>
            <p className="text-sm text-muted-foreground">Type: {selectedElement.type}</p>
        </div>

        <div className="p-4">
            <Accordion type="single" collapsible className="w-full">
                 <AccordionItem value="attributes">
                    <AccordionTrigger className="text-sm font-medium">Attributes</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
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
                
                {editorProperties.map(groupKey => {
                    const PropertyComponent = propertyComponents[groupKey];
                    
                    if (!PropertyComponent) {
                        console.warn(`No property component found for group: ${groupKey}`);
                        return null;
                    }

                    if (groupKey === 'content' || groupKey === 'image' || groupKey === 'repeater' || groupKey === 'databinding') {
                        return (
                            <PropertyComponent 
                                key={groupKey} 
                                element={selectedElement} 
                                onUpdate={handleUpdate} 
                                onDataBindingUpdate={handleDataBindingUpdate} 
                            />
                        );
                    }

                    return (
                        <PropertyComponent key={groupKey} element={selectedElement} onUpdate={handleUpdate} />
                    );
                })}
                {selectedElement.properties?.display === 'flex' && (
                    <FlexboxProperties element={selectedElement} onUpdate={handleUpdate} />
                )}
            </Accordion>
        </div>
      </ScrollArea>
    </aside>
  );
};

export default RightSidebar;
