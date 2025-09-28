import React, { FC, useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import type { CanvasElementData } from '@/lib/schemas';
import { elementDefinitions } from '@/elements';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

import SpacingProperties from './properties/spacing';
import TypographyProperties from './properties/typography';
import BackgroundProperties from './properties/background';
import BorderProperties from './properties/border';
import LayoutProperties from './properties/layout';
import FlexboxProperties from './properties/flexbox';
import ContentProperties from './properties/content';
import ImageProperties from './properties/image';
import LinkProperties from './properties/link';

interface RightSidebarProps {
  selectedElementId: string | null;
  elements: CanvasElementData[];
  updateElement: (id: string, newStyles?: React.CSSProperties, newProps?: Record<string, any>, newContent?: string, newCustomCss?: string, newClassName?: string, newHtmlContent?: string, recordHistory?: boolean) => void;
  deleteElement: (id: string) => void;
  updateElementId: (oldId: string, newId: string) => void;
}

const propertyComponents: { [key: string]: React.FC<any> } = {
    'Spacing': SpacingProperties,
    'Typography': TypographyProperties,
    'Background': BackgroundProperties,
    'Borders': BorderProperties,
    'Layout': LayoutProperties,
    'Flexbox': FlexboxProperties,
    'Content': ContentProperties,
    'Image': ImageProperties,
    'Link': LinkProperties,
};

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

  const handleUpdate = (
    updateType: 'styles' | 'props' | 'content',
    key: string,
    value: any
  ) => {
    if (!selectedElementId) return;

    if (updateType === 'styles') {
      updateElement(selectedElementId, { ...selectedElement?.styles, [key]: value });
    } else if (updateType === 'props') {
      updateElement(selectedElementId, undefined, { ...selectedElement?.props, [key]: value });
    } else if (updateType === 'content') {
        updateElement(selectedElementId, undefined, undefined, value);
    }
  };

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
        <Accordion type="single" collapsible className="w-full" defaultValue="attributes">
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
                const PropertyComponent = propertyComponents[group.groupName];
                if (!PropertyComponent) return null;

                // Conditional rendering logic for flexbox
                if (group.groupName === 'Flexbox' && selectedElement.styles?.display !== 'flex') {
                    return null;
                }

                return (
                    <AccordionItem key={group.groupName} value={group.groupName}>
                        <AccordionTrigger className="px-4 text-sm font-medium">{group.groupName}</AccordionTrigger>
                        <AccordionContent className="px-4 space-y-4">
                            <PropertyComponent
                                element={selectedElement}
                                onUpdate={handleUpdate}
                            />
                        </AccordionContent>
                    </AccordionItem>
                );
            })}

        </Accordion>
      </ScrollArea>
    </aside>
  );
};

export default RightSidebar;
